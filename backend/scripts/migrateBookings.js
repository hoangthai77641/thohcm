/**
 * Migration script:
 * - Convert Booking.service (string) -> ObjectId reference to Service
 * - Compute finalPrice from Service.basePrice and customer loyalty
 * Usage: node scripts/migrateBookings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dienlanhquy';

async function run(){
  await mongoose.connect(MONGODB_URI);
  console.log('Connected');

  const servicesByName = {};
  const services = await Service.find();
  services.forEach(s=> { servicesByName[s.name] = s; });

  const bookings = await Booking.find();
  console.log('Found bookings:', bookings.length);
  for (const b of bookings) {
    try {
      if (b.service && typeof b.service !== 'string') continue; // already migrated
      const rawName = (b.service || '').trim();
      const name = rawName || 'Dịch vụ chưa đặt tên';
      let service = servicesByName[name];
      if (!service) {
        service = new Service({ name, basePrice: 0 });
        await service.save();
        servicesByName[name] = service;
        console.log('Created placeholder service for name', name);
      }
      if (!service.basePrice && service.price) {
        service.basePrice = service.price;
        await service.save();
      }
      let finalPrice = service.basePrice || 0;
      if (b.customer) {
        const customer = await User.findById(b.customer);
        if (customer && customer.loyaltyLevel === 'vip') finalPrice = Math.round(finalPrice * 0.9);
      }
      b.service = service._id;
      b.finalPrice = finalPrice;
      await b.save();
      console.log('Migrated booking', b._id);
    } catch (e) {
      console.warn('Failed migrating booking', b._id, e.message);
    }
  }

  await mongoose.disconnect();
  console.log('Migration done');
}

run().catch(e=>{ console.error(e); process.exit(1); });
