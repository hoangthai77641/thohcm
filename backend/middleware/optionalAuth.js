const jwt = require('jsonwebtoken');

module.exports = function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded;
  } catch (e) {
    // ignore invalid token in optional path
  }
  next();
};
