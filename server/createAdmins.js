const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Robust path resolution
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to DB for Admin Seeding'))
  .catch(err => {
      console.error(err);
      process.exit(1);
  });

const createAdmins = async () => {
    try {
        const admin1Password = await bcrypt.hash('admin1_echo', 10);
        const admin2Password = await bcrypt.hash('loom#666@admin2', 10);

        await User.updateOne({ email: 'admin1@echoloom.com', role: 'admin' }, {
            username: 'MasterAdmin1',
            email: 'admin1@echoloom.com',
            password: admin1Password,
            role: 'admin',
        }, { upsert: true });

        await User.updateOne({ email: 'admin2@echoloom.com', role: 'admin' }, {
            username: 'MasterAdmin2',
            email: 'admin2@echoloom.com',
            password: admin2Password,
            role: 'admin',
        }, { upsert: true });

        console.log("Successfully securely injected the 2 Admin accounts to MongoDB.");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
createAdmins();
