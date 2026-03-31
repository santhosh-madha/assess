const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  renterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  renterName: { type: String, required: true },
  renterPhone: { type: String, required: true },
  guests: { type: Number, required: true, default: 1 },
  specialRequests: { type: String },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  stripePaymentIntentId: { type: String }, // Links to the Stripe payment
  createdAt: { type: Date, default: Date.now },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
