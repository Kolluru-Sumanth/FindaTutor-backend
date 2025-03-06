const Booking = require('../db/models/BookingsModel');
const Student = require('../db/models/StudentModel');
const Tutor = require('../db/models/TutorModel');
const { NotFoundError, ConflictError, UnauthorizedError, ForbiddenError } = require('../utils/error');

const createBooking = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { tutorId, date, startTime, endTime } = req.body;

    // Validate booking date
    const bookingDate = new Date(date);
    if (isNaN(bookingDate)) throw new ConflictError('Invalid date format');
    
    // Get tutor and availability
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) throw new NotFoundError('Tutor not found');
    
    // Get day name (e.g., "Monday")
    const bookingDay = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayAvailability = tutor.availability.find(a => a.day === bookingDay);
    
    // Validate availability
    if (!dayAvailability) throw new ConflictError('Tutor is unavailable on this day');
    
    // Check slot validity
    const validSlot = dayAvailability.slots.some(slot => 
      slot.startTime === startTime && slot.endTime === endTime
    );
    if (!validSlot) throw new ConflictError('Invalid time slot');

    // Check existing bookings
    const existingBooking = await Booking.findOne({
      tutorId,
      date: bookingDate,
      startTime,
      endTime,
      status: { $in: ['pending', 'confirmed', 'canceled'] }
    });
    if (existingBooking) throw new ConflictError('Slot already booked');
      status: { $in: ['pending', 'confirmed', 'canceled'] }
    // Create booking
    const booking = await Booking.create({
      studentId,
      tutorId,
      date: bookingDate,
      startTime,
      endTime,
      status: 'pending'
    });

    // Update tutor and student bookings
    await Tutor.findByIdAndUpdate(tutorId, { $push: { bookings: booking._id } });
    await Student.findByIdAndUpdate(studentId, { $push: { bookings: booking._id } });

    res.status(201).json(booking);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
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
      .populate('studentId', 'name email')
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

