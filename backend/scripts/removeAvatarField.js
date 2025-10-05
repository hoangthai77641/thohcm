const mongoose = require('mongoose');
const User = require('../models/User');

// Script to remove avatar field from all users in database
async function removeAvatarField() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dienlanhquy';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Update all users to remove avatar field
    const result = await User.updateMany(
      { avatar: { $exists: true } }, // Only update documents that have avatar field
      { $unset: { avatar: '' } }      // Remove the avatar field
    );

    console.log(`Successfully removed avatar field from ${result.modifiedCount} users`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error removing avatar field:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  removeAvatarField();
}

module.exports = removeAvatarField;