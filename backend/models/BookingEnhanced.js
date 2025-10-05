const mongoose = require('mongoose');

// Enhanced Booking schema for Lalamove-style operations
const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  
  // Existing fields
  date: { type: Date, required: true },
  address: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  note: { type: String },
  
  // Enhanced location data
  location: {
    coordinates: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    district: { type: String, required: true },
    ward: { type: String },
    fullAddress: { type: String, required: true },
    landmarks: [String],
    accessInstructions: { type: String } // How to access the location
  },
  
  // Pricing details
  pricing: {
    basePrice: { type: Number, required: true },
    distanceFee: { type: Number, default: 0 },
    urgencyFee: { type: Number, default: 0 }, // Same-day booking
    serviceFee: { type: Number, default: 0 }, // Platform fee
    vipDiscount: { type: Number, default: 0 },
    promoDiscount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true }
  },
  
  // Service details
  serviceDetails: {
    type: { 
      type: String, 
      enum: ['air_conditioning', 'refrigerator', 'washing_machine', 'water_heater', 'electrical', 'other'],
      required: true 
    },
    brand: { type: String },
    model: { type: String },
    issueDescription: { type: String, required: true },
    photos: [String], // Before photos
    urgency: { type: String, enum: ['normal', 'urgent', 'emergency'], default: 'normal' }
  },
  
  // Tracking and timing
  timeline: {
    createdAt: { type: Date, default: Date.now },
    assignedAt: { type: Date },
    confirmedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    estimatedDuration: { type: Number }, // minutes
    actualDuration: { type: Number } // minutes
  },
  
  // Worker assignment details
  assignment: {
    autoAssigned: { type: Boolean, default: false },
    assignmentScore: { type: Number }, // Algorithm score for this assignment
    alternativeWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reassignmentCount: { type: Number, default: 0 }
  },
  
  // Live tracking
  tracking: {
    workerLocation: {
      coordinates: { type: [Number] },
      lastUpdated: { type: Date }
    },
    estimatedArrival: { type: Date },
    route: [{ 
      coordinates: [Number],
      timestamp: { type: Date, default: Date.now }
    }]
  },
  
  // Communication
  communication: {
    customerNotified: { type: Boolean, default: false },
    workerNotified: { type: Boolean, default: false },
    lastCustomerMessage: { type: Date },
    lastWorkerMessage: { type: Date }
  },
  
  // Completion details
  completion: {
    workPerformed: { type: String },
    partsUsed: [{
      name: { type: String },
      price: { type: Number },
      warranty: { type: String }
    }],
    beforePhotos: [String],
    afterPhotos: [String],
    customerSignature: { type: String }, // Base64 image
    warranty: {
      duration: { type: Number }, // months
      terms: { type: String }
    }
  },
  
  // Payment
  payment: {
    method: { 
      type: String, 
      enum: ['cash', 'vnpay', 'momo', 'zalopay', 'banking'], 
      default: 'cash' 
    },
    transactionId: { type: String },
    paidAt: { type: Date },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String }
  }
}, { timestamps: true });

// Indexes for efficient queries
bookingSchema.index({ "location.coordinates": "2dsphere" });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ worker: 1, createdAt: -1 });
bookingSchema.index({ status: 1, "timeline.createdAt": -1 });
bookingSchema.index({ "serviceDetails.type": 1 });
bookingSchema.index({ "location.district": 1 });

// Virtual for total price calculation
bookingSchema.virtual('totalAmount').get(function() {
  return this.pricing.finalPrice + (this.completion.partsUsed || []).reduce((sum, part) => sum + part.price, 0);
});

// Methods
bookingSchema.methods.assignWorker = function(workerId, score = 0) {
  this.worker = workerId;
  this.assignment.autoAssigned = true;
  this.assignment.assignmentScore = score;
  this.timeline.assignedAt = new Date();
  this.status = 'assigned';
  return this.save();
};

bookingSchema.methods.updateWorkerLocation = function(coordinates) {
  this.tracking.workerLocation = {
    coordinates: coordinates,
    lastUpdated: new Date()
  };
  return this.save();
};

bookingSchema.methods.calculateETA = function(workerLocation, averageSpeed = 25) {
  if (!workerLocation || !this.location.coordinates) return null;
  
  const distance = this.calculateDistance(workerLocation, this.location.coordinates);
  const etaMinutes = (distance / averageSpeed) * 60; // Convert hours to minutes
  
  this.tracking.estimatedArrival = new Date(Date.now() + etaMinutes * 60000);
  return this.tracking.estimatedArrival;
};

bookingSchema.methods.calculateDistance = function(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = mongoose.model('BookingEnhanced', bookingSchema);