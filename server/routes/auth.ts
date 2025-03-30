import { Router } from 'express';
import { loginSchema, insertUserSchema } from '@shared/schema';
import { registerUser, loginUser } from '../auth';

const router = Router();
router.get('/health', async (req, res) => {
  log("reached here")
  res.status(201).json({
    health: "ok",
  });
})
// Register a new user
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const validatedData = insertUserSchema.parse(req.body);

    // Register user
    const { user, token } = await registerUser(validatedData);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Return user and token
    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }

    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const { user, token } = await loginUser(validatedData);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Return user and token
    res.status(200).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }

    res.status(401).json({ message: error.message || 'Login failed' });
  }
});

export default router;
