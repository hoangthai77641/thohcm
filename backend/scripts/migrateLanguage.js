const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

// Migration script to convert existing services to multi-language format
async function migrateServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dienlanhquy');
    console.log('Connected to MongoDB');
    
    const services = await Service.find({});
    console.log(`Found ${services.length} services to migrate`);
    
    let migrated = 0;
    
    for (const service of services) {
      let needsUpdate = false;
      
      // Migrate name field
      if (typeof service.name === 'string') {
        service.name = {
          vi: service.name,
          en: service.name // Default to same value, can be updated later
        };
        service._name = service.name.vi;
        needsUpdate = true;
      }
      
      // Migrate description field
      if (typeof service.description === 'string') {
        service.description = {
          vi: service.description,
          en: service.description // Default to same value, can be updated later
        };
        service._description = service.description.vi;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await service.save();
        migrated++;
        console.log(`Migrated service: ${service._name}`);
      }
    }
    
    console.log(`Migration completed. ${migrated} services updated.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateServices();