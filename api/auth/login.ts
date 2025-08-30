import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple standalone login handler for testing
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

  console.log('Login endpoint hit:', { method: req.method, body: req.body });

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // For testing - just return success for the test account
    if (email === 'test@fitcoach.com' && password === 'password123') {
      return res.status(200).json({
        user: {
          id: 'test-user-id',
          email: 'test@fitcoach.com',
          firstName: 'Test',
          lastName: 'User',
          profileImageUrl: null,
        },
        token: 'test-jwt-token',
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed', error: String(error) });
  }
}