
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = async (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin';
  const jwtSecret = process.env.JWT_SECRET || 'secret';

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign({ user: username }, jwtSecret, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
};

module.exports = { login };
