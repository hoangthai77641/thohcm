const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const { checkBookingOwnership } = require('../middleware/ownership');
const { 
  validateBookingCreation, 
  validateBookingStatusUpdate,
  validateObjectIdParam,
  validatePagination
} = require('../middleware/validation');

// Create booking (customers only) with validation
router.post('/', auth('customer'), bookingController.createBooking);
// Customer: get own bookings
router.get('/my', auth('customer'), bookingController.getMyBookings);
// Customer: get personal stats
router.get('/my/stats', auth('customer'), bookingController.getMyStats);
// Get available workers for a service and time (public for customers)
router.get('/available-workers', bookingController.getAvailableWorkers);
// Get bookings (worker or admin). Admin sẽ xem tất cả, worker xem của mình
router.get('/', auth(['worker','admin']), bookingController.getBookings);

// Stats for worker dashboard
router.get('/stats/worker', auth(['worker','admin']), bookingController.getWorkerStats);

// Get worker's busy times (public endpoint for customers)
router.get('/worker/:workerId/busy-times', bookingController.getWorkerBusyTimes);

// Update booking status (worker hoặc admin) with ownership check
router.patch('/:id/status', 
  auth(['worker','admin']), 
  validateBookingStatusUpdate, 
  checkBookingOwnership, 
  bookingController.updateBookingStatus
);

// Cancel booking (customer only - for their own bookings) with ownership check
router.patch('/:id/cancel', 
  auth('customer'), 
  validateObjectIdParam('id'), 
  checkBookingOwnership, 
  bookingController.cancelBooking
);

module.exports = router;
