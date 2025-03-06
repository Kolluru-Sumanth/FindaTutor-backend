const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const authRoutes = require('./Routes/AuthRoutes');
const studentRoutes = require('./Routes/StudentRoutes');
const tutorRoutes = require('./Routes/TutorRoutes');
const bookingRoutes = require('./Routes/BookingRoutes');
const reviewRoutes = require('./Routes/ReviewRoutes');
const paymentRoutes = require('./Routes/PaymentRoutes');
const adminRoutes = require('./Routes/AdminRoutes');
// const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
// app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const PORT = 6000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));