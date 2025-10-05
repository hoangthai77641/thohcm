require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Service = require('../models/Service');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dienlanhquy';

async function run(){
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // create worker if not exists
  const phone = '0909000001';
  let worker = await User.findOne({ phone });
  if (!worker){
    const hashed = await bcrypt.hash('123456', 10);
    worker = new User({ name: 'Thợ Chủ', phone, password: hashed, role: 'worker', address: 'Hà Nội' });
    await worker.save();
    console.log('Created worker', worker._id);
  } else {
    console.log('Worker exists', worker._id);
  }

  // create admin if not exists
  const adminPhone = '0909000000';
  let admin = await User.findOne({ phone: adminPhone });
  if (!admin){
    const hashedA = await bcrypt.hash('123456', 10);
    admin = new User({ name: 'Admin', phone: adminPhone, password: hashedA, role: 'admin', address: 'Hà Nội' });
    await admin.save();
    console.log('Created admin', admin._id);
  } else {
    console.log('Admin exists', admin._id);
  }

  // create service if not exists
  const svcName = 'Lắp đặt máy lạnh';
  let svc = await Service.findOne({ name: svcName });
  if (!svc){
    svc = new Service({ name: svcName, description: 'Lắp đặt tận nơi', basePrice: 300000, worker: worker._id });
    await svc.save();
    console.log('Created service', svc._id);
  } else {
    console.log('Service exists', svc._id);
    if (!svc.worker) {
      svc.worker = worker._id;
      await svc.save();
      console.log('Assigned worker to existing service');
    }
    // backfill basePrice if old price field existed
    if (!svc.basePrice && svc.price){
      svc.basePrice = svc.price;
      await svc.save();
      console.log('Migrated service price to basePrice');
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err=>{ console.error(err); process.exit(1) });
