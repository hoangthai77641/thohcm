const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { assignOptimalWorker, getWorkerAvailability } = require('../utils/workerAssignment');

exports.createBooking = async (req, res) => {
  try {
    console.log('=== CREATE BOOKING DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from token:', req.user);
    
    // attach customer from token if not provided
    if (!req.body.customer && req.user && req.user.id) {
      req.body.customer = req.user.id;
      console.log('Attached customer from token:', req.user.id);
    }
  // Expect service to be ObjectId; calculate finalPrice with enhanced worker assignment
  const { service: serviceId, customer, worker: requestedWorker, date, address, note } = req.body;
  if (!address || !address.trim()) return res.status(400).json({ message: 'Address is required' });
  const service = await Service.findById(serviceId);
  if (!service) return res.status(400).json({ message: 'Service not found' });
  const cust = await User.findById(req.body.customer);
  if (!cust) return res.status(400).json({ message: 'Customer not found' });

  // Enhanced worker assignment logic
  let finalWorker = requestedWorker;
  let workerAssignmentInfo = null;

  if (!requestedWorker) {
    // Auto-assign optimal worker if none specified
    try {
      const assignment = await assignOptimalWorker(serviceId, date);
      finalWorker = assignment.workerId;
      workerAssignmentInfo = assignment;
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    // Check if requested worker is available - TEMPORARILY DISABLED
    console.log('Skipping worker availability check for debugging');
    // const availability = await getWorkerAvailability(requestedWorker, date);
    // if (!availability.available) {
    //   return res.status(409).json({ 
    //     message: availability.reason || 'Thợ không khả dụng',
    //     workerWorkload: availability.workload,
    //     nextAvailableSlot: availability.nextAvailableSlot,
    //     suggestion: 'Vui lòng chọn thợ khác hoặc thời gian khác'
    //   });
    // }
  }
  
  // Enhanced date and conflict validation
  const bookingDate = new Date(date);
  const now = new Date();
  
  // Check if booking is in the past (with 5 minutes buffer for timezone issues)
  if (bookingDate.getTime() < now.getTime() - 5 * 60 * 1000) {
    return res.status(400).json({ message: 'Không thể đặt lịch trong quá khứ. Vui lòng chọn thời gian trong tương lai.' });
  }
  
  // Check if booking is too far in the future (e.g., 90 days)
  const maxFutureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  if (bookingDate.getTime() > maxFutureDate.getTime()) {
    return res.status(400).json({ message: 'Không thể đặt lịch quá xa trong tương lai. Tối đa 90 ngày.' });
  }
  
  // Final conflict check for the assigned worker
  const bufferMinutes = 30;
  const startBuffer = new Date(bookingDate.getTime() - bufferMinutes * 60 * 1000);
  const endBuffer = new Date(bookingDate.getTime() + bufferMinutes * 60 * 1000);
  
  const existingBooking = await Booking.findOne({
    worker: finalWorker,
    date: { $gte: startBuffer, $lte: endBuffer },
    status: { $in: ['pending', 'confirmed'] } // Only check active bookings
  });
  
  if (existingBooking) {
    return res.status(409).json({ 
      message: 'Thời gian này đã được đặt hoặc quá gần với lịch hẹn khác. Vui lòng chọn thời gian cách xa ít nhất 30 phút.',
      conflictDate: existingBooking.date,
      suggestedTimes: [
        new Date(endBuffer.getTime() + 15 * 60 * 1000), // 15 mins after end buffer
        new Date(startBuffer.getTime() - 15 * 60 * 1000) // 15 mins before start buffer
      ],
      assignedWorker: workerAssignmentInfo ? workerAssignmentInfo.workerName : null
    });
  }
  
  // Dynamic pricing with better VIP handling
  const isVip = cust.loyaltyLevel === 'vip';
  const basePrice = service.basePrice;
  const vipDiscountPercent = 0.1; // 10% discount - can be made configurable
  const vipDiscount = isVip ? basePrice * vipDiscountPercent : 0;
  const finalPrice = Math.round(basePrice - vipDiscount);
  
  const booking = new Booking({ 
    service: serviceId, 
    customer, 
    worker: finalWorker, 
    date: bookingDate, 
    preferredTime: bookingDate, // Thêm preferredTime field
    address: address.trim(), 
    note, 
    finalPrice,
    // Store pricing info for transparency
    basePrice: basePrice,
    vipDiscount: vipDiscount,
    appliedVipStatus: isVip,
    // Store assignment info
    priority: note && note.toLowerCase().includes('gấp') ? 'urgent' : 'normal'
  });
    await booking.save();

    // emit realtime event to worker room and broadcast to everyone
    let populated = await Booking.findById(booking._id)
      .populate({ path: 'customer', select: 'name phone address' })
      .populate({ path: 'worker', select: 'name phone' })
      .populate({ path: 'service', select: 'name basePrice promoPercent' });
    try {
      const io = req.app.get('io');
      if (io && booking.worker) {
        // Emit to specific worker room
        io.to(String(booking.worker)).emit('bookingCreated', populated);
        // Emit to all customers for availability updates (not duplicate for worker)
        io.emit('bookingConflict', { serviceId: booking.service, date: booking.date });
      }
    } catch (e) {
      console.error('Socket emit error', e.message);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    let filter = {};
    // optional status filter
    if (req.query && req.query.status) {
      filter.status = req.query.status;
    }
    // if worker role, show only their bookings; admin sees all
    if (req.user && req.user.role === 'worker') {
      filter.worker = req.user.id;
    }
    const bookings = await Booking.find(filter)
      .populate({ path: 'customer', select: 'name phone address' })
      .populate({ path: 'worker', select: 'name phone' })
      .populate({ path: 'service', select: 'name basePrice promoPercent' })
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// customers: get their own bookings
exports.getMyBookings = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'Unauthorized' })
    const bookings = await Booking.find({ customer: req.user.id })
      .populate({ path: 'customer', select: 'name phone address' })
      .populate({ path: 'worker', select: 'name phone' })
      .populate({ path: 'service', select: 'name basePrice promoPercent' })
      .sort({ createdAt: -1 }) // Sort by newest first
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// worker or admin updates booking status (e.g., confirm, done)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, estimatedCompletionTime } = req.body
  const booking = await Booking.findById(id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    booking.status = status
    await booking.save()

    // Khi thợ xác nhận nhận đơn (status = 'confirmed'), cập nhật lịch rãnh dự kiến
    if (status === 'confirmed' && estimatedCompletionTime) {
      const WorkerSchedule = require('../models/WorkerSchedule');
      let workerSchedule = await WorkerSchedule.findOne({ worker: booking.worker });
      
      if (!workerSchedule) {
        workerSchedule = await WorkerSchedule.createDefaultSchedule(booking.worker);
      }
      
      // Cập nhật công việc hiện tại và tạo lịch rãnh dự kiến
      workerSchedule.updateCurrentJob(booking._id, estimatedCompletionTime, new Date());
      workerSchedule.lastUpdated = new Date();
      await workerSchedule.save();
      
      // Emit realtime update về lịch rãnh mới
      try {
        const io = req.app.get('io');
        if (io) {
          io.emit('workerScheduleUpdated', {
            workerId: booking.worker,
            estimatedCompletion: estimatedCompletionTime,
            newAvailableSlots: workerSchedule.availableSlots.filter(slot => 
              !slot.isBooked && slot.startTime > new Date(estimatedCompletionTime)
            )
          });
        }
      } catch (e) {
        console.error('Socket schedule emit error', e.message);
      }
    }

    // if done, increase customer's usage count and set loyalty (with transaction)
    if (status === 'done') {
      const session = await require('mongoose').startSession();
      try {
        await session.withTransaction(async () => {
          const customer = await User.findById(booking.customer).session(session);
          if (customer) {
            customer.usageCount = (customer.usageCount || 0) + 1;
            // Dynamic VIP threshold - can be made configurable
            const vipThreshold = 3;
            const oldLoyaltyLevel = customer.loyaltyLevel;
            
            if (customer.usageCount >= vipThreshold && customer.loyaltyLevel !== 'vip') {
              customer.loyaltyLevel = 'vip';
            }
            
            await customer.save({ session });
            
            // Update worker schedule - mark booked slot as completed and set worker available
            const WorkerSchedule = require('../models/WorkerSchedule');
            let workerSchedule = await WorkerSchedule.findOne({ worker: booking.worker }).session(session);
            
            if (workerSchedule) {
              // Find and update the booked slot
              const bookedSlot = workerSchedule.availableSlots.find(slot => 
                slot.booking && slot.booking.toString() === booking._id.toString()
              );
              
              if (bookedSlot) {
                // Remove the completed booking slot or mark it as completed
                const slotIndex = workerSchedule.availableSlots.findIndex(slot => 
                  slot.booking && slot.booking.toString() === booking._id.toString()
                );
                if (slotIndex !== -1) {
                  workerSchedule.availableSlots.splice(slotIndex, 1);
                }
              }
              
              // Set worker status back to available
              workerSchedule.currentStatus = 'available';
              workerSchedule.lastUpdated = new Date();
              await workerSchedule.save({ session });
            }
            
            // Emit loyalty update to worker and customer with better UX info
            try {
              const io = req.app.get('io');
              if (io) {
                const loyaltyData = { 
                  customerId: customer._id, 
                  loyaltyLevel: customer.loyaltyLevel, 
                  usageCount: customer.usageCount,
                  newVip: oldLoyaltyLevel !== 'vip' && customer.loyaltyLevel === 'vip',
                  bookingId: booking._id
                };
                io.to(String(booking.worker)).emit('loyaltyUpdated', loyaltyData);
                io.to(String(booking.customer)).emit('loyaltyUpdated', loyaltyData);
                
                // Emit worker availability update
                io.emit('workerAvailabilityUpdated', {
                  workerId: booking.worker,
                  status: 'available',
                  completedBooking: booking._id
                });
              }
            } catch(e){ console.error('Socket loyalty emit error', e.message); }
          }
        });
      } finally {
        await session.endSession();
      }
    }
    const populated = await Booking.findById(id)
      .populate({ path: 'customer', select: 'name phone address' })
      .populate({ path: 'worker', select: 'name phone' })
      .populate({ path: 'service', select: 'name basePrice promoPercent' });
    // emit bookingUpdated to worker room and broadcast to everyone
    try {
      const io = req.app.get('io');
      if (io) {
        // Emit to specific worker room
        io.to(String(populated.worker._id)).emit('bookingUpdated', populated);
        // Emit to all customers for availability updates (different event)
        io.emit('bookingConflict', { serviceId: populated.service._id, date: populated.date });
      }
    } catch(e){ console.error('Socket bookingUpdated error', e.message); }

    res.json(populated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// Worker/admin: get statistics for dashboard
// - Income (today, this month, total) from completed bookings (status = 'done')
// - Bookings count by status
// - Services count (total/active/inactive)
exports.getWorkerStats = async (req, res) => {
  try {
    // Determine which worker to compute for
    let workerId = req.user && req.user.id;
    if (req.user && req.user.role === 'admin' && req.query.workerId) {
      workerId = req.query.workerId;
    }
    if (!workerId) return res.status(400).json({ message: 'workerId required' });

    // Time range filter
    const range = req.query.range || 'today';
    const now = new Date();
    let dateFilter = null;
    
    switch (range) {
      case 'today':
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        dateFilter = { $gte: startOfToday, $lt: startOfTomorrow };
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        dateFilter = { $gte: startOfWeek };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { $gte: startOfMonth };
        break;
      case 'all':
      default:
        dateFilter = null; // No date filter for 'all'
        break;
    }

    // Legacy date ranges for backward compatibility
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const toObjectId = (id) => require('mongoose').Types.ObjectId.createFromHexString(String(id));
    const workerObjId = toObjectId(workerId);

    // Income aggregations (status done)
    const incomeAgg = async (dateFilter) => {
      const match = {
        worker: workerObjId,
        status: 'done',
        ...(dateFilter ? { date: dateFilter } : {}),
      };
      const result = await Booking.aggregate([
        { $match: match },
        { $group: { _id: null, sum: { $sum: { $ifNull: ['$finalPrice', 0] } } } },
      ]);
      return (result[0]?.sum) || 0;
    };

    const [incomeToday, incomeMonth, incomeTotal] = await Promise.all([
      incomeAgg({ $gte: startOfToday, $lt: startOfTomorrow }),
      incomeAgg({ $gte: startOfMonth }),
      incomeAgg(),
    ]);

    // Bookings by status (with time filter if applicable)
    const bookingsMatch = {
      worker: workerObjId,
      ...(dateFilter ? { date: dateFilter } : {}),
    };
    const bookingsByStatusRaw = await Booking.aggregate([
      { $match: bookingsMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const bookingsByStatus = {
      pending: 0,
      confirmed: 0,
      done: 0,
      cancelled: 0,
    };
    bookingsByStatusRaw.forEach((r) => { bookingsByStatus[r._id] = r.count; });

    // Services statistics for this worker
    const [servicesTotal, servicesActive] = await Promise.all([
      Service.countDocuments({ worker: workerObjId }),
      Service.countDocuments({ worker: workerObjId, isActive: true }),
    ]);
    const servicesInactive = Math.max(servicesTotal - servicesActive, 0);

    res.json({
      income: { today: incomeToday, month: incomeMonth, total: incomeTotal },
      bookingsByStatus,
      services: { total: servicesTotal, active: servicesActive, inactive: servicesInactive },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get worker's busy times (confirmed and pending bookings)
exports.getWorkerBusyTimes = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { date } = req.query; // Optional date filter (YYYY-MM-DD format)
    
    let filter = {
      worker: workerId,
      status: { $in: ['pending', 'confirmed'] }, // Only pending and confirmed bookings block time
    };

    // If date is provided, filter bookings for that specific date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else {
      // Only return future bookings
      filter.date = { $gte: new Date() };
    }

    const busyBookings = await Booking.find(filter)
      .select('date status')
      .sort({ date: 1 });

    // Get full booking details including extended time
    const fullBookings = await Booking.find(filter)
      .select('date preferredTime status additionalHours extendedEndTime')
      .sort({ date: 1 });

    // Format busy times for frontend - create hourly slots
    const busyTimes = [];
    
    fullBookings.forEach(booking => {
      const startTime = booking.preferredTime || booking.date;
      
      // Calculate total duration (default 1 hour + additional hours)
      const totalHours = 1 + (booking.additionalHours || 0);
      
      // Create hourly slots to block all affected time slots
      for (let i = 0; i < totalHours; i++) {
        const slotStart = new Date(startTime.getTime() + i * 60 * 60 * 1000);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        
        busyTimes.push({
          start: slotStart,
          end: slotEnd,
          status: booking.status
        });
      }
    });

    res.json({ busyTimes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cancel booking by customer
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const customerId = req.user.id;

    // Find booking and verify ownership
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      customer: customerId 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or not authorized' });
    }

    // Only allow cancellation if booking is pending or confirmed
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking with current status: ' + booking.status 
      });
    }

    // Check if booking is within 24 hours
    const bookingDate = new Date(booking.date);
    const now = new Date();
    const hoursDifference = (bookingDate - now) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking less than 24 hours before scheduled time' 
      });
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    booking.note = (booking.note || '') + '\n[Cancelled by customer]';
    await booking.save();

    // Emit realtime event
    try {
      const io = req.app.get('io');
      if (io) {
        const populatedBooking = await Booking.findById(booking._id)
          .populate({ path: 'customer', select: 'name phone address' })
          .populate({ path: 'worker', select: 'name phone' })
          .populate({ path: 'service', select: 'name basePrice' });

        // Notify worker
        if (booking.worker) {
          io.to(`worker_${booking.worker}`).emit('booking_cancelled', populatedBooking);
        }
        
        // Broadcast to all connected clients
        io.emit('booking_updated', populatedBooking);
      }
    } catch (ioErr) {
      console.error('Socket emission error:', ioErr);
    }

    res.json({ 
      message: 'Booking cancelled successfully',
      booking: booking
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get available workers for a specific service and time
exports.getAvailableWorkers = async (req, res) => {
  try {
    const { serviceId, date } = req.query;
    
    if (!serviceId || !date) {
      return res.status(400).json({ 
        message: 'serviceId và date là bắt buộc' 
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Dịch vụ không tồn tại' });
    }

    // Get all active workers
    const workers = await User.find({
      role: 'worker',
      status: 'active'
    }).select('name phone');

    const bookingDate = new Date(date);
    
    // Check availability for each worker
    const workersWithAvailability = await Promise.all(
      workers.map(async (worker) => {
        const { getWorkerAvailability } = require('../utils/workerAssignment');
        const availability = await getWorkerAvailability(worker._id, bookingDate);
        
        return {
          _id: worker._id,
          name: worker.name,
          phone: worker.phone,
          available: availability.available,
          workload: availability.workload,
          maxCapacity: availability.maxCapacity,
          hasTimeConflict: availability.hasTimeConflict,
          nextAvailableSlot: availability.nextAvailableSlot,
          reason: availability.reason
        };
      })
    );

    // Separate available and unavailable workers
    const availableWorkers = workersWithAvailability.filter(w => w.available);
    const unavailableWorkers = workersWithAvailability.filter(w => !w.available);

    // Sort available workers by workload (ascending - ít việc nhất lên đầu)
    availableWorkers.sort((a, b) => a.workload - b.workload);

    res.json({
      service: {
        _id: service._id,
        name: service.name,
        basePrice: service.basePrice
      },
      requestedDate: bookingDate,
      availableWorkers,
      unavailableWorkers,
      totalWorkers: workers.length,
      availableCount: availableWorkers.length,
      message: availableWorkers.length > 0 
        ? `Có ${availableWorkers.length} thợ khả dụng trong thời gian này`
        : 'Không có thợ nào khả dụng trong thời gian này. Vui lòng chọn thời gian khác.'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get customer personal stats
exports.getMyStats = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Get all customer bookings with service details
    const bookings = await Booking.find({ customer: customerId })
      .populate('service', 'name basePrice')
      .sort({ date: -1 });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'done').length;
    const totalSpent = bookings
      .filter(b => b.status === 'done')
      .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    // Calculate favorite services
    const serviceStats = {};
    bookings.forEach(booking => {
      if (booking.service && booking.status === 'done') {
        const serviceName = booking.service.name;
        serviceStats[serviceName] = (serviceStats[serviceName] || 0) + 1;
      }
    });

    const favoriteServices = Object.entries(serviceStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate monthly bookings (last 6 months)
    const now = new Date();
    const monthlyBookings = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= date && bookingDate < nextMonth;
      }).length;

      monthlyBookings.push({
        month: date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        count
      });
    }

    // Get customer loyalty level
    const customer = await User.findById(customerId);
    const loyaltyLevel = customer?.loyaltyLevel || 'regular';

    res.json({
      totalBookings,
      completedBookings,
      totalSpent,
      favoriteServices,
      monthlyBookings,
      loyaltyLevel
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
