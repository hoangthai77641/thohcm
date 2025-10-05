const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/reviewController')
const auth = require('../middleware/auth')

// get reviews for current worker's services (worker only)
router.get('/my-services', auth('worker'), reviewController.getMyServiceReviews)
// create review for a service (customer only)
router.post('/:serviceId', auth('customer'), reviewController.createReview)
// get reviews for a service (public)
router.get('/service/:serviceId', reviewController.getReviewsForService)
// get review statistics for a service (public)
router.get('/service/:serviceId/stats', reviewController.getReviewStats)

module.exports = router
