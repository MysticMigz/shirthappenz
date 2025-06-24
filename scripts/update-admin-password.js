const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shirthappenz';

async function updateAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);

    // Update the admin user's password
    const result = await mongoose.connection.collection('users').updateOne(
      { email: 'admin@shirthappenz.com' },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount > 0) {
      console.log('Admin password updated successfully');
    } else {
      console.log('Admin user not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateAdminPassword(); 