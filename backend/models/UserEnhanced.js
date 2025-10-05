const mongoose = require('mongoose');

// Enhanced User schema with location and service area
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'worker', 'admin'], default: 'customer' },
  
  // Existing fields
  address: { type: String },
  usageCount: { type: Number, default: 0 },
  loyaltyLevel: { type: String, enum: ['normal', 'vip'], default: 'normal' },
  resetOTP: { type: String },
  resetOTPExpires: { type: Date },
  status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'active' },
  
  // NEW: Location and service area for Lalamove-style matching
  location: {
    coordinates: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    district: { type: String }, // Quận 1, Quận 2, etc.
    ward: { type: String }, // Phường
    fullAddress: { type: String },
    landmarks: [String] // Nearby landmarks
  },
  
  // For workers only
  serviceArea: {
    maxRadius: { type: Number, default: 10 }, // km
    districts: [String], // Districts they serve
    isActive: { type: Boolean, default: true }
  },
  
  // Worker specializations
  specializations: [{
    type: String,
    enum: ['air_conditioning', 'refrigerator', 'washing_machine', 'water_heater', 'electrical', 'all']
  }],
  
  // Worker performance metrics
  performance: {
    totalJobs: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // minutes
    certifications: [String], // ['samsung_certified', 'daikin_authorized']
    isOnline: { type: Boolean, default: false },
    lastOnline: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Index for geospatial queries
userSchema.index({ "location.coordinates": "2dsphere" });
userSchema.index({ "serviceArea.districts": 1 });
userSchema.index({ role: 1, "performance.isOnline": 1 });

// Methods for worker matching
userSchema.methods.isAvailable = function() {
  return this.role === 'worker' && 
         this.status === 'active' && 
         this.performance.isOnline &&
         this.serviceArea.isActive;
};

userSchema.methods.canServeLocation = function(district, coordinates) {
  if (!this.serviceArea.isActive) return false;
  
  // Check if district is in service area
  if (this.serviceArea.districts.includes(district)) return true;
  
  // Check if within radius (if coordinates provided)
  if (coordinates && this.location.coordinates) {
    const distance = this.calculateDistance(coordinates);
    return distance <= this.serviceArea.maxRadius;
  }
  
  return false;
};

userSchema.methods.calculateDistance = function(targetCoordinates) {
  if (!this.location.coordinates || !targetCoordinates) return Infinity;
  
  const [lon1, lat1] = this.location.coordinates;
  const [lon2, lat2] = targetCoordinates;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = mongoose.model('UserEnhanced', userSchema);