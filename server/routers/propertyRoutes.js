// server/routers/propertyRoutes.js
const express = require('express');
const propertyController = require('../controllers/property');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

// Public route to fetch all properties
router.get('/', propertyController.getAllProperties);

// Public route to fetch trending properties
router.get('/trending', propertyController.getTrendingProperties);

// Public route to fetch a single property
router.get('/:id', propertyController.getPropertyById);

// Protected route to create a new property
router.post('/', authenticateUser, propertyController.createProperty);

// Protected route to update an existing property
router.put('/:id', authenticateUser, propertyController.updateProperty);

// Protected route to delete an existing property
router.delete('/:id', authenticateUser, propertyController.deleteProperty);

module.exports = router;
