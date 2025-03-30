import { Router } from 'express';
import { AuthRequest, authenticateJWT } from '../auth';
import { storage } from '../storage';
import { insertCustomerListSchema, csvCustomerSchema } from '@shared/schema';
import { upload } from '../middleware/upload';
import { parse } from 'csv-parse/sync';

const router = Router();

// Create a new customer list
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Validate request body
    const validatedData = insertCustomerListSchema.parse({
      ...req.body,
      userId: req.user.id,
    });
    
    // Create customer list
    const customerList = await storage.createCustomerList(validatedData);
    
    // Add activity record
    await storage.createActivity({
      title: 'Created new customer list',
      description: `"${customerList.name}"`,
      userId: req.user.id,
    });
    
    res.status(201).json(customerList);
  } catch (error: any) {
    console.error('Customer list creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    
    res.status(400).json({ message: error.message || 'Customer list creation failed' });
  }
});

// Get all customer lists for the current user
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const customerLists = await storage.getCustomerLists(req.user.id);
    res.status(200).json(customerLists);
  } catch (error: any) {
    console.error('Get customer lists error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve customer lists' });
  }
});

// Get a specific customer list by ID
router.get('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    const customerList = await storage.getCustomerListById(id, req.user.id);
    
    if (!customerList) {
      return res.status(404).json({ message: 'Customer list not found' });
    }
    
    res.status(200).json(customerList);
  } catch (error: any) {
    console.error('Get customer list error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve customer list' });
  }
});

// Update a customer list
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if customer list exists and belongs to the user
    const customerList = await storage.getCustomerListById(id, req.user.id);
    
    if (!customerList) {
      return res.status(404).json({ message: 'Customer list not found' });
    }
    
    // Validate request body
    const validatedData = insertCustomerListSchema.partial().parse({
      ...req.body,
      userId: req.user.id,
    });
    
    // Update customer list
    const updatedCustomerList = await storage.updateCustomerList(id, validatedData);
    
    res.status(200).json(updatedCustomerList);
  } catch (error: any) {
    console.error('Update customer list error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    
    res.status(400).json({ message: error.message || 'Customer list update failed' });
  }
});

// Delete a customer list
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if customer list exists and belongs to the user
    const customerList = await storage.getCustomerListById(id, req.user.id);
    
    if (!customerList) {
      return res.status(404).json({ message: 'Customer list not found' });
    }
    
    // Delete customer list
    await storage.deleteCustomerList(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error('Delete customer list error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete customer list' });
  }
});

// Upload CSV to customer list
router.post('/:id/upload-csv', authenticateJWT, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if customer list exists and belongs to the user
    const customerList = await storage.getCustomerListById(id, req.user.id);
    
    if (!customerList) {
      return res.status(404).json({ message: 'Customer list not found' });
    }
    
    // Parse CSV file
    const csvContent = req.file.buffer.toString('utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    // Validate and transform records
    const validatedRecords = [];
    const errors = [];
    
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        
        // Map CSV field names to schema field names
        const customerData = {
          name: record.name,
          email: record.email,
          phoneNumber: record.phone || record['phone_number'] || record.phoneNumber,
          status: record.status || 'active',
        };
        
        // Validate data
        const validatedData = csvCustomerSchema.parse(customerData);
        validatedRecords.push(validatedData);
      } catch (error) {
        errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Invalid data' });
      }
    }
    
    // Return error if no valid records found
    if (validatedRecords.length === 0) {
      return res.status(400).json({ 
        message: 'No valid records found in CSV file',
        errors,
      });
    }
    
    // Create customers from CSV data
    const customers = await storage.createCustomersFromCSV(
      validatedRecords,
      id,
      req.user.id
    );
    
    // Add activity record
    await storage.createActivity({
      title: 'Imported customers via CSV',
      description: `Added ${customers.length} customers to "${customerList.name}"`,
      userId: req.user.id,
    });
    
    res.status(201).json({ 
      message: `Successfully imported ${customers.length} customers`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('CSV upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to import customers from CSV' });
  }
});

// Get all customers in a customer list
router.get('/:id/customers', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if customer list exists and belongs to the user
    const customerList = await storage.getCustomerListById(id, req.user.id);
    
    if (!customerList) {
      return res.status(404).json({ message: 'Customer list not found' });
    }
    
    // Get customers for this list
    const customers = await storage.getCustomersByListId(id);
    
    res.status(200).json(customers);
  } catch (error: any) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve customers' });
  }
});

export default router;
