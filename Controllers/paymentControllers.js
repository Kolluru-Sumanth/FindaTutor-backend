const Stripe = require('stripe');
const Booking = require('../db/models/BookingsModel');
const { NotFoundError } = require('../utils/error');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const studentId = req.user._id;

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('tutorId', 'price');
    
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking is not confirmed' });
    }

    // Calculate amount (price per hour * duration)
    const amount = Math.round(booking.tutorId.price * booking.duration * 100); // Convert to cents

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId: bookingId.toString() }
    });

    // Save payment record
    const payment = await Payment.create({
      bookingId,
      studentId,
      tutorId: booking.tutorId._id,
      amount: amount / 100, // Store in dollars
      transactionId: paymentIntent.id,
      status: paymentIntent.status
    });

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Handle Stripe webhook events
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Update payment status
      await Payment.findOneAndUpdate(
        { transactionId: paymentIntent.id },
        { status: paymentIntent.status }
      );

      // Update booking payment status
      await Booking.findOneAndUpdate(
        { _id: paymentIntent.metadata.bookingId },
        { paymentStatus: 'paid' }
      );
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook
};