const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getTutorProfile, updateTutorProfile, getTutorById, getAllTutors, getRecommendedTutors } = require('../controllers/tutorController');

const router = express.Router();

// Public Routes
router.get('/', getAllTutors); // Search tutors (filter by subject, location, etc.)
router.get('/recommended', getRecommendedTutors); // Top-rated tutors


// Protected Routes
router.get('/me', protect, getTutorProfile); // Get logged-in tutor's profile
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Get original extension
    cb(null, file.fieldname + '-' + uniqueSuffix + ext); // e.g., image-123456789.jpg
  }
});

const upload = multer({ storage: storage });
// In your router setup
// Replace existing PATCH routes with:
router.patch('/me', protect, upload.single('image'), updateTutorProfile); // Update tutor profile
//public Routes
router.get('/:tutorId', getTutorById); // Get tutor details by ID
module.exports = router;