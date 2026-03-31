// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database Connected Successfully!');
    
    // Smoothly remove the legacy unqie email index
    try {
      await mongoose.connection.collection('users').dropIndex('email_1');
      console.log('Cleaned up legacy email_1 index');
    } catch (err) {
      // Ignore if index not found
      if (err.code !== 27) console.log('Index drop info:', err.message);
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
