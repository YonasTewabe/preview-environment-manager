import { User } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenParts = token.split('_');

    if (tokenParts.length !== 3 || tokenParts[0] !== 'token') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = String(tokenParts[1] ?? "").trim();
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user from database
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'User account is not active' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

