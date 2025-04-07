const Review = require('../db/models/ReviewModel');
const Tutor = require('../db/models/TutorModel');
const Booking = require('../db/models/BookingsModel');
const { NotFoundError, ForbiddenError } = require('../utils/error');

// Create a review for a tutor
const createReview = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { tutorId, rating, comment } = req.body;

    // Validate booking exists and is completed
    // const booking = await Booking.findById(bookingId);
    // if (!booking) throw new NotFoundError('Booking not found');
    // if (booking.status !== 'completed') {
    //   throw new ForbiddenError('You can only review completed sessions');
    // }

    // // Ensure student is the one who made the booking
    // if (!booking.studentId.equals(studentId)) {
    //   throw new ForbiddenError('Not authorized to review this session');
    // }

    // Check for existing review for this booking
    const existingReview = await Review.findOne({ studentId, tutorId });
    if (existingReview) {
      throw new ConflictError('You already reviewed this session');
    }

    // Create review
    const review = await Review.create({
      studentId,
      tutorId,
      rating,
      comment
    });

    // Update tutor's rating stats
    const reviews = await Review.find({ tutorId });
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await Tutor.findByIdAndUpdate(tutorId, {
      rating: {
        average: averageRating,
        total: totalReviews
      }
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get all reviews for a tutor
const getTutorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.tutorId })
      .populate('studentId', 'name avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) throw new NotFoundError('Review not found');

    // Authorization: Student or admin can delete
    const isStudentOwner = review.studentId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin'; // Add this to your user model if needed
    
    if (!isStudentOwner && !isAdmin) {
      throw new ForbiddenError('Not authorized to delete this review');
    }

    // Delete review
    await review.deleteOne();

    // Recalculate tutor rating
    const reviews = await Review.find({ tutorId: review.tutorId });
    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    await Tutor.findByIdAndUpdate(review.tutorId, {
      rating: {
        average: averageRating,
        total: totalReviews
      }
    });

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  createReview,
  getTutorReviews,
  deleteReview
};