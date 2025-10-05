const User = require('../models/User');
const Booking = require('../models/Booking');

// Enhanced worker assignment logic with load balancing
exports.assignOptimalWorker = async (serviceId, bookingDate) => {
  try {
    const bookingTime = new Date(bookingDate);
    const dayStart = new Date(bookingTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(bookingTime);
    dayEnd.setHours(23, 59, 59, 999);

    // Find all active workers who can handle this service
    const availableWorkers = await User.find({
      role: 'worker',
      status: 'active'
    });

    if (availableWorkers.length === 0) {
      throw new Error('Không có thợ nào khả dụng');
    }

    // Get worker workload for today
    const workerWorkloads = await Promise.all(
      availableWorkers.map(async (worker) => {
        // Count active bookings for today
        const todayBookings = await Booking.countDocuments({
          worker: worker._id,
          date: { $gte: dayStart, $lte: dayEnd },
          status: { $in: ['pending', 'confirmed'] }
        });

        // Check if worker has any booking conflicts (30-minute buffer)
        const bufferStart = new Date(bookingTime.getTime() - 30 * 60 * 1000);
        const bufferEnd = new Date(bookingTime.getTime() + 30 * 60 * 1000);
        
        const hasConflict = await Booking.findOne({
          worker: worker._id,
          date: { $gte: bufferStart, $lte: bufferEnd },
          status: { $in: ['pending', 'confirmed'] }
        });

        return {
          worker,
          workload: todayBookings,
          hasConflict: !!hasConflict,
          // Calculate worker score (lower is better)
          score: todayBookings + (hasConflict ? 1000 : 0) // Heavy penalty for conflicts
        };
      })
    );

    // Filter out workers with conflicts
    const availableWorkersWithoutConflict = workerWorkloads.filter(w => !w.hasConflict);

    if (availableWorkersWithoutConflict.length === 0) {
      throw new Error('Không có thợ nào khả dụng trong khung giờ này');
    }

    // Sort by score (workload) - assign to worker with least workload
    availableWorkersWithoutConflict.sort((a, b) => a.score - b.score);

    const selectedWorker = availableWorkersWithoutConflict[0];

    return {
      workerId: selectedWorker.worker._id,
      workerName: selectedWorker.worker.name,
      currentWorkload: selectedWorker.workload,
      totalAvailableWorkers: availableWorkersWithoutConflict.length
    };

  } catch (error) {
    throw new Error(`Lỗi khi tìm thợ phù hợp: ${error.message}`);
  }
};

// Get worker availability status
exports.getWorkerAvailability = async (workerId, date) => {
  try {
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker' || worker.status !== 'active') {
      return { available: false, reason: 'Thợ không khả dụng' };
    }

    const bookingDate = new Date(date);
    const dayStart = new Date(bookingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(bookingDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Check today's workload
    const todayBookings = await Booking.countDocuments({
      worker: workerId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Check for specific time conflicts
    const bufferStart = new Date(bookingDate.getTime() - 30 * 60 * 1000);
    const bufferEnd = new Date(bookingDate.getTime() + 30 * 60 * 1000);
    
    const hasConflict = await Booking.findOne({
      worker: workerId,
      date: { $gte: bufferStart, $lte: bufferEnd },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Define max bookings per day (configurable)
    const maxBookingsPerDay = 8;

    return {
      available: !hasConflict && todayBookings < maxBookingsPerDay,
      workload: todayBookings,
      maxCapacity: maxBookingsPerDay,
      hasTimeConflict: !!hasConflict,
      nextAvailableSlot: hasConflict ? await findNextAvailableSlot(workerId, bookingDate) : null
    };

  } catch (error) {
    return { available: false, reason: error.message };
  }
};

// Find next available time slot for a worker
async function findNextAvailableSlot(workerId, preferredDate) {
  try {
    const startTime = new Date(preferredDate);
    const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000); // Search within 7 days

    // Get all bookings for this worker in the next 7 days
    const existingBookings = await Booking.find({
      worker: workerId,
      date: { $gte: startTime, $lte: endTime },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ date: 1 });

    // Find 2-hour gaps between bookings
    const minGapHours = 2;
    let currentTime = new Date(startTime);

    for (const booking of existingBookings) {
      const bookingTime = new Date(booking.date);
      const timeDiff = bookingTime.getTime() - currentTime.getTime();
      
      if (timeDiff >= minGapHours * 60 * 60 * 1000) {
        return currentTime;
      }
      
      // Move current time to after this booking (with 1-hour service duration assumption)
      currentTime = new Date(bookingTime.getTime() + 60 * 60 * 1000);
    }

    // If no gap found in existing bookings, return time after last booking
    return currentTime;

  } catch (error) {
    return null;
  }
}

module.exports = exports;