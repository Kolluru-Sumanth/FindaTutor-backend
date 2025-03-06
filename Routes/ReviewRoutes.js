const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createReview, getTutorReviews, deleteReview } = require('../Controllers/reviewController');

const router = express.Router();

// Protected Routes
router.post('/', protect, createReview); // Add a review for a tutor
router.get('/tutor/:tutorId', getTutorReviews); // Get all reviews for a tutor
router.delete('/:reviewId', protect, deleteReview); // Delete a review

module.exports = router;