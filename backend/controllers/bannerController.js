const Banner = require('../models/Banner');
const fs = require('fs');
const path = require('path');

// Lấy danh sách banner active (cho mobile app)
exports.getActiveBanners = async (req, res) => {
  try {
    const { type } = req.query;
    const now = new Date();
    
    const filter = {
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    };
    
    if (type) {
      filter.type = type;
    }
    
    const banners = await Banner.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate('createdBy', 'name')
      .select('-clickCount -viewCount'); // Không trả về metrics cho client
    
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Lấy tất cả banner
exports.getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isActive } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    
    const [items, total] = await Promise.all([
      Banner.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip((pageNum - 1) * lim)
        .limit(lim)
        .populate('createdBy', 'name'),
      Banner.countDocuments(filter)
    ]);
    
    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / lim)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Tạo banner mới
exports.createBanner = async (req, res) => {
  try {
    const { title, content, description, type, targetUrl, order, startDate, endDate } = req.body;
    
    console.log('Create banner request:', req.body); // Debug log
    console.log('Uploaded file:', req.file); // Debug log
    
    if (!req.file) {
      return res.status(400).json({ message: 'Banner image is required' });
    }
    
    const imageUrl = `/uploads/banners/${req.file.filename}`;
    
    const banner = new Banner({
      title,
      description: content || description, // Use content from frontend
      imageUrl,
      type,
      targetUrl,
      order: parseInt(order) || 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user.id
    });
    
    await banner.save();
    await banner.populate('createdBy', 'name');
    
    res.status(201).json(banner);
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(400).json({ error: error.message });
  }
};

// Admin: Cập nhật banner
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, description, type, targetUrl, isActive, order, startDate, endDate } = req.body;
    
    console.log('Update banner request:', req.body); // Debug log
    console.log('Uploaded file:', req.file); // Debug log
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    // Update fields
    if (title !== undefined) banner.title = title;
    if (content !== undefined || description !== undefined) {
      banner.description = content || description; // Use content from frontend
    }
    if (type !== undefined) banner.type = type;
    if (targetUrl !== undefined) banner.targetUrl = targetUrl;
    if (isActive !== undefined) banner.isActive = isActive;
    if (order !== undefined) banner.order = parseInt(order);
    if (startDate !== undefined) banner.startDate = new Date(startDate);
    if (endDate !== undefined) banner.endDate = endDate ? new Date(endDate) : null;
    
    // Update image if provided
    if (req.file) {
      // Delete old image
      if (banner.imageUrl) {
        const oldImagePath = path.join(__dirname, '../uploads/banners', path.basename(banner.imageUrl));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      banner.imageUrl = `/uploads/banners/${req.file.filename}`;
    }
    
    await banner.save();
    await banner.populate('createdBy', 'name');
    
    res.json(banner);
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(400).json({ error: error.message });
  }
};

// Admin: Xóa banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    // Delete image file
    if (banner.imageUrl) {
      const imagePath = path.join(__dirname, '../uploads/banners', path.basename(banner.imageUrl));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Banner.findByIdAndDelete(id);
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Tăng view count khi banner được hiển thị
exports.incrementViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Banner.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    res.json({ message: 'View count incremented' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Tăng click count khi banner được click
exports.incrementClickCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByIdAndUpdate(
      id, 
      { $inc: { clickCount: 1 } },
      { new: true }
    );
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json({ 
      message: 'Click count incremented',
      targetUrl: banner.targetUrl 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Toggle banner status
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    banner.isActive = !banner.isActive;
    await banner.save();
    
    res.json({ 
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: banner.isActive 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};