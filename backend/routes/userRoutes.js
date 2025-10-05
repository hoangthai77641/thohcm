const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { uploadAvatar } = require('../middleware/upload');
const { 
  validateUserRegistration, 
  validateUserLogin,
  validateObjectIdParam,
  validatePagination
} = require('../middleware/validation');

// Đăng ký, đăng nhập with rate limiting and validation
router.post('/register', authLimiter, validateUserRegistration, userController.register);
router.post('/login', authLimiter, validateUserLogin, userController.login);
router.post('/request-otp', userController.requestOTP);
router.post('/verify-otp', userController.verifyOTP);

// profile
router.get('/me', auth(['customer','worker','admin']), userController.me);
router.put('/me', auth(['customer','worker','admin']), userController.updateMe);

// avatar
router.post('/avatar', auth(['customer','worker','admin']), (req, res, next) => {
  console.log('Avatar upload request received');
  console.log('User:', req.user);
  console.log('Headers:', req.headers);
  
  uploadAvatar(req, res, (err) => {
    if (err) {
      console.error('Upload middleware error:', err.message);
      return res.status(400).json({ message: err.message });
    }
    console.log('Upload middleware success, file:', req.file);
    next();
  });
}, userController.uploadAvatar);
router.delete('/avatar', auth(['customer','worker','admin']), userController.deleteAvatar);

// customers (worker or admin)
router.get('/customers', auth(['worker','admin']), userController.getCustomers);
router.get('/customers/:id/bookings', auth(['worker','admin']), userController.getCustomerBookings);

// (Theo yêu cầu: không cho tạo user thủ công) -> vô hiệu hóa route create
// router.post('/', auth(['worker','admin']), userController.createUser);
// Lấy danh sách user (worker hoặc admin)
router.get('/', auth(['worker','admin']), validatePagination, userController.getUsers);
router.put('/:id/status', auth(['admin']), validateObjectIdParam('id'), userController.updateUserStatus);
router.put('/:id/role', auth(['admin']), validateObjectIdParam('id'), userController.updateUserRole);
router.post('/workers', auth(['admin']), userController.adminCreateWorker);
router.put('/workers/:id', auth(['admin']), validateObjectIdParam('id'), userController.adminUpdateWorker);
router.delete('/workers/:id', auth(['admin']), validateObjectIdParam('id'), userController.adminDeleteWorker);

// Admin: manage worker approvals
router.get('/workers/pending', auth(['admin']), async (req, res) => {
	try {
		const User = require('../models/User');
		const users = await User.find({ role: 'worker', status: 'pending' }).select('name phone address createdAt');
		res.json(users);
	} catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/workers/:id/approve', auth(['admin']), async (req, res) => {
	try {
		const User = require('../models/User');
		const user = await User.findById(req.params.id);
		if (!user || user.role !== 'worker') return res.status(404).json({ message: 'Worker not found' });
		user.status = 'active';
		await user.save();
		res.json({ message: 'Approved' });
	} catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/workers/:id/suspend', auth(['admin']), async (req, res) => {
	try {
		const User = require('../models/User');
		const user = await User.findById(req.params.id);
		if (!user || user.role !== 'worker') return res.status(404).json({ message: 'Worker not found' });
		user.status = 'suspended';
		await user.save();
		res.json({ message: 'Suspended' });
	} catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
