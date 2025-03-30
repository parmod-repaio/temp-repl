import { Router } from 'express';
import { AuthRequest, authenticateJWT } from '../auth';
import { storage } from '../storage';
import { insertCustomerSchema } from '@shared/schema';

const router = Router();

// Create a new customer
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Validate request body
    const validatedData = insertCustomerSchema.parse({
      ...req.body,
      userId: req.user.id,
    });
    
    // Verify customer list exists and belongs to user
    const customerList = await storage.getCustomerListById(
      validatedData.customerListId,
      req.user.id
    );
    
    if (!customerList) {
      return res.status(404).json({ message: 'Customer list not found' });
    }
    
    // Create customer
    const customer = await storage.createCustomer(validatedData);
    
    res.status(201).json(customer);
  } catch (error: any) {
    console.error('Customer creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    
    res.status(400).json({ message: error.message || 'Customer creation failed' });
  }
});

// Get all customers for the current user
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const customers = await storage.getCustomers(req.user.id);
    res.status(200).json(customers);
  } catch (error: any) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve customers' });
  }
});

// Get a specific customer by ID
router.get('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    const customer = await storage.getCustomerById(id, req.user.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json(customer);
  } catch (error: any) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve customer' });
  }
});

// Update a customer
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if customer exists and belongs to the user
    const customer = await storage.getCustomerById(id, req.user.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Validate request body
    const validatedData = insertCustomerSchema.partial().parse({
      ...req.body,
      userId: req.user.id,
    });
    
    // If changing customer list, verify the new list exists and belongs to user
    if (validatedData.customerListId && validatedData.customerListId !== customer.customerListId) {
      const customerList = await storage.getCustomerListById(
        validatedData.customerListId,
        req.user.id
      );
      
      if (!customerList) {
        return res.status(404).json({ message: 'Customer list not found' });
      }
    }
    
    // Update customer
    const updatedCustomer = await storage.updateCustomer(id, validatedData);
    
    res.status(200).json(updatedCustomer);
  } catch (error: any) {
    console.error('Update customer error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    
    res.status(400).json({ message: error.message || 'Customer update failed' });
  }
});

// Delete a customer
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if customer exists and belongs to the user
    const customer = await storage.getCustomerById(id, req.user.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Delete customer
    await storage.deleteCustomer(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete customer' });
  }
});

export default router;
