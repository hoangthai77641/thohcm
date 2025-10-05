const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'info',           // Thông tin chung
      'success',        // Thành công
      'warning',        // Cảnh báo
      'error',          // Lỗi
      'promotion',      // Khuyến mãi
      'booking',        // Đặt lịch
      'payment',        // Thanh toán
      'system',         // Hệ thống
      'emergency',      // Khẩn cấp
      'worker_assigned', // Có thợ nhận việc
      'job_assignment', // Phân công việc
      'status_change'   // Thay đổi trạng thái
    ],
    default: 'info'
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  message: {
    type: String,
    required: true,
    maxLength: 1000
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // TTL index - notifications will be automatically deleted
  },
  // Metadata for tracking
  sender: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['system', 'admin', 'user']
    },
    ip: String
  },
  // Delivery tracking
  delivery: {
    attempted: {
      type: Boolean,
      default: false
    },
    attemptedAt: Date,
    successful: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    pushSent: {
      type: Boolean,
      default: false
    },
    pushSentAt: Date,
    socketSent: {
      type: Boolean,
      default: false
    },
    socketSentAt: Date
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Methods
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

notificationSchema.methods.markAsDelivered = async function(deliveryMethod = 'socket') {
  this.delivery.successful = true;
  this.delivery.deliveredAt = new Date();
  
  if (deliveryMethod === 'socket') {
    this.delivery.socketSent = true;
    this.delivery.socketSentAt = new Date();
  } else if (deliveryMethod === 'push') {
    this.delivery.pushSent = true;
    this.delivery.pushSentAt = new Date();
  }
  
  return await this.save();
};

// Statics
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null,
    priority = null
  } = options;

  const query = { userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (priority) {
    query.priority = priority;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender.userId', 'name email role');
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date() 
      } 
    }
  );
};

notificationSchema.statics.deleteOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Auto-expire notifications after 90 days
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90); // 90 days from now
    this.expiresAt = expiryDate;
  }
  next();
});

// Middleware to update delivery status
notificationSchema.pre('save', function(next) {
  if (!this.delivery.attempted) {
    this.delivery.attempted = true;
    this.delivery.attemptedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);