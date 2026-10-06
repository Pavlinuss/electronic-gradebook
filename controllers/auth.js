const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { UniqueConstraintError } = require('sequelize');
const { User } = require('../models');
const jwtSecret = require('../config/auth');

// Compare a hash even for unknown emails to reduce login timing differences.
const dummyHash = bcrypt.hashSync('not-a-user-password', 10);

function credentials(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some((key) => !['email', 'password'].includes(key))) return null;
  if (typeof body.email !== 'string' || typeof body.password !== 'string') return null;
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  // bcrypt only uses the first 72 bytes, not 72 characters.
  if (body.password.length < 8 || Buffer.byteLength(body.password, 'utf8') > 72) return null;
  return { email, password: body.password };
}

exports.register = async (req, res, next) => {
  const data = credentials(req.body);
  if (!data) return res.status(400).json({ error: 'Provide only a valid email and a password of at least 8 characters and at most 72 UTF-8 bytes' });
  try {
    if (await User.findOne({ where: { email: data.email } })) {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({ email: data.email, passwordHash, role: 'user' });
    res.status(201).json(user);
  } catch (error) {
    // The unique index also protects simultaneous registrations.
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Invalid registration data' });
    }
    next(error);
  }
};

exports.login = async (req, res) => {
  const data = credentials(req.body);
  if (!data) return res.status(400).json({ error: 'Invalid email or password format' });
  const user = await User.scope('withPassword').findOne({ where: { email: data.email } });
  const matches = await bcrypt.compare(data.password, user?.passwordHash || dummyHash);
  if (!user || !matches) return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret(), {
    algorithm: 'HS256', expiresIn: '1h',
  });
  res.set('Cache-Control', 'no-store').json({ token, tokenType: 'Bearer', expiresIn: 3600 });
};

exports.profile = (req, res) => res.set('Cache-Control', 'no-store').json(req.user);
