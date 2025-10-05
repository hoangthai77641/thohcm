const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['blog', 'advertisement', 'notification', 'promotion'], 
    default: 'advertisement' 
  },
  targetUrl: { type: String }, // Link đến khi click
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }, // Thứ tự hiển thị
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }, // Có thể null nếu không có ngày kết thúc
  clickCount: { type: Number, default: 0 }, // Đếm số lần click
  viewCount: { type: Number, default: 0 }, // Đếm số lần xem
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index cho performance
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.index({ type: 1, isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Banner', bannerSchema);