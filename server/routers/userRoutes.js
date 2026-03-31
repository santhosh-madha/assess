const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const { authenticateUser } = require('../middleware/auth');

router.get('/profile', authenticateUser, userController.getProfile);
router.put('/profile', authenticateUser, userController.updateProfile);

module.exports = router;
