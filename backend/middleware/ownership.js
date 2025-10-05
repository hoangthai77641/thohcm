const Booking = require('../models/Booking');
const Service = require('../models/Service');

// Middleware to check booking ownership
const checkBookingOwnership = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Admin can access all bookings
    if (userRole === 'admin') {
      req.booking = booking;
      return next();
    }

    // Customer can only access their own bookings
    if (userRole === 'customer' && booking.customer.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: not your booking' });
    }

    // Worker can only access bookings assigned to them
    if (userRole === 'worker' && booking.worker.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: not assigned to you' });
    }

    req.booking = booking;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware to check service ownership  
const checkServiceOwnership = async (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Admin can access all services
    if (userRole === 'admin') {
      req.service = service;
      return next();
    }

    // Worker can only access their own services
    if (userRole === 'worker' && service.worker.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: not your service' });
    }

    // Customer can view all active services (handled in controller)
    req.service = service;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  checkBookingOwnership,
  checkServiceOwnership
};