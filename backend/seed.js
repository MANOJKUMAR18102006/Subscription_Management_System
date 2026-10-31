const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const users = [
  {
    name: 'Eleanor Vance (Admin)',
    email: 'admin@subscriptionms.com',
    password: 'Admin@123456',
    role: 'admin',
    company: 'Subscription Corp HQ',
    phone: '+1 (555) 019-2831'
  },
  {
    name: 'David Miller (Staff)',
    email: 'staff@subscriptionms.com',
    password: 'Staff@123456',
    role: 'staff',
    company: 'Operations Support Tier 2',
    phone: '+1 (555) 018-7742'
  },
  {
    name: 'Alice Cooper (Customer)',
    email: 'customer@subscriptionms.com',
    password: 'Customer@123456',
    role: 'customer',
    company: 'Cooper Designs Inc',
    phone: '+1 (555) 012-3398'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/subscription_management');
    console.log('[Seed] Connected to MongoDB');

    // Remove existing seed users
    for (const u of users) {
      await User.deleteOne({ email: u.email });
    }

    // Insert with pre-save password hashing
    for (const u of users) {
      await User.create(u);
      console.log(`[Seed] Created ${u.role.toUpperCase()} user: ${u.email}`);
    }

    console.log('[Seed] Database successfully seeded with demo accounts!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error]: ${error.message}`);
    process.exit(1);
  }
};

seedDB();

