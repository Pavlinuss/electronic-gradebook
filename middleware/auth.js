const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtSecret = require('../config/auth');

exports.authenticate = async (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('Authorization') || '');
  if (!match) return res.status(401).json({ error: 'Bearer token is required' });
  let decoded;
  const secret = jwtSecret();
  try {
    decoded = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (!Number.isInteger(decoded.id) || decoded.id <= 0 || !Number.isInteger(decoded.exp)) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }
  // Read the current role from the database so role changes take effect immediately.
  const user = await User.findByPk(decoded.id);
  if (!user) return res.status(401).json({ error: 'User no longer exists' });
  req.user = user;
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access is required' });
  next();
};
