const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: Date, required: true },
  preferredTime: { type: Date, required: true }, // Thời gian khách muốn được phục vụ
  address: { type: String, required: true }, // service address
  status: { type: String, enum: ['pending', 'confirmed', 'in_progress', 'done', 'cancelled'], default: 'pending' },
  note: { type: String },
  finalPrice: { type: Number }, // price at booking time after discounts
  // Enhanced pricing transparency
  basePrice: { type: Number }, // original service price
  vipDiscount: { type: Number, default: 0 }, // VIP discount amount applied
  appliedVipStatus: { type: Boolean, default: false }, // was customer VIP when booking created
  // Booking metadata
  estimatedDuration: { type: Number }, // in minutes
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  // Extension fields
  extendedEndTime: { type: Date }, // Thời gian kết thúc sau khi gia hạn
  additionalHours: { type: Number, default: 0 } // Số giờ đã gia hạn thêm
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
