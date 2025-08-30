import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple standalone register handler for testing
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

  console.log('Register endpoint hit:', { method: req.method, body: req.body });

  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // For testing - simulate successful registration
    const newUser = {
      id: `user-${Date.now()}`,
      email: email,
      firstName: firstName || 'New',
      lastName: lastName || 'User',
      profileImageUrl: null,
    };

    return res.status(201).json({
      user: newUser,
      token: `test-jwt-token-${newUser.id}`,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed', error: String(error) });
  }
}