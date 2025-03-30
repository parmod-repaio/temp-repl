import { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { storage, extractModelData } from './storage';
// We need to keep the imports from schema for the type definitions
import { User, LoginData, InsertUser } from '@shared/schema';

// Add session types
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// JWT secret key (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Type definition for JWT payload
interface JwtPayload {
  userId: string;
  email: string;
}

// Type definition for authenticated request
export interface AuthRequest extends Request {
  user?: User | any; // Using any to accommodate Sequelize model structure
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare passwords
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Generate JWT token
export function generateToken(user: User | any): string {
  // Extract user data to make sure we have a plain object with the right properties
  const userData = extractModelData<User>(user);
  const payload: JwtPayload = {
    userId: userData.id,
    email: userData.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Authentication middleware
export function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // First check if user is already authenticated via session
  if (req.session && req.session.userId) {
    console.log('Auth - Session user ID:', req.session.userId);
    storage.getUserById(req.session.userId)
      .then(user => {
        if (user) {
          // Use the utility function from storage.ts
          const userData = extractModelData<User>(user);
          console.log('Auth - Found user by session, ID:', userData.id);
          
          // Store the user properly so it can be accessed later
          req.user = user;
          
          return next();
        }
        
        console.log('Auth - Session user not found, trying JWT');
        // If session user doesn't exist, try JWT auth
        authenticateWithJWT();
      })
      .catch(error => {
        console.error('Session authentication error:', error);
        authenticateWithJWT();
      });
  } else {
    // No session, try JWT auth
    console.log('Auth - No session, trying JWT');
    authenticateWithJWT();
  }
  
  // JWT authentication helper function
  function authenticateWithJWT() {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('Auth - No authorization header');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('Auth - Token missing');
      return res.status(401).json({ message: 'Token missing' });
    }

    try {
      console.log('Auth - Verifying token');
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      console.log('Auth - Token payload:', payload);
      
      // Get user from database
      storage.getUserById(payload.userId)
        .then(user => {
          if (!user) {
            console.log('Auth - User not found for token');
            return res.status(401).json({ message: 'Invalid token' });
          }
          
          // Use the utility function from storage.ts
          const userData = extractModelData<User>(user);
          console.log('Auth - Found user by token, ID:', userData.id);
          
          // Attach user to request
          req.user = user;
          
          // Also set session for future requests
          if (req.session) {
            req.session.userId = userData.id; // Use the extracted ID
          }
          
          next();
        })
        .catch(error => {
          console.error('JWT authentication error:', error);
          res.status(500).json({ message: 'Server error during authentication' });
        });
    } catch (error) {
      console.error('Auth - Token verification error:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
}

// Register user
export async function registerUser(userData: InsertUser): Promise<{ user: User; token: string }> {
  // Hash password
  const hashedPassword = await hashPassword(userData.password);
  
  // Create user with hashed password
  const user = await storage.createUser({
    ...userData,
    password: hashedPassword,
  });
  
  // Generate token
  const token = generateToken(user);
  
  return { user, token };
}

// Login user
export async function loginUser(loginData: LoginData): Promise<{ user: User; token: string }> {
  // Get user by email
  const user = await storage.getUserByEmail(loginData.email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Compare passwords
  const isPasswordValid = await comparePasswords(
    loginData.password,
    user.password
  );
  
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }
  
  // Generate token
  const token = generateToken(user);
  
  return { user, token };
}

// Setup authentication routes
export function setupAuth(app: Express) {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    store: storage.sessionStore,
  };

  // Setup session middleware
  app.use(session(sessionSettings));
  
  // Register endpoint
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { user, token } = await registerUser(req.body);
      
      // Extract clean user data
      const userData = extractModelData<User>(user);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = userData;
      
      res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Registration failed' });
    }
  });
  
  // Login endpoint
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { user, token } = await loginUser(req.body);
      
      // Extract clean user data
      const userData = extractModelData<User>(user);
      
      // Store user in session
      if (req.session) {
        req.session.userId = userData.id;
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = userData;
      
      res.status(200).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ message: error instanceof Error ? error.message : 'Login failed' });
    }
  });
  
  // Logout endpoint
  app.post('/api/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: 'Logout failed' });
      } else {
        res.status(200).json({ message: 'Logged out successfully' });
      }
    });
  });
  
  // Get current user endpoint
  app.get('/api/user', authenticateJWT, (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Extract clean user data
    const userData = extractModelData<User>(req.user);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = userData;
    
    res.status(200).json(userWithoutPassword);
  });
}
