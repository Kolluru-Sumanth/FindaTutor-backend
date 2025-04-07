const Stripe = require('stripe');
const Booking = require('../db/models/BookingsModel');
const { NotFoundError } = require('../utils/error');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe payment intent
const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const studentId = req.user._id;

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('tutorId', 'price name');
    
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking is not confirmed' });
    }

    // Calculate amount (price per hour * duration) in cents (Stripe expects smallest currency unit)
    const amount = Math.round(booking.tutorId.price * booking.duration * 100); // INR paise

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `Tutoring Session with ${booking.tutorId.name}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: { bookingId: bookingId.toString() },
    });

    // Save payment record
    const payment = await Payment.create({
      bookingId,
      studentId,
      tutorId: booking.tutorId._id,
      amount: amount / 100, // Store in INR (not paise)
      transactionId: session.id,
      status: 'pending' // Checkout sessions start as 'pending'
    });

    // Return the Stripe Checkout URL
    res.status(200).json({ 
      checkoutUrl: session.url,
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