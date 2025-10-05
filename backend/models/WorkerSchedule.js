const mongoose = require('mongoose');

const workerScheduleSchema = new mongoose.Schema({
  worker: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Khung giờ rãnh
  availableSlots: [{
    startTime: { 
      type: Date, 
      required: true 
    },
    endTime: { 
      type: Date, 
      required: true 
    },
    isBooked: { 
      type: Boolean, 
      default: false 
    },
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Booking',
      default: null 
    },
    note: { 
      type: String,
      maxlength: 200 
    }
  }],
  // Ngày trong tuần thợ có thể làm việc
  workingDays: [{
    type: Number, // 0-6 (Sunday to Saturday)
    enum: [0, 1, 2, 3, 4, 5, 6]
  }],
  // Giờ làm việc mặc định trong ngày
  defaultWorkingHours: {
    start: { 
      type: String, // format: "HH:MM" (24h format)
      default: "08:00" 
    },
    end: { 
      type: String, // format: "HH:MM" (24h format)
      default: "20:00" 
    }
  },
  // Khung giờ mặc định cho thợ
  defaultTimeSlots: {
    morning: {
      type: [String],
      default: ["08:00", "09:00", "10:00", "11:00", "12:00"]
    },
    afternoon: {
      type: [String], 
      default: ["13:00", "14:00", "15:00", "16:00", "17:00"]
    },
    evening: {
      type: [String],
      default: ["19:00", "20:00"]
    }
  },
  // Trạng thái hiện tại của thợ
  currentStatus: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  // Thông tin công việc hiện tại (nếu đang bận)
  currentJob: {
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Booking' 
    },
    estimatedCompletionTime: { 
      type: Date 
    },
    actualStartTime: { 
      type: Date 
    }
  },
  // Ngày cập nhật lần cuối
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Tự động tạo lịch rãnh cho số ngày tới
  autoScheduleDays: {
    type: Number,
    default: 7 // Tự động tạo lịch cho 7 ngày tới
  }
}, { 
  timestamps: true 
});

// Index để tối ưu query
workerScheduleSchema.index({ worker: 1 });
workerScheduleSchema.index({ "availableSlots.startTime": 1 });
workerScheduleSchema.index({ "availableSlots.endTime": 1 });
workerScheduleSchema.index({ "availableSlots.isBooked": 1 });

// Method để lấy lịch rãnh theo ngày
workerScheduleSchema.methods.getAvailableSlotsForDate = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.availableSlots.filter(slot => 
    slot.startTime >= startOfDay && 
    slot.startTime <= endOfDay && 
    !slot.isBooked
  );
};

// Method để kiểm tra thợ có rãnh trong khoảng thời gian không
workerScheduleSchema.methods.isAvailableInTimeRange = function(startTime, endTime) {
  return this.availableSlots.some(slot => 
    slot.startTime <= startTime && 
    slot.endTime >= endTime && 
    !slot.isBooked
  );
};

// Static method để tạo lịch mặc định cho thợ
workerScheduleSchema.statics.createDefaultSchedule = async function(workerId, days = 7) {
  const schedule = new this({
    worker: workerId,
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    availableSlots: [],
    autoScheduleDays: days
  });
  
  // Tự động tạo lịch rãnh cho số ngày tới
  await schedule.generateSlotsForDays(days);
  return await schedule.save();
};

// Method để cập nhật công việc hiện tại và tạo lịch rãnh sau thời gian dự kiến
workerScheduleSchema.methods.updateCurrentJob = function(bookingId, estimatedCompletionTime, actualStartTime = new Date()) {
  this.currentJob = {
    booking: bookingId,
    estimatedCompletionTime: new Date(estimatedCompletionTime),
    actualStartTime: new Date(actualStartTime)
  };
  this.currentStatus = 'busy';
  
  // Tự động tạo lịch rãnh sau thời gian dự kiến hoàn thành
  this.generateSlotsAfterCompletion();
};

// Method để tạo lịch rãnh sau khi hoàn thành công việc hiện tại
workerScheduleSchema.methods.generateSlotsAfterCompletion = function() {
  if (!this.currentJob || !this.currentJob.estimatedCompletionTime) {
    return;
  }
  
  const completionTime = new Date(this.currentJob.estimatedCompletionTime);
  const endOfDay = new Date(completionTime);
  endOfDay.setHours(parseInt(this.defaultWorkingHours.end.split(':')[0]), 0, 0, 0);
  
  // Xóa các slot cũ sau thời gian dự kiến hoàn thành để tránh trùng lặp
  this.availableSlots = this.availableSlots.filter(slot => 
    slot.startTime <= completionTime || slot.isBooked
  );
  
  // Tạo slot đầu tiên ngay sau khi hoàn thành (cộng thêm 30 phút nghỉ)
  const nextAvailableTime = new Date(completionTime.getTime() + 30 * 60 * 1000); // +30 phút
  
  if (nextAvailableTime < endOfDay) {
    // Tạo slot từ thời gian rãnh đến cuối giờ làm việc
    const remainingTime = endOfDay.getTime() - nextAvailableTime.getTime();
    const slotDuration = 2 * 60 * 60 * 1000; // 2 giờ
    
    let currentSlotStart = new Date(nextAvailableTime);
    
    while (currentSlotStart < endOfDay) {
      const currentSlotEnd = new Date(Math.min(
        currentSlotStart.getTime() + slotDuration,
        endOfDay.getTime()
      ));
      
      // Chỉ tạo slot nếu có ít nhất 1 giờ
      if (currentSlotEnd.getTime() - currentSlotStart.getTime() >= 60 * 60 * 1000) {
        this.availableSlots.push({
          startTime: new Date(currentSlotStart),
          endTime: new Date(currentSlotEnd),
          isBooked: false,
          note: 'Rãnh sau khi hoàn thành công việc hiện tại'
        });
      }
      
      currentSlotStart = new Date(currentSlotEnd);
    }
  }
  
  // Tạo lịch cho ngày hôm sau nếu hoàn thành muộn
  if (completionTime.getHours() >= parseInt(this.defaultWorkingHours.end.split(':')[0]) - 2) {
    const nextDay = new Date(completionTime);
    nextDay.setDate(completionTime.getDate() + 1);
    nextDay.setHours(parseInt(this.defaultWorkingHours.start.split(':')[0]), 0, 0, 0);
    
    if (this.workingDays.includes(nextDay.getDay())) {
      const endOfNextDay = new Date(nextDay);
      endOfNextDay.setHours(parseInt(this.defaultWorkingHours.end.split(':')[0]), 0, 0, 0);
      
      for (let hour = nextDay.getHours(); hour < endOfNextDay.getHours(); hour += 2) {
        const slotStart = new Date(nextDay);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(nextDay);
        slotEnd.setHours(hour + 2, 0, 0, 0);
        
        this.availableSlots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isBooked: false,
          note: 'Khả dụng ngày hôm sau'
        });
      }
    }
  }
};

// Method để hoàn thành công việc hiện tại
workerScheduleSchema.methods.completeCurrentJob = function() {
  if (this.currentJob && this.currentJob.booking) {
    // Xóa thông tin công việc hiện tại
    this.currentJob = {
      booking: null,
      estimatedCompletionTime: null,
      actualStartTime: null
    };
    this.currentStatus = 'available';
    this.lastUpdated = new Date();
  }
};

// Method để tự động tạo khung giờ rãnh với các slot mặc định
workerScheduleSchema.methods.generateSlotsForDays = function(days) {
  const slots = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(now);
    currentDate.setDate(now.getDate() + i);
    
    // Kiểm tra nếu là ngày làm việc
    if (this.workingDays.includes(currentDate.getDay())) {
      // Tạo các khung giờ mặc định
      const allTimeSlots = [
        ...this.defaultTimeSlots.morning,
        ...this.defaultTimeSlots.afternoon,
        ...this.defaultTimeSlots.evening
      ];
      
      allTimeSlots.forEach(timeSlot => {
        const [hour, minute] = timeSlot.split(':').map(Number);
        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, minute, 0, 0); // Mỗi slot 1 tiếng
        
        // Không tạo slot cho thời gian đã qua
        if (slotStart > now) {
          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            isBooked: false,
            note: `Khung giờ ${timeSlot}`
          });
        }
      });
    }
  }
  
  this.availableSlots = this.availableSlots.concat(slots);
};

// Method để thợ cập nhật lịch khả dụng sau khi nhận đơn
workerScheduleSchema.methods.updateAvailabilityAfterBooking = function(completedBookingTime, additionalDays = 3) {
  // Đánh dấu thợ available trở lại
  this.currentStatus = 'available';
  this.currentJob = {
    booking: null,
    estimatedCompletionTime: null,
    actualStartTime: null
  };
  
  // Tạo lịch khả dụng cho các ngày tiếp theo
  this.generateSlotsForDays(additionalDays);
  this.lastUpdated = new Date();
};

// Method để thợ tự cập nhật khung giờ khả dụng
workerScheduleSchema.methods.updateCustomAvailability = function(date, availableHours) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(targetDate.getDate() + 1);
  
  // Xóa các slot cũ của ngày này (chỉ những slot chưa được đặt)
  this.availableSlots = this.availableSlots.filter(slot => {
    const slotDate = new Date(slot.startTime);
    slotDate.setHours(0, 0, 0, 0);
    return slotDate.getTime() !== targetDate.getTime() || slot.isBooked;
  });
  
  // Tạo slot mới theo giờ thợ chọn
  availableHours.forEach(timeSlot => {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotStart = new Date(targetDate);
    slotStart.setHours(hour, minute, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, minute, 0, 0);
    
    // Chỉ tạo slot cho thời gian tương lai
    if (slotStart > new Date()) {
      this.availableSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isBooked: false,
        note: `Thợ tự cập nhật - ${timeSlot}`
      });
    }
  });
  
  this.lastUpdated = new Date();
};

module.exports = mongoose.model('WorkerSchedule', workerScheduleSchema);