const Student = require('../db/models/StudentModel');

// Get logged-in student's profile
const getStudentProfile = async (req, res) => {
  try {
    // Get student ID from JWT middleware
    const student = await Student.findById(req.user._id)
      .select('-password') // Exclude password field
      .populate('bookings'); // Populate bookings if needed

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update student profile (name, phone, etc.)
const updateStudentProfile = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // Prevent password update via this route (use auth route instead)
    if (password) {
      return res.status(400).json({ message: 'Use /auth/update-password to change password' });
    }

    // Update student
    const updatedStudent = await Student.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true } // Return updated doc and validate data
    ).select('-password');

    res.status(200).json(updatedStudent);
  } catch (error) {
    // Handle duplicate email/username errors
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
};