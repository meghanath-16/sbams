const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('./models/User');
const Building = require('./models/Building');
const Room = require('./models/Room');
const EnergyUsageLog = require('./models/EnergyUsageLog');
const MaintenanceRequest = require('./models/MaintenanceRequest');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sbams');
    console.log('MongoDB Connected to Seed Data');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Building.deleteMany(),
      Room.deleteMany(),
      EnergyUsageLog.deleteMany(),
      MaintenanceRequest.deleteMany(),
    ]);

    console.log('Creating Admin User...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'System Admin',
      email: 'admin@sbams.com',
      password: adminPassword,
      role: 'Admin'
    });

    console.log('✅ Database Cleared & Admin Reset Successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
