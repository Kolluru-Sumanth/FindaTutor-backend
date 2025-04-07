const Booking = require('../db/models/BookingsModel');
const Student = require('../db/models/StudentModel');
const Tutor = require('../db/models/TutorModel');
const { NotFoundError, ConflictError, UnauthorizedError, ForbiddenError } = require('../utils/error');

const createBooking = async (req, res) => {  
  try {
    const studentId = req.user._id;
    const { tutorId ,subject} = req.body;

    // // Validate booking date
    const bookingDate = new Date();

    // Check existing bookings
    const existingBooking = await Booking.findOne({
      tutorId,
      date: bookingDate,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (existingBooking) throw new ConflictError('Slot already booked');

    // Create booking with payment status
    const bookingStatus = 'pending';
    
    // Create a new booking
    const booking = await Booking.create({
      studentId,
      tutorId,
      date: bookingDate,
      status: bookingStatus,
      subject
    });



  } catch (error) {
    console.error(error);
    
    // Cleanup booking if error occurred after creation
    if (error.booking) {
      await Booking.findByIdAndDelete(error.booking._id);
    }

    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || "Booking creation failed" 
    });
  }
};
// Get booking details
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('studentId', 'name email')
      .populate('tutorId', 'name profession');

    if (!booking) throw new NotFoundError('Booking not found');
    
    // Ensure the user is part of the booking
    const isAuthorized = req.user._id.equals(booking.studentId) || req.user._id.equals(booking.tutorId);
    if (!isAuthorized) throw new UnauthorizedError('Not authorized to view this booking');

    res.status(200).json(booking);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get all bookings for a student
const getStudentBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ studentId: req.user._id })
      .populate('tutorId', 'name profession')
      .sort({ date: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings for a tutor
const getTutorBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ tutorId: req.user._id })
      .populate('studentId', 'name email phone')
      .sort({ date: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update booking status (e.g., confirm/cancel)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) throw new NotFoundError('Booking not found');
    
    // Authorization: Only student/tutor can update their own bookings
    const isStudent = req.user._id.equals(booking.studentId);
    const isTutor = req.user._id.equals(booking.tutorId);
    if (!isStudent && !isTutor) throw new UnauthorizedError('Not authorized');

    // Validate status transition (example rules)
    if (isStudent && !['canceled'].includes(status)) throw new UnauthorizedError('Students can only cancel bookings');
    if (isTutor && !['confirmed', 'canceled'].includes(status)) throw new UnauthorizedError('Invalid action');

    if (isStudent && !['canceled'].includes(status)) throw new UnauthorizedError('Students can only cancel bookings');
    if (isTutor && !['confirmed', 'canceled'].includes(status)) throw new UnauthorizedError('Invalid action');
    booking.status = status;
    await booking.save();
    res.status(200).json(booking);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Delete booking (admin-only)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    // Remove booking from student/tutor arrays
    await Student.findByIdAndUpdate(booking.studentId, { $pull: { bookings: booking._id } });
    await Tutor.findByIdAndUpdate(booking.tutorId, { $pull: { bookings: booking._id } });

    res.status(200).json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getBookingDetails,
  getStudentBookings,
  getTutorBookings,
  updateBookingStatus,
  deleteBooking
};

