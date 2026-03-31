const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const analyticsController = require('../controllers/analytics');
const { authenticateUser, isAdmin } = require('../middleware/auth');

router.use(authenticateUser, isAdmin); // Protect all routes below this line!

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id/activity', adminController.getUserActivity);
router.put('/users/:id', adminController.updateUserByAdmin);
router.delete('/users/:id', adminController.deleteUser);
router.get('/properties', adminController.getAllProperties);
router.get('/properties/:id/activity', adminController.getPropertyActivity);
router.delete('/properties/:id', adminController.deleteProperty);
router.get('/bookings', adminController.getAllBookings);
router.get('/analytics', analyticsController.getAdminAnalytics);

module.exports = router;
