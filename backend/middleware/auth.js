import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') 
    return res.status(403).json({ message: 'Admin only' });
  next();
};

export const roleCheck = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) 
    return res.status(403).json({ message: 'Access denied' });
  next();
};