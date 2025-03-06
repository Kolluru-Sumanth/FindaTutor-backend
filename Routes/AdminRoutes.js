const express = require('express');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { getAllTutors, verifyTutor } = require('../Controllers/adminController');

const router = express.Router();

// Admin Routes
router.get('/tutors', protect, isAdmin, getAllTutors); // Get all tutors
router.patch('/tutors/:tutorId/verify', protect, isAdmin, verifyTutor); // Verify a tutor

module.exports = router;