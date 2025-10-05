const WorkerSchedule = require('../models/WorkerSchedule');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Lấy lịch rãnh của thợ
exports.getWorkerSchedule = async (req, res) => {
  try {
    const { workerId, date } = req.query;
    
    if (!workerId) {
      return res.status(400).json({ message: 'Worker ID is required' });
    }

    let schedule = await WorkerSchedule.findOne({ worker: workerId })
      .populate('worker', 'name phone')
      .populate('availableSlots.booking', 'customer service date status');

    if (!schedule) {
      // Tự động tạo lịch mặc định nếu chưa có
      schedule = await WorkerSchedule.createDefaultSchedule(workerId);
      await schedule.populate('worker', 'name phone');
    }

    // Nếu có tham số date, chỉ trả về lịch của ngày đó
    if (date) {
      const targetDate = new Date(date);
      const availableSlots = schedule.getAvailableSlotsForDate(targetDate);
      return res.json({
        worker: schedule.worker,
        date: targetDate,
        availableSlots,
        currentStatus: schedule.currentStatus
      });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách tất cả thợ và lịch rãnh của họ
exports.getAllWorkersSchedule = async (req, res) => {
  try {
    const { date, status, limit = 20, page = 1 } = req.query;
    
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    // Tìm tất cả thợ
    const workerFilter = { role: 'worker', status: 'active' };
    const workers = await User.find(workerFilter)
      .select('name phone')
      .skip((pageNum - 1) * lim)
      .limit(lim);

    const schedules = [];

    for (const worker of workers) {
      let schedule = await WorkerSchedule.findOne({ worker: worker._id });
      
      if (!schedule) {
        // Tự động tạo lịch nếu chưa có
        schedule = await WorkerSchedule.createDefaultSchedule(worker._id);
      }

      if (date) {
        // Lọc theo ngày nếu có tham số date
        const targetDate = new Date(date);
        const availableSlots = schedule.getAvailableSlotsForDate(targetDate);
        
        schedules.push({
          worker: {
            _id: worker._id,
            name: worker.name,
            phone: worker.phone
          },
          availableSlots,
          currentStatus: schedule.currentStatus,
          lastUpdated: schedule.lastUpdated
        });
      } else {
        schedules.push({
          worker: {
            _id: worker._id,
            name: worker.name,
            phone: worker.phone
          },
          availableSlots: schedule.availableSlots.filter(slot => !slot.isBooked),
          currentStatus: schedule.currentStatus,
          lastUpdated: schedule.lastUpdated
        });
      }
    }

    // Lọc theo trạng thái nếu có
    let filteredSchedules = schedules;
    if (status) {
      filteredSchedules = schedules.filter(s => s.currentStatus === status);
    }

    const total = await User.countDocuments(workerFilter);

    res.json({
      schedules: filteredSchedules,
      total,
      page: pageNum,
      pages: Math.ceil(total / lim)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ cập nhật lịch rãnh của mình
exports.updateWorkerSchedule = async (req, res) => {
  try {
    const workerId = req.user.id; // Lấy từ JWT token
    const { availableSlots, workingDays, defaultWorkingHours, currentStatus } = req.body;

    let schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      schedule = await WorkerSchedule.createDefaultSchedule(workerId);
    }

    // Cập nhật các khung giờ rãnh
    if (availableSlots) {
      // Validate thời gian
      for (const slot of availableSlots) {
        const startTime = new Date(slot.startTime);
        const endTime = new Date(slot.endTime);
        
        if (startTime >= endTime) {
          return res.status(400).json({ 
            message: 'Thời gian kết thúc phải sau thời gian bắt đầu' 
          });
        }
        
        if (startTime < new Date()) {
          return res.status(400).json({ 
            message: 'Không thể tạo lịch cho thời gian đã qua' 
          });
        }
      }
      
      schedule.availableSlots = availableSlots;
    }

    // Cập nhật ngày làm việc
    if (workingDays) {
      schedule.workingDays = workingDays;
    }

    // Cập nhật giờ làm việc mặc định
    if (defaultWorkingHours) {
      schedule.defaultWorkingHours = defaultWorkingHours;
    }

    // Cập nhật trạng thái hiện tại
    if (currentStatus) {
      schedule.currentStatus = currentStatus;
    }

    schedule.lastUpdated = new Date();
    await schedule.save();

    res.json({ 
      message: 'Cập nhật lịch rãnh thành công',
      schedule 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ thêm khung giờ rãnh mới
exports.addAvailableSlot = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { startTime, endTime, note } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Thời gian bắt đầu và kết thúc là bắt buộc' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: 'Không thể tạo lịch cho thời gian đã qua' });
    }

    let schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      schedule = await WorkerSchedule.createDefaultSchedule(workerId);
    }

    // Kiểm tra trùng lịch
    const isConflict = schedule.availableSlots.some(slot => 
      (start < slot.endTime && end > slot.startTime)
    );

    if (isConflict) {
      return res.status(409).json({ message: 'Khung giờ này đã trùng với lịch hiện có' });
    }

    schedule.availableSlots.push({
      startTime: start,
      endTime: end,
      note: note || '',
      isBooked: false
    });

    schedule.lastUpdated = new Date();
    await schedule.save();

    res.json({ 
      message: 'Thêm khung giờ rãnh thành công',
      newSlot: schedule.availableSlots[schedule.availableSlots.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ xóa khung giờ rãnh
exports.removeAvailableSlot = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { slotId } = req.params;

    const schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc' });
    }

    const slotIndex = schedule.availableSlots.findIndex(
      slot => slot._id.toString() === slotId
    );

    if (slotIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy khung giờ' });
    }

    const slot = schedule.availableSlots[slotIndex];

    // Không cho phép xóa slot đã được đặt
    if (slot.isBooked) {
      return res.status(400).json({ message: 'Không thể xóa khung giờ đã được đặt' });
    }

    schedule.availableSlots.splice(slotIndex, 1);
    schedule.lastUpdated = new Date();
    await schedule.save();

    res.json({ message: 'Xóa khung giờ rãnh thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Đặt lịch cho một khung giờ rãnh
exports.bookTimeSlot = async (req, res) => {
  try {
    const { workerId, slotId } = req.params;
    const customerId = req.user.id;

    const schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc của thợ' });
    }

    const slot = schedule.availableSlots.id(slotId);
    
    if (!slot) {
      return res.status(404).json({ message: 'Không tìm thấy khung giờ' });
    }

    if (slot.isBooked) {
      return res.status(409).json({ message: 'Khung giờ này đã được đặt' });
    }

    if (slot.startTime < new Date()) {
      return res.status(400).json({ message: 'Không thể đặt lịch cho thời gian đã qua' });
    }

    // Tạo booking mới
    const booking = new Booking({
      customer: customerId,
      worker: workerId,
      service: req.body.service, // Service ID từ request
      date: slot.startTime,
      address: req.body.address,
      note: req.body.note,
      status: 'pending'
    });

    await booking.save();

    // Cập nhật slot
    slot.isBooked = true;
    slot.booking = booking._id;
    schedule.lastUpdated = new Date();
    
    await schedule.save();

    res.json({ 
      message: 'Đặt lịch thành công',
      booking: booking._id,
      slot: {
        startTime: slot.startTime,
        endTime: slot.endTime
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ cập nhật trạng thái sau khi hoàn thành công việc
exports.updateStatusAfterCompletion = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { bookingId, nextAvailableSlots } = req.body;

    // Verify booking belongs to this worker and is completed
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      worker: workerId,
      status: 'done' 
    });

    if (!booking) {
      return res.status(404).json({ 
        message: 'Không tìm thấy đơn hàng hoàn thành của bạn' 
      });
    }

    let schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      schedule = await WorkerSchedule.createDefaultSchedule(workerId);
    }

    // Thêm các khung giờ rãnh mới sau khi hoàn thành công việc
    if (nextAvailableSlots && nextAvailableSlots.length > 0) {
      for (const newSlot of nextAvailableSlots) {
        const start = new Date(newSlot.startTime);
        const end = new Date(newSlot.endTime);

        // Validate thời gian
        if (start >= end) {
          continue; // Skip invalid slots
        }

        if (start < new Date()) {
          continue; // Skip past slots
        }

        // Kiểm tra trùng lịch
        const isConflict = schedule.availableSlots.some(slot => 
          (start < slot.endTime && end > slot.startTime)
        );

        if (!isConflict) {
          schedule.availableSlots.push({
            startTime: start,
            endTime: end,
            note: newSlot.note || 'Rãnh sau khi hoàn thành công việc',
            isBooked: false
          });
        }
      }
    }

    // Cập nhật trạng thái về available
    schedule.currentStatus = 'available';
    schedule.lastUpdated = new Date();
    
    await schedule.save();

    res.json({ 
      message: 'Cập nhật lịch rãnh sau hoàn thành công việc thành công',
      newSlotsAdded: nextAvailableSlots ? nextAvailableSlots.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ cập nhật thời gian dự kiến hoàn thành khi nhận đơn
exports.updateEstimatedCompletion = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { bookingId, estimatedCompletionTime, actualStartTime } = req.body;

    if (!bookingId || !estimatedCompletionTime) {
      return res.status(400).json({ 
        message: 'Booking ID và thời gian dự kiến hoàn thành là bắt buộc' 
      });
    }

    // Verify booking belongs to this worker
    const Booking = require('../models/Booking');
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      worker: workerId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (!booking) {
      return res.status(404).json({ 
        message: 'Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn' 
      });
    }

    let schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      schedule = await WorkerSchedule.createDefaultSchedule(workerId);
    }

    // Cập nhật công việc hiện tại và tạo lịch rãnh
    schedule.updateCurrentJob(
      bookingId, 
      estimatedCompletionTime, 
      actualStartTime || new Date()
    );
    
    schedule.lastUpdated = new Date();
    await schedule.save();

    res.json({ 
      message: 'Cập nhật thời gian dự kiến hoàn thành thành công',
      estimatedCompletion: estimatedCompletionTime,
      newAvailableSlots: schedule.availableSlots.filter(slot => 
        !slot.isBooked && slot.startTime > new Date(estimatedCompletionTime)
      ).length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ cập nhật lại thời gian dự kiến nếu có thay đổi
exports.updateEstimatedTime = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { newEstimatedCompletionTime } = req.body;

    if (!newEstimatedCompletionTime) {
      return res.status(400).json({ 
        message: 'Thời gian dự kiến hoàn thành mới là bắt buộc' 
      });
    }

    const schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule || !schedule.currentJob.booking) {
      return res.status(404).json({ 
        message: 'Không tìm thấy công việc hiện tại' 
      });
    }

    // Cập nhật thời gian dự kiến mới
    schedule.currentJob.estimatedCompletionTime = new Date(newEstimatedCompletionTime);
    
    // Tạo lại lịch rãnh với thời gian mới
    schedule.generateSlotsAfterCompletion();
    schedule.lastUpdated = new Date();
    
    await schedule.save();

    res.json({ 
      message: 'Cập nhật thời gian dự kiến thành công',
      newEstimatedTime: newEstimatedCompletionTime,
      updatedSlots: schedule.availableSlots.filter(slot => 
        !slot.isBooked && slot.startTime > new Date()
      ).length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ hoàn thành công việc hiện tại
exports.completeCurrentJob = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { bookingId } = req.body;

    const schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule || !schedule.currentJob.booking) {
      return res.status(404).json({ 
        message: 'Không tìm thấy công việc hiện tại' 
      });
    }

    if (bookingId && schedule.currentJob.booking.toString() !== bookingId) {
      return res.status(400).json({ 
        message: 'Booking ID không khớp với công việc hiện tại' 
      });
    }

    // Hoàn thành công việc
    schedule.completeCurrentJob();
    await schedule.save();

    res.json({ 
      message: 'Hoàn thành công việc thành công. Trạng thái đã chuyển về sẵn sàng',
      status: 'available'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin công việc hiện tại của thợ
exports.getCurrentJob = async (req, res) => {
  try {
    const workerId = req.user.id;

    const schedule = await WorkerSchedule.findOne({ worker: workerId })
      .populate('currentJob.booking', 'customer service date status address note');

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc' });
    }

    if (!schedule.currentJob.booking) {
      return res.json({ 
        hasCurrentJob: false,
        status: schedule.currentStatus,
        message: 'Hiện tại không có công việc nào'
      });
    }

    res.json({
      hasCurrentJob: true,
      currentJob: schedule.currentJob,
      status: schedule.currentStatus,
      estimatedCompletion: schedule.currentJob.estimatedCompletionTime,
      timeRemaining: schedule.currentJob.estimatedCompletionTime ? 
        Math.max(0, new Date(schedule.currentJob.estimatedCompletionTime) - new Date()) : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tự động tạo lịch rãnh cho các ngày tới
exports.generateScheduleForDays = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { days = 7 } = req.body;

    let schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      schedule = await WorkerSchedule.createDefaultSchedule(workerId, days);
    } else {
      schedule.generateSlotsForDays(days);
      await schedule.save();
    }

    res.json({ 
      message: `Tự động tạo lịch rãnh cho ${days} ngày tới thành công`,
      schedule 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ cập nhật lịch khả dụng sau khi hoàn thành công việc
exports.updateAvailabilityAfterBooking = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { completedBookingTime, additionalDays = 3 } = req.body;

    const schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc' });
    }

    // Cập nhật trạng thái và tạo lịch mới
    schedule.updateAvailabilityAfterBooking(completedBookingTime, additionalDays);
    await schedule.save();

    res.json({ 
      message: 'Cập nhật lịch khả dụng thành công',
      status: schedule.currentStatus,
      availableSlots: schedule.availableSlots.filter(slot => 
        !slot.isBooked && slot.startTime > new Date()
      ).slice(0, 20) // Lấy 20 slot gần nhất
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thợ tự cập nhật khung giờ khả dụng cho ngày cụ thể
exports.updateCustomAvailability = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { date, availableHours } = req.body;

    if (!date || !availableHours || !Array.isArray(availableHours)) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin ngày hoặc khung giờ khả dụng' 
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const invalidTimes = availableHours.filter(time => !timeRegex.test(time));
    if (invalidTimes.length > 0) {
      return res.status(400).json({ 
        message: `Định dạng giờ không hợp lệ: ${invalidTimes.join(', ')}`
      });
    }

    const schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch làm việc' });
    }

    // Cập nhật lịch tùy chỉnh
    schedule.updateCustomAvailability(date, availableHours);
    await schedule.save();

    // Lấy lại slot của ngày được cập nhật
    const targetDate = new Date(date);
    const updatedSlots = schedule.getAvailableSlotsForDate(targetDate);

    res.json({ 
      message: 'Cập nhật khung giờ khả dụng thành công',
      date: targetDate,
      updatedSlots: updatedSlots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy khung giờ mặc định của hệ thống
exports.getDefaultTimeSlots = async (req, res) => {
  try {
    const workerId = req.user.id;
    let schedule = await WorkerSchedule.findOne({ worker: workerId });
    
    if (!schedule) {
      // Tạo schedule mặc định nếu chưa có
      schedule = await WorkerSchedule.createDefaultSchedule(workerId);
    }

    res.json({
      defaultTimeSlots: schedule.defaultTimeSlots,
      workingDays: schedule.workingDays,
      defaultWorkingHours: schedule.defaultWorkingHours
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gia hạn thời gian làm việc (ẩn thêm khung giờ)
exports.extendWorkTime = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { bookingId, additionalHours } = req.body;

    if (!bookingId || !additionalHours || additionalHours < 1 || additionalHours > 8) {
      return res.status(400).json({ 
        message: 'Booking ID và số giờ gia hạn (1-8 giờ) là bắt buộc' 
      });
    }

    // Tìm booking
    const booking = await Booking.findById(bookingId).populate('worker');
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    // Kiểm tra booking thuộc về thợ này
    if (booking.worker._id.toString() !== workerId) {
      return res.status(403).json({ message: 'Bạn không có quyền với booking này' });
    }

    // Kiểm tra booking đang trong trạng thái có thể gia hạn
    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Chỉ có thể gia hạn booking đang được xác nhận hoặc đang thực hiện' 
      });
    }

    // Tính thời gian kết thúc mới
    const currentEndTime = new Date(booking.preferredTime);
    currentEndTime.setHours(currentEndTime.getHours() + 1); // Booking ban đầu là 1 giờ
    
    const newEndTime = new Date(currentEndTime);
    newEndTime.setHours(newEndTime.getHours() + additionalHours);

    // Tìm và cập nhật WorkerSchedule
    let schedule = await WorkerSchedule.findOne({ worker: workerId });
    if (!schedule) {
      schedule = await WorkerSchedule.createDefaultSchedule(workerId);
    }

    // Tạo các slot cần ẩn (từ thời gian kết thúc cũ đến thời gian kết thúc mới)
    const slotsToBlock = [];
    const currentTime = new Date(currentEndTime);
    
    while (currentTime < newEndTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setHours(slotEnd.getHours() + 1);
      
      slotsToBlock.push({
        startTime: new Date(currentTime),
        endTime: slotEnd,
        isBooked: true, // Đánh dấu là đã đặt để ẩn khỏi web
        booking: bookingId,
        note: `Gia hạn từ booking ${bookingId}`
      });
      
      currentTime.setHours(currentTime.getHours() + 1);
    }

    // Thêm các slot bị ẩn vào lịch
    schedule.availableSlots.push(...slotsToBlock);
    
    // Cập nhật thời gian
    schedule.lastUpdated = new Date();
    await schedule.save();

    // Cập nhật booking với thời gian gia hạn
    booking.extendedEndTime = newEndTime;
    booking.additionalHours = (booking.additionalHours || 0) + additionalHours;
    await booking.save();

    res.json({ 
      message: `Đã gia hạn thêm ${additionalHours} giờ`,
      newEndTime: newEndTime,
      blockedSlots: slotsToBlock.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkerSchedule: exports.getWorkerSchedule,
  getAllWorkersSchedule: exports.getAllWorkersSchedule,
  updateWorkerSchedule: exports.updateWorkerSchedule,
  addAvailableSlot: exports.addAvailableSlot,
  removeAvailableSlot: exports.removeAvailableSlot,
  bookTimeSlot: exports.bookTimeSlot,
  updateStatusAfterCompletion: exports.updateStatusAfterCompletion,
  updateEstimatedCompletion: exports.updateEstimatedCompletion,
  updateEstimatedTime: exports.updateEstimatedTime,
  completeCurrentJob: exports.completeCurrentJob,
  getCurrentJob: exports.getCurrentJob,
  generateScheduleForDays: exports.generateScheduleForDays,
  updateAvailabilityAfterBooking: exports.updateAvailabilityAfterBooking,
  updateCustomAvailability: exports.updateCustomAvailability,
  getDefaultTimeSlots: exports.getDefaultTimeSlots,
  extendWorkTime: exports.extendWorkTime
};