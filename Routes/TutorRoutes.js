const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getTutorProfile, updateTutorProfile, getTutorById, getAllTutors, getRecommendedTutors } = require('../controllers/tutorController');

const router = express.Router();

// Public Routes
router.get('/', getAllTutors); // Search tutors (filter by subject, location, etc.)
router.get('/recommended', getRecommendedTutors); // Top-rated tutors


// Protected Routes
router.get('/me', protect, getTutorProfile); // Get logged-in tutor's profile
router.patch('/me', protect, updateTutorProfile); // Update tutor profile

//public Routes
router.get('/:tutorId', getTutorById); // Get tutor details by ID
module.exports = router;