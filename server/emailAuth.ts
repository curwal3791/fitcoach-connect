import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import { registerSchema, loginSchema, type User } from '@shared/schema';
import { z } from 'zod';

// JWT Secret - in production, use a secure random secret
const JWT_SECRET = process.env.JWT_SECRET || 'fitflow-demo-secret-key-change-in-production';
const SALT_ROUNDS = 12;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function generateEmailVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check session first
    if (req.session && (req.session as any).userId) {
      const user = await storage.getUser((req.session as any).userId);
      if (user) {
        (req as any).user = user;
        return next();
      }
    }

    // Check JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await storage.getUser(decoded.userId);
        if (user) {
          (req as any).user = user;
          return next();
        }
      }
    }

    return res.status(401).json({ message: 'Unauthorized' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export async function setupAuth(app: Express) {
  app.set('trust proxy', 1);
  app.use(getSession());

  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const passwordHash = await hashPassword(validatedData.password);
      
      // Create user
      const user = await storage.createUser({
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName || undefined,
        lastName: validatedData.lastName || undefined,
        emailVerified: true, // For demo purposes, skip email verification
      });

      // Create session
      (req.session as any).userId = user.id;
      
      // Generate JWT token
      const token = generateToken(user.id);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Create session
      (req.session as any).userId = user.id;
      
      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    });
  });
}