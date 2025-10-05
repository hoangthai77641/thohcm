const express = require('express');
const router = express.Router();
const WorkerMatchingService = require('../services/WorkerMatchingService');
const PricingEngine = require('../services/PricingEngine');

// Import auth middleware
const authMiddleware = require('../middleware/auth');
const auth = authMiddleware(); // Call it without roles for general auth

// Get pricing estimate
router.post('/estimate', async (req, res) => {
  try {
    const { serviceType, district, urgency } = req.body;
    
    const estimate = PricingEngine.getEstimate(serviceType, district, urgency);
    
    res.json({
      success: true,
      estimate
    });
  } catch (error) {
    console.error('Pricing estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tính toán giá dịch vụ'
    });
  }
});

// Get available workers in area
router.post('/workers/available', auth, async (req, res) => {
  try {
    const { location, serviceDetails, urgency } = req.body;
    
    const workers = await WorkerMatchingService.findBestWorkers({
      location,
      serviceDetails,
      urgency
    }, 10);
    
    res.json({
      success: true,
      workers: workers.map(item => ({
        id: item.worker._id,
        name: item.worker.name,
        rating: item.worker.performance.averageRating,
        completedJobs: item.worker.performance.completedJobs,
        specializations: item.worker.specializations,
        distance: item.worker.location.coordinates ? 
          item.worker.calculateDistance(location.coordinates) : null,
        matchScore: item.score,
        estimatedArrival: '15-30 phút' // This would be calculated based on distance
      }))
    });
  } catch (error) {
    console.error('Available workers error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tìm thợ trong khu vực'
    });
  }
});

// Create enhanced booking with auto-assignment
router.post('/book', auth, async (req, res) => {
  try {
    const {
      serviceDetails,
      location,
      scheduledTime,
      urgency = 'normal',
      note,
      autoAssign = true
    } = req.body;
    
    const customer = req.user;
    
    // Calculate pricing
    const pricing = PricingEngine.calculatePrice({
      serviceDetails,
      location,
      scheduledTime,
      urgency,
      customerLoyalty: customer.loyaltyLevel
    });
    
    // Create booking
    const BookingEnhanced = require('../models/BookingEnhanced');
    const booking = new BookingEnhanced({
      customer: customer._id,
      service: serviceDetails.serviceId, // If specific service selected
      location,
      serviceDetails,
      pricing,
      timeline: {
        createdAt: new Date(),
        estimatedDuration: serviceDetails.estimatedDuration || 60
      },
      status: 'pending',
      note
    });

    await booking.save();

    // Auto-assign worker if requested
    if (autoAssign) {
      setTimeout(async () => {
        try {
          await WorkerMatchingService.autoAssignWorker(booking._id);
        } catch (error) {
          console.error('Auto-assignment failed:', error);
        }
      }, 1000); // Small delay to ensure booking is saved
    }

    // Populate customer info for response
    await booking.populate('customer', 'name phone');

    res.status(201).json({
      success: true,
      booking: {
        id: booking._id,
        status: booking.status,
        pricing: booking.pricing,
        timeline: booking.timeline,
        location: booking.location,
        serviceDetails: booking.serviceDetails
      },
      message: autoAssign ? 
        'Đơn hàng đã được tạo và đang tìm thợ phù hợp' : 
        'Đơn hàng đã được tạo thành công'
    });

  } catch (error) {
    console.error('Enhanced booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo đơn hàng'
    });
  }
});

// Update worker location (for tracking)
router.post('/worker/location', auth, async (req, res) => {
  try {
    const { coordinates, district, ward, fullAddress } = req.body;
    const workerId = req.user._id;
    
    if (req.user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ thợ mới có thể cập nhật vị trí'
      });
    }

    const worker = await WorkerMatchingService.updateWorkerStatus(
      workerId,
      true, // Assuming online when updating location  
      { coordinates, district, ward, fullAddress }
    );

    // Update any active bookings with new worker location
    const BookingEnhanced = require('../models/BookingEnhanced');
    const activeBookings = await BookingEnhanced.find({
      worker: workerId,
      status: { $in: ['assigned', 'confirmed', 'in_progress'] }
    });

    for (const booking of activeBookings) {
      await booking.updateWorkerLocation(coordinates);
      
      // Notify customer via Socket.IO
      const io = req.app.get('io');
      io.to(booking.customer.toString()).emit('worker_location_update', {
        bookingId: booking._id,
        workerLocation: coordinates,
        estimatedArrival: booking.calculateETA(coordinates)
      });
    }

    res.json({
      success: true,
      location: worker.location,
      activeBookings: activeBookings.length
    });

  } catch (error) {
    console.error('Worker location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật vị trí'
    });
  }
});

// Get worker stats for admin dashboard
router.get('/admin/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { district } = req.query;
    const stats = await WorkerMatchingService.getWorkerStats(district);
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Worker stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê'
    });
  }
});

// Toggle worker online/offline status
router.post('/worker/status', auth, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const workerId = req.user._id;
    
    if (req.user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ thợ mới có thể thay đổi trạng thái'
      });
    }

    const worker = await WorkerMatchingService.updateWorkerStatus(workerId, isOnline);
    
    // Notify system about worker status change
    const io = req.app.get('io');
    io.emit('worker_status_change', {
      workerId,
      isOnline,
      location: worker.location
    });

    res.json({
      success: true,
      status: isOnline ? 'online' : 'offline',
      lastOnline: worker.performance.lastOnline
    });

  } catch (error) {
    console.error('Worker status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái'
    });
  }
});

// Get booking with real-time tracking info
router.get('/booking/:id/tracking', auth, async (req, res) => {
  try {
    const BookingEnhanced = require('../models/BookingEnhanced');
    const booking = await BookingEnhanced.findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('worker', 'name phone performance location');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Check if user can access this booking
    const isCustomer = booking.customer._id.toString() === req.user._id.toString();
    const isWorker = booking.worker && booking.worker._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isWorker && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập đơn hàng này'
      });
    }

    res.json({
      success: true,
      booking: {
        id: booking._id,
        status: booking.status,
        timeline: booking.timeline,
        tracking: booking.tracking,
        worker: booking.worker ? {
          name: booking.worker.name,
          phone: booking.worker.phone,
          rating: booking.worker.performance.averageRating,
          location: booking.worker.location
        } : null,
        customer: {
          name: booking.customer.name,
          phone: isWorker || isAdmin ? booking.customer.phone : null
        },
        location: booking.location,
        serviceDetails: booking.serviceDetails,
        pricing: booking.pricing
      }
    });

  } catch (error) {
    console.error('Booking tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin tracking'
    });
  }
});

module.exports = router;