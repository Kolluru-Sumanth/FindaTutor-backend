const jwt = require('jsonwebtoken');
const Student = require('../db/models/StudentModel');
const Tutor = require('../db/models/TutorModel');
const Admin = require('../db/models/AdminModel');

// Protect routes (ensure user is logged in)
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await Student.findById(decoded.id) || await Tutor.findById(decoded.id) || await Admin.findById(decoded.id);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Ensure user is an admin
const isAdmin = async (req, res, next) => {
  const admin = await Admin.findById(req.user._id);
  if (!admin) return res.status(403).json({ message: 'Admin access required' });
  next();
};

module.exports = { protect, isAdmin };