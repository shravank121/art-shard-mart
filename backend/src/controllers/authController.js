import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { errorLogger } from '../utils/logger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    errorLogger('Register user error', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    errorLogger('Login user error', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get platform stats (user count)
export const getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    errorLogger('Get stats error', error);
    res.status(500).json({ error: 'Failed to get stats', userCount: 0 });
  }
};
