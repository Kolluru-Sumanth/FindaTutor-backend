const Student = require('../db/models/StudentModel');
const Tutor = require('../db/models/TutorModel');
const Admin = require('../db/models/AdminModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Student Signup
const studentSignup = async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;

    // Check if username/email exists
    const existingStudent = await Student.findOne({ $or: [{ username }, { email }] });
    if (existingStudent) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create student
    const student = await Student.create({
      name,
      username,
      email,
      password,
      phone,
    });

    // Generate JWT
    const token = generateToken(student._id, 'student');

    res.status(201).json({
      _id: student._id,
      name: student.name,
      email: student.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tutor Signup (Updated)
const tutorSignup = async (req, res) => {
  try {
    const { name, username, email, password, profession, availability } = req.body;

    // Validate availability
    if (!availability || availability.length === 0) {
      return res.status(400).json({ message: 'At least one availability slot is required' });
    }

    // Check for existing tutor
    const existingTutor = await Tutor.findOne({ $or: [{ username }, { email }] });
    if (existingTutor) throw new ConflictError('Username or email already exists');

    // Create tutor
    const tutor = await Tutor.create({
      name,
      username,
      email,
      password,
      profession,
      availability,
      isVerified: false
    });

    // Generate JWT
    const token = jwt.sign(
      { id: tutor._id, role: 'tutor' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      _id: tutor._id,
      name: tutor.name,
      email: tutor.email,
      isVerified: tutor.isVerified,
      token
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
// Student Login
const studentLogin = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Find student by email or username
    const student = await Student.findOne({
      $or: [{ email }, { username }],
    }).select('+password');

    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken(student._id, 'student');

    res.json({
      _id: student._id,
      name: student.name,
      email: student.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tutor Login
const tutorLogin = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Find tutor by email or username
    const tutor = await Tutor.findOne({
      $or: [{ email }, { username }],
    }).select('+password');

    if (!tutor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await tutor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken(tutor._id, 'tutor');

    res.json({
      _id: tutor._id,
      name: tutor.name,
      email: tutor.email,
      isVerified: tutor.isVerified,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout (client-side token invalidation)
const logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  studentSignup,
  tutorSignup,
  studentLogin,
  tutorLogin,
  logout,
};