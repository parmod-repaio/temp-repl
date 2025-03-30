import { Router } from 'express';
import { AuthRequest, authenticateJWT } from '../auth';
import { storage, extractModelData } from '../storage';
import { User } from '@shared/schema';

const router = Router();

// Get dashboard statistics
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  console.log("Dashboard Route - Full req.user:", req.user);
  
  if (!req.user) {
    console.log("Dashboard Route - No user in request");
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Use our utility function to extract data with proper typing
    const user = extractModelData<User>(req.user);
    const userId = user.id;
    console.log("Dashboard - User object:", user);
    console.log("Dashboard - User ID:", userId);
    
    if (!userId) {
      console.log("Dashboard - User ID is missing/undefined");
      return res.status(401).json({ message: 'User ID missing' });
    }
    
    // Get customer lists count
    console.log("Dashboard - Before getCustomerLists call");
    const customerLists = await storage.getCustomerLists(userId);
    const customerListsCount = customerLists.length;
    console.log("Dashboard - Customer Lists Count:", customerListsCount);
    
    // Get customers count
    console.log("Dashboard - Before getCustomers call");
    const customers = await storage.getCustomers(userId);
    const customersCount = customers.length;
    console.log("Dashboard - Customers Count:", customersCount);
    
    // Get active campaigns count
    console.log("Dashboard - Before getCampaigns call");
    const campaigns = await storage.getCampaigns(userId);
    const activeCampaignsCount = campaigns.filter(campaign => campaign.status === 'active').length;
    console.log("Dashboard - Active Campaigns Count:", activeCampaignsCount);
    
    // Get recent activities
    console.log("Dashboard - Before getRecentActivities call");
    const recentActivities = await storage.getRecentActivities(userId, 5);
    console.log("Dashboard - Recent Activities Count:", recentActivities.length);
    
    console.log("Dashboard - Sending response");
    res.status(200).json({
      customerLists: customerListsCount,
      customers: customersCount,
      activeCampaigns: activeCampaignsCount,
      recentActivities,
    });
  } catch (error: any) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve dashboard statistics' });
  }
});

export default router;
