// server/controllers/auth.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

exports.signup = async (req, res) => {
  try {
    // Validate request data
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract user data from request body
    const { username, email, password, role } = req.body;

    // Hard block any attempt to create an admin externally
    if (role === 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Standard API cannot create Admin profiles.' });
    }

    console.log('Signup data:', { username, email, role });

    // Check if the user already exists based on email and role
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      return res.status(400).json({ error: `User with email ${email} already has a ${role} account.` });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', role });
    console.log('getting the role',role)
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  try {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    // Extract user data from request body
    const { email, password, role } = req.body;
    
    console.log('user role is:', role)
    // Check if the user exists for this specific role
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ error: `No ${role} account found with this email!` });
    }

    // Check if the password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log(user.role)

    res.json({ 
        token, 
        userId: user._id, 
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password, passcode } = req.body;
    
    // 1. Double layer verify Pre-selected Passcode
    if (passcode !== process.env.ADMIN_PASSCODE) {
       return res.status(401).json({ error: 'Unauthorized: Invalid Master Passcode.' });
    }

    // 2. Locate admin user
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
       return res.status(401).json({ error: 'No Admin account found with this email!' });
    }

    // 3. Verify Password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
       return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    // 4. Generate Token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '4h',
    });

    res.json({ 
        token, 
        userId: user._id, 
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
    });
  } catch (error) {
    console.error('Error in Admin login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
