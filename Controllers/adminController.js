const Tutor = require('../db/models/TutorModel');

// Get all tutors (with optional isVerified filter)
const getAllTutors = async (req, res) => {
  try {
    const { isVerified } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }

    // Get tutors with pagination
    const tutors = await Tutor.find(filter)
      .select('-password') // Exclude passwords
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Tutor.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: tutors.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tutors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify a tutor (admin-only)
const verifyTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;

    // Find and update tutor verification status
    const tutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { isVerified: true },
      { new: true, runValidators: true }
    ).select('-password');

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor not found' });
    }

    res.status(200).json({ success: true, data: tutor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTutors,
  verifyTutor
};