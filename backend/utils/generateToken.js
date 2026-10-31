const jwt = require('jsonwebtoken');

/**
 * Generate JSON Web Token
 * @param {string} id - User ObjectId
 * @param {string} role - User role
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_subscription_mgmt_2026_xyz',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

module.exports = generateToken;

