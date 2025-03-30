import { Router } from 'express';
import { AuthRequest, authenticateJWT, comparePasswords, hashPassword } from '../auth';
import { storage } from '../storage';
import { updateProfileSchema } from '@shared/schema';

const router = Router();

// Get user profile
router.get('/', authenticateJWT, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Remove password from response
  const { password, ...userWithoutPassword } = req.user;
  
  res.status(200).json(userWithoutPassword);
});

// Update user profile
router.put('/', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);
    
    // Verify current password
    const isPasswordValid = await comparePasswords(
      validatedData.currentPassword,
      req.user.password
    );
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.name) {
      updateData.name = validatedData.name;
    }
    
    if (validatedData.email) {
      updateData.email = validatedData.email;
    }
    
    if (validatedData.newPassword) {
      updateData.password = await hashPassword(validatedData.newPassword);
    }
    
    // Update user
    const updatedUser = await storage.updateUser(req.user.id, updateData);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Profile update error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    
    res.status(400).json({ message: error.message || 'Profile update failed' });
  }
});

export default router;
