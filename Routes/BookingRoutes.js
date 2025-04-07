const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createBooking, getBookingDetails, getStudentBookings, getTutorBookings, updateBookingStatus, deleteBooking } = require('../Controllers/bookingController');

const router = express.Router();

// Protected Routes
router.post('/', protect, createBooking); // Create a new booking
router.get('/student', protect, getStudentBookings); // Get all bookings for student
router.get('/tutor', protect, getTutorBookings); 
router.get('/:bookingId', protect, getBookingDetails); // Get booking details
// Get all bookings for tutor
router.patch('/:bookingId', protect, updateBookingStatus); // Update booking status
router.delete('/:bookingId', protect, deleteBooking); // Delete booking

module.exports = router;