// server/routes/authRoutes.js
const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/auth');
const router = express.Router();

// Signup route
router.post(
  '/signup',
  [
    check('username').not().isEmpty().withMessage('Username is required'),
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  authController.signup
);

// Login route
router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  authController.login
);

// Admin Login route
router.post(
  '/admin-login',
  [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    check('passcode').not().isEmpty().withMessage('Master passcode is required')
  ],
  authController.adminLogin
);

module.exports = router;
