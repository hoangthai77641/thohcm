const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notificationController')
const auth = require('../middleware/auth')
const optionalAuth = require('../middleware/optionalAuth')

// ===== ADMIN NOTIFICATION SENDING ROUTES =====

// Send notification to specific user (admin only)
router.post('/send/user', optionalAuth, notificationController.sendToUser)

// Send notification to all customers (admin only)
router.post('/send/customers', optionalAuth, notificationController.sendToAllCustomers)

// Send notification to all workers (admin only) 
router.post('/send/workers', optionalAuth, notificationController.sendToAllWorkers)

// Send notification to all users (admin only)
router.post('/send/all-users', optionalAuth, notificationController.sendToAllUsers)

// Send custom notification with advanced targeting (admin only)
router.post('/send/custom', optionalAuth, notificationController.sendCustomNotification)

// Legacy endpoint for backward compatibility
router.post('/send', optionalAuth, notificationController.sendNotification)

// ===== USER NOTIFICATION MANAGEMENT ROUTES =====

// Get user notifications - current user
router.get('/user', auth(), notificationController.getUserNotifications)

// Get user notifications - specific user
router.get('/user/:userId', optionalAuth, notificationController.getUserNotifications)

// Mark notification as read
router.put('/:notificationId/read', auth(), notificationController.markAsRead)

// Mark all notifications as read - current user
router.put('/user/read-all', auth(), notificationController.markAllAsRead)

// Mark all notifications as read - specific user
router.put('/user/:userId/read-all', optionalAuth, notificationController.markAllAsRead)

// Delete notification
router.delete('/:notificationId', auth(), notificationController.deleteNotification)

module.exports = router