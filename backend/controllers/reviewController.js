const Review = require('../models/Review')
const mongoose = require('mongoose')

exports.createReview = async (req, res) => {
  try {
    const { serviceId } = req.params
    const { rating, comment } = req.body
    const customerId = req.user && req.user.id
    console.log('Creating review:', { serviceId, rating, comment, customerId })
    if (!customerId) return res.status(401).json({ message: 'Login required' })
    // ensure customer has at least one booking for this service if you want (optional)
    const review = new Review({ service: serviceId, customer: customerId, rating, comment })
    await review.save()
    console.log('Review created:', review)
    res.status(201).json(review)
  } catch (err) {
    console.error('Error creating review:', err)
    res.status(400).json({ error: err.message })
  }
}

exports.getReviewsForService = async (req, res) => {
  try {
    const { serviceId } = req.params
    console.log('Getting reviews for serviceId:', serviceId)
    const reviews = await Review.find({ service: serviceId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 }) // Sort by newest first
    console.log('Found reviews:', reviews.length)
    res.json(reviews)
  } catch (err) {
    console.error('Error getting reviews:', err)
    res.status(500).json({ error: err.message })
  }
}

// Get review statistics for a service
exports.getReviewStats = async (req, res) => {
  try {
    const { serviceId } = req.params
    const stats = await Review.aggregate([
      { $match: { service: mongoose.Types.ObjectId(serviceId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ])
    
    if (stats.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      })
    }
    
    const result = stats[0]
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    result.ratingDistribution.forEach(rating => {
      distribution[rating] = (distribution[rating] || 0) + 1
    })
    
    res.json({
      averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: result.totalReviews,
      ratingDistribution: distribution
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get reviews for current worker's services
exports.getMyServiceReviews = async (req, res) => {
  try {
    const workerId = req.user && req.user.id
    if (!workerId) return res.status(401).json({ message: 'Login required' })
    
    // First, get all services of this worker
    const Service = require('../models/Service')
    const services = await Service.find({ worker: workerId }).select('_id')
    const serviceIds = services.map(s => s._id)
    
    if (serviceIds.length === 0) {
      return res.json([])
    }
    
    // Then get all reviews for these services
    const reviews = await Review.find({ service: { $in: serviceIds } })
      .populate('customer', 'name email')
      .populate('service', 'name description')
      .sort({ createdAt: -1 })
    
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
