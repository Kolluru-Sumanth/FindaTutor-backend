const Tutor = require('../db/models/TutorModel');
const Booking = require('../db/models/BookingsModel');
const { NotFoundError } = require('../utils/error');

// Get all tutors (search/filter)
const getAllTutors = async (req, res) => {
  try {
    const { subject, location, minPrice, maxPrice, rating } = req.query;
    const filter = {};

    // Build filter based on query params
    if (subject) filter.subjects = subject;
    if (location) filter.locations = location;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (rating) filter['rating.average'] = { $gte: parseFloat(rating) };

    const tutors = await Tutor.find(filter)
      .select('-password -__v')
      .sort({ 'rating.average': -1 });

    res.status(200).json(tutors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recommended tutors (top-rated)
const getRecommendedTutors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const tutors = await Tutor.find({ isVerified: true })
      .select('-password -__v')
      .sort({ 'rating.average': -1 })
      .limit(limit);

    res.status(200).json(tutors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single tutor by ID
const getTutorById = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.tutorId)
      .select('-password -__v')
      .populate({
        path: 'bookings',
        select: 'date status paymentStatus',
        options: { sort: { date: -1 } }
      });

    if (!tutor) throw new NotFoundError('Tutor not found');
    res.status(200).json(tutor);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get logged-in tutor's profile
const getTutorProfile = async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.user._id)
      .select('-password -__v')
      .populate({
        path: 'bookings',
        select: 'studentId date status paymentStatus',
        populate: { path: 'studentId', select: 'name email' }
      });

    if (!tutor) throw new NotFoundError('Tutor not found');
    res.status(200).json(tutor);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Update tutor profile
const updateTutorProfile = async (req, res) => {
  try {
    const updates = (({ 
      name, 
      profession, 
      about, 
      price, 
      subjects, 
      locations, 
      availability 
    }) => ({
      name,
      profession,
      about,
      price,
      subjects,
      locations,
      availability
    }))(req.body);

    const tutor = await Tutor.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.status(200).json(tutor);
  } catch (error) {
    // Handle duplicate email/username errors
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTutors,
  getRecommendedTutors,
  getTutorById,
  getTutorProfile,
  updateTutorProfile
};