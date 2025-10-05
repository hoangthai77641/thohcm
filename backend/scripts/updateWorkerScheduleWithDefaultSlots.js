const mongoose = require('mongoose');
const WorkerSchedule = require('../models/WorkerSchedule');
const User = require('../models/User');

// Kết nối database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dienlanhquy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateAllWorkerSchedules() {
  try {
    console.log('🔄 Bắt đầu cập nhật lịch làm việc cho tất cả thợ...');
    
    // Lấy tất cả thợ
    const workers = await User.find({ role: 'worker' });
    console.log(`📊 Tìm thấy ${workers.length} thợ`);
    
    let updatedCount = 0;
    let createdCount = 0;
    
    for (const worker of workers) {
      console.log(`\n👤 Xử lý thợ: ${worker.name} (${worker._id})`);
      
      // Tìm lịch làm việc hiện tại
      let schedule = await WorkerSchedule.findOne({ worker: worker._id });
      
      if (!schedule) {
        // Tạo lịch mặc định mới với khung giờ cập nhật
        console.log('   ➕ Tạo lịch làm việc mới...');
        schedule = await WorkerSchedule.createDefaultSchedule(worker._id, 7);
        createdCount++;
        console.log('   ✅ Tạo lịch thành công');
      } else {
        // Cập nhật khung giờ mặc định
        console.log('   🔄 Cập nhật khung giờ mặc định...');
        
        // Cập nhật defaultTimeSlots nếu chưa có hoặc khác với mặc định mới
        const newDefaultTimeSlots = {
          morning: ["08:00", "09:00", "10:00", "11:00", "12:00"],
          afternoon: ["13:00", "14:00", "15:00", "16:00", "17:00"],
          evening: ["19:00", "20:00"]
        };
        
        schedule.defaultTimeSlots = newDefaultTimeSlots;
        
        // Cập nhật giờ làm việc mặc định
        schedule.defaultWorkingHours.end = "20:00";
        
        // Xóa các slot cũ chưa được đặt và tạo lại với khung giờ mới
        const now = new Date();
        const bookedSlots = schedule.availableSlots.filter(slot => slot.isBooked);
        
        // Giữ lại các slot đã được đặt, xóa các slot chưa đặt
        schedule.availableSlots = bookedSlots;
        
        // Tạo lại lịch với khung giờ mới cho 7 ngày tới
        schedule.generateSlotsForDays(7);
        
        await schedule.save();
        updatedCount++;
        console.log('   ✅ Cập nhật thành công');
        
        // Log thông tin slot mới
        const newSlots = schedule.availableSlots.filter(slot => !slot.isBooked && slot.startTime > now);
        console.log(`   📅 Tạo ${newSlots.length} slot mới khả dụng`);
      }
    }
    
    console.log('\n🎉 Hoàn thành cập nhật!');
    console.log(`📊 Thống kê:`);
    console.log(`   - Tạo mới: ${createdCount} lịch`);
    console.log(`   - Cập nhật: ${updatedCount} lịch`);
    console.log(`   - Tổng: ${workers.length} thợ`);
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Đã ngắt kết nối database');
  }
}

// Chạy script
updateAllWorkerSchedules();