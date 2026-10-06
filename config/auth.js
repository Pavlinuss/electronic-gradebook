require('dotenv').config();

module.exports = function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('Set JWT_SECRET to a random secret of at least 32 bytes in .env');
  }
  return secret;
};
