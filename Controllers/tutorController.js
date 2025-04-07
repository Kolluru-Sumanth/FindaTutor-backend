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
        select: 'studentId date status paymentStatus',
        populate: { path: 'studentId', select: 'name email' }
      })
      .lean(); // Convert to plain JavaScript object

    if (!tutor) throw new NotFoundError('Tutor not found');

    // Transform the rating object to a single value
    const transformedTutor = {
      ...tutor,
      rating: tutor.rating?.average || 0 // Use average rating
    };

    res.status(200).json(transformedTutor);
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

const updateTutorProfile = async (req, res) => {
  try {
    // Process image upload
    if (req.file) {
      // Replace backslashes with forward slashes (Windows fix)
      const filePath = req.file.path.replace(/\\/g, "/");
      // Store URL path like "/uploads/filename.jpg"
      req.body.profilePicture = `${filePath}`;
    }

    // Destructure updates (include profilePicture)
    const updates = (({ 
      name, 
      profession, 
      about, 
      price, 
      subjects, 
      locations, 
      availability,
      profilePicture // Match the field name in your schema
    }) => ({
      name,
      profession,
      about,
      price,
      subjects,
      locations,
      availability,
      profilePicture // Ensure this matches your Mongoose schema
    }))(req.body);

    const tutor = await Tutor.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.status(200).json(tutor);
  } catch (error) {
    // ... error handling
  }
};

module.exports = {
  getAllTutors,
  getRecommendedTutors,
  getTutorById,
  getTutorProfile,
  updateTutorProfile
};