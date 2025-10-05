const mongoose = require('mongoose');
const Service = require('../models/Service');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dqlservice');

const sampleServices = [
  {
    name: 'Sửa chữa máy lạnh tại nhà',
    description: 'Dịch vụ sửa chữa, bảo dưỡng máy lạnh, điều hòa tại nhà. Thay gas, vệ sinh máy lạnh.',
    basePrice: 150000,
    price: 150000,
    category: 'Điện Lạnh',
    isActive: true
  },
  {
    name: 'Lắp đặt máy điều hòa',
    description: 'Lắp đặt máy điều hòa chuyên nghiệp, đảm bảo an toàn và hiệu quả.',
    basePrice: 300000,
    price: 300000,
    category: 'Điện Lạnh',
    isActive: true
  },
  {
    name: 'Sửa máy giặt không vắt được',
    description: 'Sửa chữa máy giặt lỗi không vắt, không quay, rung lắc bất thường.',
    basePrice: 120000,
    price: 120000,
    category: 'Máy Giặt',
    isActive: true
  },
  {
    name: 'Vệ sinh máy giặt tại nhà',
    description: 'Dịch vụ vệ sinh, khử mùi máy giặt tại nhà, làm sạch bên trong máy.',
    basePrice: 80000,
    price: 80000,
    category: 'Máy Giặt',
    isActive: true
  },
  {
    name: 'Sửa tủ lạnh không lạnh',
    description: 'Sửa chữa tủ lạnh không lạnh, rò rỉ gas, tiếng ồn bất thường.',
    basePrice: 180000,
    price: 180000,
    category: 'Điện Lạnh',
    isActive: true
  },
  {
    name: 'Sửa chữa bếp từ, bếp gas',
    description: 'Sửa chữa bếp từ, bếp gas, bếp hồng ngoại không hoạt động.',
    basePrice: 100000,
    price: 100000,
    category: 'Điện Gia Dụng',
    isActive: true
  },
  {
    name: 'Lắp đặt hệ thống điện trong nhà',
    description: 'Lắp đặt hệ thống điện, dây điện, ổ cắm, công tắc an toàn.',
    basePrice: 500000,
    price: 500000,
    category: 'Hệ Thống Điện',
    isActive: true
  },
  {
    name: 'Sửa xe máy Honda, Yamaha',
    description: 'Sửa chữa xe máy Honda, Yamaha, thay nhớt, phanh, lốp xe.',
    basePrice: 150000,
    price: 150000,
    category: 'Sửa Xe Máy',
    isActive: true
  },
  {
    name: 'Sửa xe đạp điện không chạy',
    description: 'Sửa chữa xe đạp điện không chạy, hết pin, sạc không vào điện.',
    basePrice: 120000,
    price: 120000,
    category: 'Sửa Xe Điện',
    isActive: true
  },
  {
    name: 'Bảo dưỡng ô tô định kỳ',
    description: 'Bảo dưỡng ô tô định kỳ, thay nhớt, kiểm tra hệ thống phanh.',
    basePrice: 800000,
    price: 800000,
    category: 'Sửa Xe Oto',
    isActive: true
  }
];

async function createSampleServices() {
  try {
    // Find any existing user to assign as worker
    const users = await User.find({ role: 'worker' }).limit(5);
    
    if (users.length === 0) {
      console.log('No worker users found. Creating sample worker...');
      const sampleWorker = new User({
        name: 'Thợ Nguyễn Văn A',
        email: 'worker@example.com',
        password: '$2b$10$vI8aWBnW3fID.Z.rI9VYw.1CvsSkQBX2HrJBdHg5BrJZhxvWK3Q3u', // password: 123456
        role: 'worker',
        phone: '0123456789',
        address: 'TP.HCM'
      });
      await sampleWorker.save();
      users.push(sampleWorker);
    }

    // Clear existing services
    await Service.deleteMany({});
    console.log('Cleared existing services');

    // Create sample services
    for (let i = 0; i < sampleServices.length; i++) {
      const serviceData = {
        ...sampleServices[i],
        worker: users[i % users.length]._id
      };
      
      const service = new Service(serviceData);
      await service.save();
      console.log(`Created service: ${service.name}`);
    }

    console.log(`Successfully created ${sampleServices.length} sample services`);
    
    // Display summary
    const totalServices = await Service.countDocuments();
    console.log(`Total services in database: ${totalServices}`);
    
    const servicesByCategory = await Service.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    console.log('Services by category:');
    servicesByCategory.forEach(cat => {
      console.log(`- ${cat._id}: ${cat.count} services`);
    });

  } catch (error) {
    console.error('Error creating sample services:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createSampleServices();