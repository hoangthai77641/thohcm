const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  basePrice: { type: Number, required: false },
  price: { type: Number },
  promoPercent: { type: Number, default: 0 },
  images: [{ type: String }],
  videos: [{ type: String }],
  isActive: { type: Boolean, default: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { 
    type: String, 
    enum: [
      'Điện Lạnh', 
      'Máy Giặt', 
      'Điện Gia Dụng', 
      'Hệ Thống Điện', 
      'Sửa Xe Đạp', 
      'Sửa Xe Máy', 
      'Sửa Xe Oto', 
      'Sửa Xe Điện'
    ], 
    default: 'Điện Lạnh' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
