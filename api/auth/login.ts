import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage.js';
import { verifyPassword, generateToken } from '../../server/emailAuth.js';
import { loginSchema } from '../../shared/schema.js';
import { z } from 'zod';

// Load environment variables
if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    
    // Seed default data for existing users (non-blocking)
    console.log(`Checking/seeding default data for existing user: ${user.id}`);
    storage.seedDefaultData(user.id).catch(error => {
      console.error(`Error seeding default data for user ${user.id}:`, error);
    });
    
    // Generate JWT token
    const token = generateToken(user.id);

    return res.status(200).json({
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
    return res.status(500).json({ message: 'Login failed' });
  }
}