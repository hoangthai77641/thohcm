const jwt = require('jsonwebtoken');

module.exports = function (roles = []) {
  // roles: array hoặc string
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
      // Verify JWT with strong secret requirement
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Additional security checks
      if (!decoded.id || !decoded.role) {
        return res.status(401).json({ message: 'Invalid token payload' });
      }
      
      // Check token expiration more strictly
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      req.user = decoded;
      
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      } else {
        return res.status(500).json({ message: 'Authentication error' });
      }
    }
  };
};
