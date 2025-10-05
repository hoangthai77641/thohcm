class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Notify customer when worker is assigned
  notifyWorkerAssigned(customerId, workerData, bookingData) {
    this.io.to(customerId.toString()).emit('worker_assigned', {
      type: 'worker_assigned',
      title: 'Đã tìm thấy thợ!',
      message: `Thợ ${workerData.name} đã nhận việc của bạn`,
      data: {
        bookingId: bookingData._id,
        worker: {
          name: workerData.name,
          phone: workerData.phone,
          rating: workerData.performance.averageRating,
          photo: workerData.photo
        },
        estimatedArrival: this.calculateETA(workerData.location, bookingData.location)
      },
      timestamp: new Date()
    });

    // Also send push notification
    this.sendPushNotification(customerId, {
      title: 'Đã tìm thấy thợ!',
      body: `Thợ ${workerData.name} đang đến địa chỉ của bạn`,
      data: { bookingId: bookingData._id.toString() }
    });
  }

  // Notify worker about new job assignment
  notifyNewJobAssignment(workerId, bookingData, customerData) {
    this.io.to(workerId.toString()).emit('new_job_assignment', {
      type: 'new_job_assignment',
      title: 'Có việc mới!',
      message: `Khách hàng ${customerData.name} cần sửa ${bookingData.serviceDetails.type}`,
      data: {
        bookingId: bookingData._id,
        customer: {
          name: customerData.name,
          phone: customerData.phone,
          address: bookingData.location.fullAddress
        },
        service: {
          type: bookingData.serviceDetails.type,
          description: bookingData.serviceDetails.issueDescription,
          urgency: bookingData.serviceDetails.urgency
        },
        pricing: bookingData.pricing,
        distance: this.calculateDistance(bookingData.worker.location, bookingData.location)
      },
      timestamp: new Date(),
      autoAcceptTimeout: 300000 // 5 minutes to accept
    });

    // Set auto-reject timer
    setTimeout(() => {
      this.io.to(workerId.toString()).emit('job_assignment_expired', {
        bookingId: bookingData._id,
        message: 'Hết thời gian nhận việc'
      });
    }, 300000);
  }

  // Notify customer about worker location updates
  notifyWorkerLocationUpdate(customerId, locationData) {
    this.io.to(customerId.toString()).emit('worker_location_update', {
      type: 'location_update',
      data: {
        coordinates: locationData.coordinates,
        address: locationData.address,
        estimatedArrival: locationData.estimatedArrival,
        distance: locationData.distance
      },
      timestamp: new Date()
    });
  }

  // Notify about booking status changes
  notifyBookingStatusChange(userId, bookingData, statusChange) {
    const statusMessages = {
      'assigned': 'Đã có thợ nhận việc',
      'confirmed': 'Thợ đã xác nhận và đang đến',
      'in_progress': 'Thợ đã bắt đầu thực hiện',
      'completed': 'Dịch vụ hoàn thành',
      'cancelled': 'Đơn hàng đã bị hủy'
    };

    this.io.to(userId.toString()).emit('booking_status_change', {
      type: 'status_change',
      title: 'Cập nhật đơn hàng',
      message: statusMessages[statusChange.newStatus] || 'Trạng thái đơn hàng đã thay đổi',
      data: {
        bookingId: bookingData._id,
        oldStatus: statusChange.oldStatus,
        newStatus: statusChange.newStatus,
        timeline: bookingData.timeline
      },
      timestamp: new Date()
    });
  }

  // Notify about payment status
  notifyPaymentStatus(userId, paymentData) {
    const isSuccess = paymentData.status === 'success';
    
    this.io.to(userId.toString()).emit('payment_status', {
      type: 'payment_status',
      title: isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại',
      message: isSuccess ? 
        `Đã thanh toán ${paymentData.amount.toLocaleString()}đ` : 
        'Vui lòng thử lại hoặc chọn phương thức khác',
      data: paymentData,
      timestamp: new Date(),
      style: isSuccess ? 'success' : 'error'
    });
  }

  // Broadcast system announcements
  broadcastSystemAnnouncement(announcement) {
    this.io.emit('system_announcement', {
      type: 'system_announcement',
      title: announcement.title,
      message: announcement.message,
      data: announcement.data,
      timestamp: new Date(),
      level: announcement.level || 'info' // info, warning, error
    });
  }

  // Send targeted promotional notifications
  sendPromoNotification(userIds, promoData) {
    userIds.forEach(userId => {
      this.io.to(userId.toString()).emit('promo_notification', {
        type: 'promotion',
        title: promoData.title,
        message: promoData.message,
        data: {
          promoCode: promoData.code,
          discount: promoData.discount,
          validUntil: promoData.validUntil,
          terms: promoData.terms
        },
        timestamp: new Date(),
        style: 'promotion'
      });
    });
  }

  // Handle worker going online/offline
  notifyWorkerStatusChange(workerId, isOnline, location) {
    // Notify nearby customers about worker availability
    if (isOnline && location) {
      this.io.emit('worker_online', {
        workerId,
        location,
        services: [], // would get from worker profile
        timestamp: new Date()
      });
    }

    // Notify admin dashboard
    this.io.to('admin_room').emit('worker_status_change', {
      workerId,
      isOnline,
      location,
      timestamp: new Date()
    });
  }

  // Emergency notifications
  sendEmergencyNotification(userId, emergencyData) {
    this.io.to(userId.toString()).emit('emergency_notification', {
      type: 'emergency',
      title: 'KHẨN CẤP',
      message: emergencyData.message,
      data: emergencyData,
      timestamp: new Date(),
      priority: 'high',
      requiresAcknowledgment: true
    });

    // Also try to call the user
    this.initiateEmergencyCall(userId, emergencyData);
  }

  // Integration with push notification services
  async sendPushNotification(userId, notificationData) {
    try {
      // Skip Firebase push notifications for now - not configured
      console.log(`[PUSH] Would send push notification to user ${userId}:`, notificationData.title);
      return true;
      
      // TODO: Enable when Firebase is configured
      // const admin = require('firebase-admin');
      
      // Get user's FCM token from database
      // const User = require('../models/User');
      // const user = await User.findById(userId);
      
      if (user && user.fcmToken) {
        const message = {
          token: user.fcmToken,
          notification: {
            title: notificationData.title,
            body: notificationData.body
          },
          data: notificationData.data || {},
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                category: 'NEW_MESSAGE_CATEGORY'
              }
            }
          }
        };

        const response = await admin.messaging().send(message);
        console.log('Push notification sent:', response);
      }
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  // Utility functions
  calculateETA(workerLocation, customerLocation) {
    if (!workerLocation || !customerLocation) return null;
    
    const distance = this.calculateDistance(workerLocation, customerLocation);
    const averageSpeed = 25; // km/h average speed in HCMC
    const etaMinutes = (distance / averageSpeed) * 60;
    
    return new Date(Date.now() + etaMinutes * 60000);
  }

  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return 0;
    
    const [lon1, lat1] = coord1.coordinates || coord1;
    const [lon2, lat2] = coord2.coordinates || coord2;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  initiateEmergencyCall(userId, data) {
    // Integration with Twilio or similar service for emergency calls
    console.log(`Emergency call needed for user ${userId}:`, data);
  }

  // Send notification to specific user
  async sendNotificationToUser(userId, notificationData) {
    try {
      const notification = {
        type: notificationData.type || 'info',
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        timestamp: new Date(),
        priority: notificationData.priority || 'normal'
      };

      // Send real-time notification via socket
      const userRoom = userId.toString();
      const socketsInRoom = await this.io.in(userRoom).fetchSockets();
      console.log(`[SOCKET] Sending to user ${userId} - ${socketsInRoom.length} sockets connected`);
      
      this.io.to(userRoom).emit('notification', notification);

      // Also send push notification
      await this.sendPushNotification(userId, {
        title: notification.title,
        body: notification.message,
        data: notification.data
      });

      // Save to database
      const savedNotification = await this.saveNotificationToDatabase(userId, notification);
      
      // Update delivery status
      if (savedNotification) {
        await savedNotification.markAsDelivered('socket');
      }

      console.log(`[SUCCESS] Notification sent to user ${userId}:`, notification.title);
      return true;
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
      return false;
    }
  }

  // Send bulk notifications to multiple users
  async sendBulkNotifications(userIds, notificationData) {
    try {
      const notification = {
        type: notificationData.type || 'info',
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        timestamp: new Date(),
        priority: notificationData.priority || 'normal'
      };

      const results = {
        total: userIds.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      // Send notifications in batches to avoid overwhelming the system
      const batchSize = 100;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (userId) => {
          try {
            // Send real-time notification via socket
            const userRoom = userId.toString();
            const socketsInRoom = await this.io.in(userRoom).fetchSockets();
            console.log(`[BULK] Sending to user ${userId} - ${socketsInRoom.length} sockets connected`);
            
            this.io.to(userRoom).emit('notification', notification);

            // Send push notification
            await this.sendPushNotification(userId, {
              title: notification.title,
              body: notification.message,
              data: notification.data
            });

            // Save to database
            const savedNotification = await this.saveNotificationToDatabase(userId, notification);
            
            // Update delivery status
            if (savedNotification) {
              await savedNotification.markAsDelivered('socket');
            }

            results.successful++;
            console.log(`[BULK SUCCESS] User ${userId} notified`);
            return { userId, success: true };
          } catch (error) {
            results.failed++;
            results.errors.push({ userId, error: error.message });
            return { userId, success: false, error: error.message };
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to prevent system overload
        if (i + batchSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Bulk notification sent: ${results.successful}/${results.total} successful`);
      return results;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  // Send notification to all users with specific role
  async sendToUsersByRole(role, notificationData) {
    try {
      const User = require('../models/User');
      const users = await User.find({ role }, '_id');
      const userIds = users.map(user => user._id);
      
      return await this.sendBulkNotifications(userIds, notificationData);
    } catch (error) {
      console.error(`Error sending notifications to ${role}s:`, error);
      throw error;
    }
  }

  // Send notification to all customers
  async sendToAllCustomers(notificationData) {
    return await this.sendToUsersByRole('customer', notificationData);
  }

  // Send notification to all workers
  async sendToAllWorkers(notificationData) {
    return await this.sendToUsersByRole('worker', notificationData);
  }

  // Send notification to all users
  async sendToAllUsers(notificationData) {
    try {
      const User = require('../models/User');
      const users = await User.find({}, '_id');
      const userIds = users.map(user => user._id);
      
      return await this.sendBulkNotifications(userIds, notificationData);
    } catch (error) {
      console.error('Error sending notifications to all users:', error);
      throw error;
    }
  }

  // Send targeted notifications based on custom criteria
  async sendTargetedNotifications(query, notificationData) {
    try {
      const User = require('../models/User');
      const users = await User.find(query, '_id');
      const userIds = users.map(user => user._id);
      
      return await this.sendBulkNotifications(userIds, notificationData);
    } catch (error) {
      console.error('Error sending targeted notifications:', error);
      throw error;
    }
  }

  // Save notification to database
  async saveNotificationToDatabase(userId, notification, senderInfo = null) {
    try {
      const Notification = require('../models/Notification');
      
      const dbNotification = new Notification({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        isRead: false,
        sender: senderInfo || {
          role: 'system'
        },
        delivery: {
          attempted: true,
          attemptedAt: new Date()
        }
      });
      
      const saved = await dbNotification.save();
      console.log(`Notification saved to database for user ${userId}, ID: ${saved._id}`);
      return saved;
    } catch (error) {
      console.error('Error saving notification to database:', error);
      return null;
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      // This would query the database for statistics
      return {
        totalSent: 0,
        totalUsers: 0,
        activeConnections: this.io.engine.clientsCount,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return null;
    }
  }
}

module.exports = NotificationService;