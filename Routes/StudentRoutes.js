const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getStudentProfile, updateStudentProfile } = require('../Controllers/studentController');

const router = express.Router();

// Protected Routes
router.get('/me', protect, getStudentProfile);
router.patch('/me', protect, updateStudentProfile);

module.exports = router;