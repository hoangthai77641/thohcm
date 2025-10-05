const User = require('./models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thohcm');
    
    const existingUser = await User.findOne({ phone: '0123456789' });
    if (existingUser) {
      console.log('Test user already exists:', existingUser.name);
      return;
    }
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      name: 'Test User Avatar',
      phone: '0123456789',
      password: hashedPassword,
      role: 'customer'
    });
    
    await user.save();
    console.log('✅ Test user created successfully:', user.name);
    console.log('📱 Phone:', user.phone);
    console.log('🔑 Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestUser();