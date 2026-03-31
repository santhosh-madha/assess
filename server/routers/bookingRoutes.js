// server/routers/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking');
const analyticsController = require('../controllers/analytics');
const { authenticateUser } = require('../middleware/auth');

router.post('/create', authenticateUser, bookingController.createBooking);
router.post('/confirm', authenticateUser, bookingController.confirmPayment);

router.get('/my-bookings', authenticateUser, bookingController.getUserBookings);
router.get('/owner-reservations', authenticateUser, bookingController.getOwnerReservations);
router.get('/owner-analytics', authenticateUser, analyticsController.getOwnerAnalytics);

// Public route: check availability for calendar limits
router.get('/property/:propertyId', bookingController.getPropertyBookings);

module.exports = router;
