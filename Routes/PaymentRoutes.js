const express = require('express');
const { protect } = require('../middleware/authMiddleware');
// const { createPaymentIntent, handleWebhook } = require('../Controllers/paymentControllers');

const router = express.Router();

// Protected Routes
// router.post('/create-intent', protect, createPaymentIntent); // Create Stripe payment intent

// Webhook (no auth required)
router.post('/webhook', handleWebhook); // Handle Stripe webhook events

module.exports = router;