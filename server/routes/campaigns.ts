import { Router } from 'express';
import { AuthRequest, authenticateJWT } from '../auth';
import { storage } from '../storage';
import { insertCampaignSchema } from '@shared/schema';

const router = Router();

// Create a new campaign
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Extract customer list IDs from request
    const { customerListIds, ...campaignData } = req.body;
    
    // Validate campaign data
    const validatedCampaignData = insertCampaignSchema.parse({
      ...campaignData,
      userId: req.user.id,
    });
    
    // Validate customer list IDs
    if (!customerListIds || !Array.isArray(customerListIds) || customerListIds.length === 0) {
      return res.status(400).json({ message: 'At least one customer list must be selected' });
    }
    
    // Verify all customer lists exist and belong to user
    const customerLists = await Promise.all(
      customerListIds.map(listId => storage.getCustomerListById(listId, req.user.id))
    );
    
    // Check if any customer list was not found
    const notFoundIndex = customerLists.findIndex(list => !list);
    if (notFoundIndex !== -1) {
      return res.status(404).json({ 
        message: `Customer list with ID ${customerListIds[notFoundIndex]} not found` 
      });
    }
    
    // Create campaign
    const campaign = await storage.createCampaign(
      validatedCampaignData,
      customerListIds
    );
    
    // Add activity record
    await storage.createActivity({
      title: 'Launched new campaign',
      description: `"${campaign.name}" targeting ${customerListIds.length} customer list(s)`,
      userId: req.user.id,
    });
    
    res.status(201).json(campaign);
  } catch (error: any) {
    console.error('Campaign creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    
    res.status(400).json({ message: error.message || 'Campaign creation failed' });
  }
});

// Get all campaigns for the current user
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const campaigns = await storage.getCampaigns(req.user.id);
    res.status(200).json(campaigns);
  } catch (error: any) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve campaigns' });
  }
});

// Get a specific campaign by ID
router.get('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    const campaign = await storage.getCampaignById(id, req.user.id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Get all customer lists for this campaign
    const customerLists = await storage.getCustomerListsByCampaignId(id);
    
    res.status(200).json({
      ...campaign,
      customerLists,
    });
  } catch (error: any) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve campaign' });
  }
});

// Update a campaign
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if campaign exists and belongs to the user
    const campaign = await storage.getCampaignById(id, req.user.id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Extract customer list IDs from request
    const { customerListIds, ...campaignData } = req.body;
    
    // Validate campaign data
    const validatedCampaignData = insertCampaignSchema.partial().parse({
      ...campaignData,
      userId: req.user.id,
    });
    
    // If customer list IDs are provided, validate them
    if (customerListIds) {
      if (!Array.isArray(customerListIds) || customerListIds.length === 0) {
        return res.status(400).json({ message: 'At least one customer list must be selected' });
      }
      
      // Verify all customer lists exist and belong to user
      const customerLists = await Promise.all(
        customerListIds.map(listId => storage.getCustomerListById(listId, req.user.id))
      );
      
      // Check if any customer list was not found
      const notFoundIndex = customerLists.findIndex(list => !list);
      if (notFoundIndex !== -1) {
        return res.status(404).json({ 
          message: `Customer list with ID ${customerListIds[notFoundIndex]} not found` 
        });
      }
      
      // Update campaign and its customer lists
      await storage.updateCampaignWithLists(id, validatedCampaignData, customerListIds);
    } else {
      // Update just the campaign data
      await storage.updateCampaign(id, validatedCampaignData);
    }
    
    // Get updated campaign data
    const updatedCampaign = await storage.getCampaignById(id, req.user.id);
    const updatedCustomerLists = await storage.getCustomerListsByCampaignId(id);
    
    res.status(200).json({
      ...updatedCampaign,
      customerLists: updatedCustomerLists,
    });
  } catch (error: any) {
    console.error('Update campaign error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    
    res.status(400).json({ message: error.message || 'Campaign update failed' });
  }
});

// Delete a campaign
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if campaign exists and belongs to the user
    const campaign = await storage.getCampaignById(id, req.user.id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Delete campaign
    await storage.deleteCampaign(id);
    
    res.status(204).end();
  } catch (error: any) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete campaign' });
  }
});

// Get all customers in a campaign
router.get('/:id/customers', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { id } = req.params;
    
    // Check if campaign exists and belongs to the user
    const campaign = await storage.getCampaignById(id, req.user.id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Get customers for this campaign
    const customers = await storage.getCustomersByCampaignId(id);
    
    res.status(200).json(customers);
  } catch (error: any) {
    console.error('Get campaign customers error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve campaign customers' });
  }
});

export default router;
