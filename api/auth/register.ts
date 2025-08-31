import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage.js';
import { hashPassword, generateToken } from '../../server/emailAuth.js';
import { registerSchema } from '../../shared/schema.js';
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

    // Seed default data for new user (critical for production)
    console.log(`Seeding default data for new user: ${user.id}`);
    try {
      await storage.seedDefaultData(user.id);
      console.log(`Successfully seeded default data for new user: ${user.id}`);
    } catch (error) {
      console.error(`Failed to seed default data for new user ${user.id}:`, error);
    }
    
    // Generate JWT token
    const token = generateToken(user.id);

    return res.status(201).json({
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
    return res.status(500).json({ message: 'Registration failed' });
  }
}