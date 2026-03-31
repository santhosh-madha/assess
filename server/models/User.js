// server/models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['renter', 'owner', 'admin'], default: 'renter' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phone: { type: String, default: '' }
});

userSchema.index({ email: 1, role: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
