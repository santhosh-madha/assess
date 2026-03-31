// server/controllers/booking.js
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a new booking and generate a Stripe Payment Intent
exports.createBooking = async (req, res) => {
    try {
        const { propertyId, checkInDate, checkOutDate, renterName, renterPhone, guests, specialRequests } = req.body;
        const renterId = req.user.userId;

        // Fetch property details
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Check availability (Mocked logic for simplicity, normally check existing overlapping bookings)
        const existingBooking = await Booking.findOne({
            propertyId,
            $or: [
                { checkInDate: { $lte: checkOutDate }, checkOutDate: { $gte: checkInDate } }
            ],
            paymentStatus: { $ne: 'failed' } // Don't block if the previous payment failed
        });

        if (existingBooking) {
            return res.status(400).json({ error: 'Property is already booked for these dates' });
        }

        // Calculate exact days booked mathematically
        const startDate = new Date(checkInDate);
        const endDate = new Date(checkOutDate);
        // Add 1 to ensure same-day checkout (or 1 night minimum) works correctly if needed,
        // but typically checkOut - checkIn gives the exact number of nights.
        const diffTime = Math.abs(endDate - startDate);
        let totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (totalNights === 0) totalNights = 1; // Minimum 1 night

        const totalAmount = property.pricePerNight * totalNights;
        const amountInCents = totalAmount * 100;

        // Create a Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            metadata: { propertyId, renterId, totalNights },
        });

        // Save pending booking
        const newBooking = new Booking({
            propertyId,
            renterId,
            checkInDate,
            checkOutDate,
            renterName,
            renterPhone,
            guests,
            specialRequests,
            totalAmount,
            stripePaymentIntentId: paymentIntent.id,
            paymentStatus: 'pending',
        });

        await newBooking.save();

        res.status(201).json({
            message: 'Booking initialized',
            clientSecret: paymentIntent.client_secret,
            bookingId: newBooking._id,
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ renterId: req.user.userId })
            .populate({
                path: 'propertyId',
                populate: { path: 'ownerId', select: 'username email' }
            });
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getPropertyBookings = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const bookings = await Booking.find({ 
            propertyId,
            checkOutDate: { $gte: new Date() },
            paymentStatus: { $ne: 'failed' } 
        }).select('checkInDate checkOutDate -_id');

        res.json(bookings);
    } catch (error) {
        console.error('Failed to get property bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Confirm payment via Stripe intent ID
exports.confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        
        const booking = await Booking.findOne({ stripePaymentIntentId: paymentIntentId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found with this intent.' });
        }

        booking.paymentStatus = 'paid';
        await booking.save();

        res.status(200).json({ message: 'Payment confirmed successfully', booking });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get reservations strictly active on properties that the current logging-in User Owns
exports.getOwnerReservations = async (req, res) => {
    try {
        const ownerId = req.user.userId;

        // 1. Find all properties owned by this user
        const properties = await Property.find({ ownerId }).select('_id');
        const propertyIds = properties.map(p => p._id);

        // 2. Find all bookings that match these specific properties
        const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
            .populate('propertyId')
            .populate('renterId', 'username email') // grab simple renter details
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching owner reservations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
