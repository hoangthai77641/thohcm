const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const WorkerSchedule = require('../models/WorkerSchedule');
const Review = require('../models/Review');
const fs = require('fs');
const path = require('path');

// Đăng ký
exports.register = async (req, res) => {
  try {
    let { name, phone, password, role, address } = req.body;
    // basic validation
    name = (name || '').toString().trim();
    phone = (phone || '').toString().trim();
    password = (password || '').toString();
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!phone) return res.status(400).json({ message: 'Phone is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Phone already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    // prevent arbitrary elevation; block admin self-register
    let userRole = 'customer';
    if (role === 'worker') {
      userRole = 'worker';
    } else if (role === 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    // default status: workers start as pending, others active
    const status = userRole === 'worker' ? 'pending' : 'active';
    const user = new User({ name, phone, password: hashedPassword, role: userRole, address, status });
    await user.save();
    res.status(201).json({ message: 'Register success' });
  } catch (err) {
    // handle duplicate key
    if (err && err.code === 11000 && err.keyPattern && err.keyPattern.phone) {
      return res.status(400).json({ message: 'Phone already exists' });
    }
    res.status(400).json({ message: err.message || 'Registration failed' });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'User not found' });
    // block login if not active
    if (user.status && user.status !== 'active') {
      return res.status(403).json({
        message: 'Tài khoản thợ chưa được kích hoạt',
        code: 'WORKER_PENDING',
        instructions: 'Xin Chào Đối tác mới của Thợ HCM, Đối tác vui lòng đến văn phòng Thợ HCM tại địa chỉ: 456 Phan Văn Trị, P. An Nhơn, TP HCM vào khung giờ 8:00 - 11:00 Sáng và 13:00 - 16:00 Chiều để kích hoạt tài khoản Thợ của đối tác, vui lòng mang theo CCCD để xác minh, cập nhật thông tin, ảnh đại diện trên ứng dụng và nhận nón bảo hiểm miễn phí',
        status: user.status,
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong password' });
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );

  const sanitized = user.toObject({ versionKey: false });
    delete sanitized.password;
    delete sanitized.resetOTP;
    sanitized.id = sanitized._id;

    res.json({ token, user: sanitized });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { q, role, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
      ];
    }
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * lim).limit(lim),
      User.countDocuments(filter),
    ]);
    res.json({ items, total, page: pageNum, pages: Math.ceil(total / lim) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'active', 'suspended'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = status;
    await user.save();
    res.json({ message: 'Updated', user: await User.findById(id).select('-password -resetOTP') });
  } catch (e) { res.status(400).json({ error: e.message }); }
};

// Admin: update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowed = ['customer', 'worker', 'admin'];
    if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = role;
    await user.save();
    res.json({ message: 'Updated', user: await User.findById(id).select('-password -resetOTP') });
  } catch (e) { res.status(400).json({ error: e.message }); }
};

exports.adminCreateWorker = async (req, res) => {
  try {
    const { name, phone, password, address, citizenId, status } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!phone || !phone.trim()) return res.status(400).json({ message: 'Phone is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) return res.status(400).json({ message: 'Phone already exists' });

    const worker = new User({
      name: name.trim(),
      phone: phone.trim(),
      password: await bcrypt.hash(password, 10),
      role: 'worker',
      address,
      citizenId,
      status: ['pending', 'active', 'suspended'].includes(status) ? status : 'pending',
    });

    await worker.save();
    const sanitized = worker.toObject({ versionKey: false });
    delete sanitized.password;
    delete sanitized.resetOTP;
    res.status(201).json(sanitized);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.adminUpdateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await User.findById(id);
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const { name, phone, address, citizenId, status, password } = req.body;

    if (name !== undefined) worker.name = name;
    if (address !== undefined) worker.address = address;
    if (citizenId !== undefined) worker.citizenId = citizenId;

    if (phone !== undefined && phone !== worker.phone) {
      const exists = await User.findOne({ phone, _id: { $ne: worker._id } });
      if (exists) return res.status(400).json({ message: 'Phone already in use' });
      worker.phone = phone;
    }

    if (status && ['pending', 'active', 'suspended'].includes(status)) {
      worker.status = status;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      worker.password = await bcrypt.hash(password, 10);
    }

    await worker.save();
    const sanitized = await User.findById(worker._id).select('-password -resetOTP');
    res.json(sanitized);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.adminDeleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await User.findById(id);
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Get all services of this worker first (for deleting reviews)
    const workerServices = await Service.find({ worker: id });
    const serviceIds = workerServices.map(service => service._id);

    // Delete all reviews for this worker's services
    const deletedReviews = await Review.deleteMany({ service: { $in: serviceIds } });
    console.log(`Deleted ${deletedReviews.deletedCount} reviews for worker ${worker.name}`);

    // Delete all services associated with this worker
    const deletedServices = await Service.deleteMany({ worker: id });
    console.log(`Deleted ${deletedServices.deletedCount} services for worker ${worker.name}`);

    // Delete all bookings associated with this worker
    const deletedBookings = await Booking.deleteMany({ worker: id });
    console.log(`Deleted ${deletedBookings.deletedCount} bookings for worker ${worker.name}`);

    // Delete all schedules associated with this worker
    const deletedSchedules = await WorkerSchedule.deleteMany({ worker: id });
    console.log(`Deleted ${deletedSchedules.deletedCount} schedules for worker ${worker.name}`);

    // Delete worker's avatar file if exists
    if (worker.avatar) {
      const avatarPath = path.join(__dirname, '..', worker.avatar);
      try {
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
          console.log(`Deleted avatar file: ${avatarPath}`);
        }
      } catch (fileErr) {
        console.error('Error deleting avatar file:', fileErr);
      }
    }

    // Finally delete the worker
    await worker.deleteOne();
    
    res.json({ 
      message: 'Worker deleted successfully',
      deletedReviews: deletedReviews.deletedCount,
      deletedServices: deletedServices.deletedCount,
      deletedBookings: deletedBookings.deletedCount,
      deletedSchedules: deletedSchedules.deletedCount
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// profile
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetOTP');
    
    // If customer, add statistics
    if (user.role === 'customer') {
      const bookings = await Booking.find({ customer: user._id }).populate('service');
      
      // Basic stats
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'done').length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      
      // Calculate total spent
      const totalSpent = bookings
        .filter(b => b.status === 'done' && b.finalPrice)
        .reduce((sum, b) => sum + b.finalPrice, 0);
      
      // Service usage statistics
      const serviceStats = {};
      bookings.forEach(booking => {
        if (booking.service) {
          const serviceName = booking.service.name;
          if (!serviceStats[serviceName]) {
            serviceStats[serviceName] = { count: 0, totalSpent: 0 };
          }
          serviceStats[serviceName].count++;
          if (booking.status === 'done' && booking.finalPrice) {
            serviceStats[serviceName].totalSpent += booking.finalPrice;
          }
        }
      });
      
      // Calculate loyalty level based on service usage count (VIP from 3+ bookings)
      let loyaltyLevel = 'normal';
      if (totalBookings >= 3) {
        loyaltyLevel = 'vip';
      }
      
      // Recent bookings (last 5)
      const recentBookings = bookings
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      user._doc.stats = {
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        totalSpent,
        loyaltyLevel,
        serviceStats,
        recentBookings
      };
    }
    
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// update profile (self)
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { name, address, phone, currentPassword, newPassword, citizenId } = req.body;
    const actorRole = req.user.role;

    if (actorRole === 'worker') {
      if (name !== undefined && name !== user.name) {
        return res.status(403).json({ message: 'Thợ không thể tự cập nhật họ tên. Vui lòng liên hệ quản trị viên.' });
      }
      if (newPassword) {
        return res.status(403).json({ message: 'Thợ không thể tự đổi mật khẩu. Vui lòng liên hệ quản trị viên.' });
      }
      if (citizenId !== undefined && citizenId !== user.citizenId) {
        return res.status(403).json({ message: 'CCCD được quản lý bởi quản trị viên.' });
      }
    } else {
      if (name !== undefined) user.name = name;
      if (citizenId !== undefined) user.citizenId = citizenId;
    }

    if (address !== undefined) user.address = address;
    // phone change requires currentPassword (unless admin), ensure uniqueness
    if (phone !== undefined && phone !== user.phone) {
      if (req.user.role !== 'admin') {
        const ok = await bcrypt.compare(currentPassword || '', user.password);
        if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
      }
      const exists = await User.findOne({ phone, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ message: 'Phone already in use' });
      user.phone = phone;
    }
    // password change
    if (newPassword && actorRole !== 'worker') {
      if (req.user.role !== 'admin') {
        const ok = await bcrypt.compare(currentPassword || '', user.password);
        if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }
    await user.save();
    const sanitized = await User.findById(user._id).select('-password -resetOTP');
    res.json(sanitized);
  } catch (e) { res.status(400).json({ error: e.message }); }
};

// customers list (worker)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('name phone address usageCount loyaltyLevel createdAt');
    res.json(customers);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// bookings history for a customer (worker)
exports.getCustomerBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({ customer: id }).populate('service customer');
    res.json(bookings);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// request OTP for password reset (mock send)
exports.requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = String(Math.floor(100000 + Math.random()*900000));
    user.resetOTP = await bcrypt.hash(code, 5); // store hashed
    user.resetOTPExpires = new Date(Date.now() + 10*60*1000); // 10 minutes
    await user.save();
    console.log('OTP for', phone, 'is', code); // mock delivery
    res.json({ message: 'OTP generated (mock sent)' });
  } catch (e) { res.status(400).json({ error: e.message }); }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    const user = await User.findOne({ phone });
    if (!user || !user.resetOTP || !user.resetOTPExpires) return res.status(400).json({ message: 'OTP not requested' });
    if (user.resetOTPExpires < new Date()) return res.status(400).json({ message: 'OTP expired' });
    const match = await bcrypt.compare(otp, user.resetOTP);
    if (!match) return res.status(400).json({ message: 'Invalid OTP' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset success' });
  } catch (e) { res.status(400).json({ error: e.message }); }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    console.log('uploadAvatar controller called');
    console.log('req.file:', req.file);
    console.log('req.user:', req.user);
    
    if (!req.file) {
      console.log('No file provided');
      return res.status(400).json({ message: 'No avatar file provided' });
    }

    const targetUserId = (req.user.role === 'admin' && (req.body?.userId || req.query.userId))
      ? (req.body.userId || req.query.userId)
      : req.user.id;

    if (req.user.role === 'worker' && targetUserId === req.user.id) {
      return res.status(403).json({ message: 'Ảnh đại diện của thợ sẽ do quản trị viên cập nhật.' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'worker' && !user._id.equals(req.user.id)) {
      return res.status(403).json({ message: 'Không thể cập nhật avatar cho tài khoản khác.' });
    }

    // Delete old avatar file if exists
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Save new avatar path
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password -resetOTP');
    res.json({ 
      message: 'Avatar uploaded successfully', 
      user: updatedUser 
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/avatars', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete avatar
exports.deleteAvatar = async (req, res) => {
  try {
    const targetUserId = (req.user.role === 'admin' && (req.body?.userId || req.query.userId))
      ? (req.body.userId || req.query.userId)
      : req.user.id;

    if (req.user.role === 'worker' && targetUserId === req.user.id) {
      return res.status(403).json({ message: 'Ảnh đại diện của thợ sẽ do quản trị viên cập nhật.' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.avatar) {
      return res.status(400).json({ message: 'No avatar to delete' });
    }

    // Delete avatar file
    const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    // Remove avatar from user record
    user.avatar = undefined;
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password -resetOTP');
    res.json({ 
      message: 'Avatar deleted successfully', 
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
