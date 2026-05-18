const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken; // This will now contain { id, email, name, userRole, userParentId }
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Helper function to get the effective owner ID based on user role
requireAuth.getEffectiveOwnerId = (req) => { // Use userRole and userParentId
  return req.user.userRole === 'agent' ? req.user.userParentId : req.user.id;
};

module.exports = requireAuth;