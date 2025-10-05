const UserEnhanced = require('../models/UserEnhanced');

class WorkerMatchingService {
  /**
   * Find the best available workers for a booking request
   * @param {Object} bookingRequest - Contains location, serviceType, urgency
   * @param {number} limit - Maximum number of workers to return
   * @returns {Array} Sorted array of workers with matching scores
   */
  static async findBestWorkers(bookingRequest, limit = 5) {
    const { location, serviceDetails, urgency = 'normal' } = bookingRequest;
    const { coordinates, district } = location;
    const { type: serviceType } = serviceDetails;

    try {
      // Find all available workers in the area
      const workers = await UserEnhanced.find({
        role: 'worker',
        status: 'active',
        'performance.isOnline': true,
        'serviceArea.isActive': true,
        $or: [
          { 'serviceArea.districts': district },
          {
            'location.coordinates': {
              $near: {
                $geometry: { type: 'Point', coordinates: coordinates },
                $maxDistance: 20000 // 20km max
              }
            }
          }
        ]
      }).populate('serviceArea');

      // Score and rank workers
      const scoredWorkers = workers
        .map(worker => ({
          worker,
          score: this.calculateWorkerScore(worker, bookingRequest)
        }))
        .filter(item => item.score > 0) // Remove workers who can't serve
        .sort((a, b) => b.score - a.score) // Highest score first
        .slice(0, limit);

      return scoredWorkers;
    } catch (error) {
      console.error('Worker matching error:', error);
      throw new Error('Unable to find available workers');
    }
  }

  /**
   * Calculate matching score for a worker
   * Higher score = better match
   */
  static calculateWorkerScore(worker, bookingRequest) {
    let score = 0;
    const { location, serviceDetails, urgency } = bookingRequest;
    const { coordinates, district } = location;
    const { type: serviceType } = serviceDetails;

    // Base score
    score += 100;

    // 1. Distance factor (closer = better)
    if (worker.location.coordinates && coordinates) {
      const distance = worker.calculateDistance(coordinates);
      if (distance <= 5) score += 50;
      else if (distance <= 10) score += 30;
      else if (distance <= 15) score += 15;
      else if (distance <= 20) score += 5;
      else return 0; // Too far
    }

    // 2. District preference
    if (worker.serviceArea.districts.includes(district)) {
      score += 30;
    }

    // 3. Specialization match
    if (worker.specializations.includes(serviceType)) {
      score += 40;
    } else if (worker.specializations.includes('all')) {
      score += 20;
    }

    // 4. Performance metrics
    const performance = worker.performance;
    
    // Rating (0-5 stars)
    if (performance.averageRating >= 4.5) score += 25;
    else if (performance.averageRating >= 4.0) score += 20;
    else if (performance.averageRating >= 3.5) score += 15;
    else if (performance.averageRating >= 3.0) score += 10;
    else if (performance.averageRating < 3.0) score -= 20;

    // Completion rate
    const completionRate = performance.completedJobs / Math.max(performance.totalJobs, 1);
    if (completionRate >= 0.95) score += 20;
    else if (completionRate >= 0.90) score += 15;
    else if (completionRate >= 0.85) score += 10;
    else if (completionRate < 0.75) score -= 15;

    // Response time (faster = better)
    if (performance.responseTime <= 5) score += 15;
    else if (performance.responseTime <= 10) score += 10;
    else if (performance.responseTime <= 15) score += 5;
    else if (performance.responseTime > 30) score -= 10;

    // 5. Urgency factor
    if (urgency === 'emergency') {
      // For emergencies, prioritize immediate availability
      const timeSinceOnline = Date.now() - new Date(worker.performance.lastOnline);
      if (timeSinceOnline < 5 * 60 * 1000) score += 30; // Online in last 5 minutes
      else if (timeSinceOnline < 15 * 60 * 1000) score += 15; // Last 15 minutes
    }

    // 6. Certifications bonus
    if (worker.performance.certifications && worker.performance.certifications.length > 0) {
      score += worker.performance.certifications.length * 5;
    }

    // 7. Workload factor (less busy = better)
    // This would require tracking current active bookings
    // For now, we'll use a simple metric
    if (performance.totalJobs < 5) score += 10; // New workers get small boost

    return Math.max(0, score);
  }

  /**
   * Auto-assign the best worker to a booking
   */
  static async autoAssignWorker(bookingId, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      const BookingEnhanced = require('../models/BookingEnhanced');
      const booking = await BookingEnhanced.findById(bookingId).populate('service');
      if (!booking || booking.status !== 'pending') {
        throw new Error('Booking not available for assignment');
      }

      const bestWorkers = await this.findBestWorkers({
        location: booking.location,
        serviceDetails: booking.serviceDetails,
        urgency: booking.serviceDetails.urgency
      }, 1);

      if (bestWorkers.length === 0) {
        throw new Error('No available workers found');
      }

      const bestWorker = bestWorkers[0];
      await booking.assignWorker(bestWorker.worker._id, bestWorker.score);

      // Notify worker via Socket.IO
      const io = require('../server').io;
      io.to(bestWorker.worker._id.toString()).emit('new_booking_assignment', {
        bookingId: booking._id,
        customerName: booking.customer.name,
        location: booking.location,
        serviceType: booking.serviceDetails.type,
        urgency: booking.serviceDetails.urgency,
        estimatedPrice: booking.pricing.finalPrice
      });

      return { success: true, worker: bestWorker.worker, score: bestWorker.score };

    } catch (error) {
      console.error(`Auto-assignment failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        // Retry after a short delay
        setTimeout(() => {
          this.autoAssignWorker(bookingId, retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        // Final fallback: manual assignment needed
        await BookingEnhanced.findByIdAndUpdate(bookingId, {
          status: 'pending',
          'assignment.autoAssigned': false,
          'assignment.assignmentScore': 0
        });
        
        // Notify admin
        const io = require('../server').io;
        io.emit('manual_assignment_needed', { bookingId });
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Update worker availability status
   */
  static async updateWorkerStatus(workerId, isOnline, location = null) {
    const updateData = {
      'performance.isOnline': isOnline,
      'performance.lastOnline': new Date()
    };

    if (location) {
      updateData['location.coordinates'] = location.coordinates;
      updateData['location.district'] = location.district;
      updateData['location.ward'] = location.ward;
      updateData['location.fullAddress'] = location.fullAddress;
    }

    return await UserEnhanced.findByIdAndUpdate(workerId, updateData, { new: true });
  }

  /**
   * Get worker statistics for admin dashboard
   */
  static async getWorkerStats(district = null) {
    const matchConditions = { role: 'worker', status: 'active' };
    if (district) {
      matchConditions['serviceArea.districts'] = district;
    }

    const stats = await UserEnhanced.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalWorkers: { $sum: 1 },
          onlineWorkers: {
            $sum: { $cond: [{ $eq: ['$performance.isOnline', true] }, 1, 0] }
          },
          averageRating: { $avg: '$performance.averageRating' },
          totalJobs: { $sum: '$performance.totalJobs' },
          completedJobs: { $sum: '$performance.completedJobs' }
        }
      }
    ]);

    return stats[0] || {
      totalWorkers: 0,
      onlineWorkers: 0,
      averageRating: 0,
      totalJobs: 0,
      completedJobs: 0
    };
  }
}

module.exports = WorkerMatchingService;