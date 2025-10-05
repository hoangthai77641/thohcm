const mongoose = require('mongoose');
const User = require('../models/User');
const WorkerSchedule = require('../models/WorkerSchedule');

// Kết nối MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dienlanhquy';

const createSampleWorkerSchedules = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    // Tìm tất cả thợ
    const workers = await User.find({ role: 'worker', status: 'active' });
    console.log(`Found ${workers.length} workers`);

    for (const worker of workers) {
      // Kiểm tra xem thợ đã có lịch chưa
      const existingSchedule = await WorkerSchedule.findOne({ worker: worker._id });
      
      if (!existingSchedule) {
        console.log(`Creating schedule for worker: ${worker.name}`);
        
        // Tạo lịch mặc định cho thợ
        const schedule = await WorkerSchedule.createDefaultSchedule(worker._id, 10);
        
        console.log(`Created schedule with ${schedule.availableSlots.length} slots for ${worker.name}`);
      } else {
        console.log(`Worker ${worker.name} already has a schedule`);
        
        // Cập nhật lịch nếu cần (thêm slots cho tương lai)
        const now = new Date();
        const futureSlots = existingSchedule.availableSlots.filter(slot => 
          slot.startTime > now && !slot.isBooked
        );
        
        if (futureSlots.length < 10) {
          console.log(`Adding more slots for ${worker.name}`);
          existingSchedule.generateSlotsForDays(7);
          await existingSchedule.save();
        }
      }
    }

    console.log('Sample worker schedules created successfully!');
    
  } catch (error) {
    console.error('Error creating sample schedules:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  createSampleWorkerSchedules();
}

module.exports = createSampleWorkerSchedules;