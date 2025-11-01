import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorLogger } from '../utils/logger.js';

export const protect = async (req, res, next) => {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } else {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }
  } catch (error) {
    errorLogger('Auth middleware error', error);
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};
