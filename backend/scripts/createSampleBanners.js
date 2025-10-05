require('dotenv').config();
const mongoose = require('mongoose');
const Banner = require('../models/Banner');
const User = require('../models/User');

async function createSampleBanners() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dienlanhquy';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find an admin user to set as creator
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      // Create admin user if doesn't exist
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = new User({
        name: 'Admin',
        phone: '0123456789',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
      await adminUser.save();
      console.log('Created admin user');
    }

    // Sample banner data
    const sampleBanners = [
      {
        title: 'Chào mừng đến với Thợ HCM!',
        description: 'Ứng dụng tìm thợ số 1 tại TP.HCM',
        imageUrl: 'https://via.placeholder.com/400x200/0EA5E9/FFFFFF?text=Thợ+HCM+-+Chào+mừng',
        type: 'notification',
        isActive: true,
        order: 1,
        createdBy: adminUser._id
      },
      {
        title: 'Giảm giá 20% dịch vụ sửa máy lạnh',
        description: 'Áp dụng cho khách hàng mới, từ 15/10 đến 31/10',
        imageUrl: 'https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=Giảm+giá+20%25+máy+lạnh',
        type: 'promotion',
        targetUrl: '/services/categories/dien-lanh',
        isActive: true,
        order: 2,
        startDate: new Date('2025-10-15'),
        endDate: new Date('2025-10-31'),
        createdBy: adminUser._id
      },
      {
        title: 'Tips bảo dưỡng máy giặt',
        description: 'Hướng dẫn bảo dưỡng máy giặt đúng cách tại nhà',
        imageUrl: 'https://via.placeholder.com/400x200/10B981/FFFFFF?text=Tips+bảo+dưỡng+máy+giặt',
        type: 'blog',
        targetUrl: '/blog/washing-machine-maintenance',
        isActive: true,
        order: 3,
        createdBy: adminUser._id
      },
      {
        title: 'Tuyển thợ điện lạnh',
        description: 'Thu nhập hấp dẫn, làm việc linh hoạt',
        imageUrl: 'https://via.placeholder.com/400x200/EF4444/FFFFFF?text=Tuyển+thợ+điện+lạnh',
        type: 'advertisement',
        targetUrl: '/register?role=worker',
        isActive: true,
        order: 4,
        createdBy: adminUser._id
      }
    ];

    // Clear existing banners
    await Banner.deleteMany({});
    console.log('Cleared existing banners');

    // Insert sample banners
    const createdBanners = await Banner.insertMany(sampleBanners);
    console.log(`Created ${createdBanners.length} sample banners`);

    // Display created banners
    createdBanners.forEach(banner => {
      console.log(`- ${banner.title} (${banner.type})`);
    });

    console.log('\nSample banners created successfully!');
    console.log('\nNote: Make sure to add actual image files to backend/uploads/banners/ directory');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating sample banners:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createSampleBanners();
}

module.exports = createSampleBanners;