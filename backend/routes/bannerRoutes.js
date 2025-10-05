const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const auth = require('../middleware/auth');
const { uploadBanner } = require('../middleware/upload');
const { validateObjectIdParam } = require('../middleware/validation');

// Public routes (cho mobile app)
router.get('/active', bannerController.getActiveBanners);
router.post('/:id/view', validateObjectIdParam('id'), bannerController.incrementViewCount);
router.post('/:id/click', validateObjectIdParam('id'), bannerController.incrementClickCount);

// Admin routes
router.get('/', auth(['admin']), bannerController.getAllBanners);
router.post('/', auth(['admin']), uploadBanner, bannerController.createBanner);
router.put('/:id', auth(['admin']), validateObjectIdParam('id'), uploadBanner, bannerController.updateBanner);
router.patch('/:id/toggle', auth(['admin']), validateObjectIdParam('id'), bannerController.toggleBannerStatus);
router.delete('/:id', auth(['admin']), validateObjectIdParam('id'), bannerController.deleteBanner);

module.exports = router;