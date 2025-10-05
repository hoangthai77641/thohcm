const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { uploadServiceMedia } = require('../middleware/upload');

// Create service (worker or admin)
router.post('/', auth(['worker','admin']), uploadServiceMedia, serviceController.createService);
// Get categories
router.get('/categories', serviceController.getCategories);
// Public / customer / worker: list (with optional auth to compute effectivePrice)
router.get('/', optionalAuth, serviceController.getServices);
// Find service by type (for booking)
router.get('/type/:type', optionalAuth, serviceController.findServiceByType);
// Detail
router.get('/:id', optionalAuth, serviceController.getService);
// Update & delete (worker or admin)
router.put('/:id', auth(['worker','admin']), uploadServiceMedia, serviceController.updateService);
router.delete('/:id', auth(['worker','admin']), serviceController.deleteService);

module.exports = router;
