// server/models/Property.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertySchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  propertyType: { type: String, enum: ['apartment', 'house', 'villa', 'cabin'], required: true },
  location: { type: String, required: true }, // computed search string
  street: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  imageUrl: { type: String, required: true },
  galleryImages: [{ type: String }], 
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxGuests: { type: Number, default: 2 },
  bedrooms: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  amenities: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
