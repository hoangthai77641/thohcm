const mongoose = require('mongoose');
const Service = require('../models/Service');

// Script to add category field to existing services
async function addCategoryToServices() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dienlanhquy';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Update all services without category to have default category
    const result = await Service.updateMany(
      { category: { $exists: false } }, // Services without category field
      { $set: { category: 'Điện Lạnh' } }  // Set default category
    );

    console.log(`Successfully updated ${result.modifiedCount} services with default category`);

    // Also add some sample services with different categories if needed
    const existingServices = await Service.find({});
    if (existingServices.length > 0) {
      // Update first few services with different categories for demo
      const categories = ['Máy Giặt', 'Điện Gia Dụng', 'Hệ Thống Điện'];
      
      for (let i = 1; i < Math.min(4, existingServices.length); i++) {
        if (i - 1 < categories.length) {
          await Service.findByIdAndUpdate(existingServices[i]._id, {
            category: categories[i - 1]
          });
          console.log(`Updated service "${existingServices[i].name}" to category "${categories[i - 1]}"`);
        }
      }
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error adding category to services:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  addCategoryToServices();
}

module.exports = addCategoryToServices;