const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Custom validator for MongoDB ObjectId
const isObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Validation rules for user registration
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Phone must be 10-11 digits'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase, uppercase, and number'),
  
  body('role')
    .optional()
    .isIn(['customer', 'worker'])
    .withMessage('Role must be customer or worker'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  
  handleValidationErrors
];

// Validation rules for user login
const validateUserLogin = [
  body('phone')
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Invalid phone format'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validation rules for booking creation
const validateBookingCreation = [
  body('service')
    .custom(isObjectId)
    .withMessage('Invalid service ID'),
  
  body('worker')
    .custom(isObjectId)
    .withMessage('Invalid worker ID'),
  
  body('date')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error('Booking date must be in the future');
      }
      return true;
    }),
  
  body('address')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10-200 characters'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note must not exceed 500 characters'),
  
  handleValidationErrors
];

// Validation rules for booking status update
const validateBookingStatusUpdate = [
  param('id')
    .custom(isObjectId)
    .withMessage('Invalid booking ID'),
  
  body('status')
    .isIn(['pending', 'confirmed', 'done', 'cancelled'])
    .withMessage('Invalid status'),
  
  handleValidationErrors
];

// Validation rules for ObjectId params
const validateObjectIdParam = (paramName = 'id') => [
  param(paramName)
    .custom(isObjectId)
    .withMessage(`Invalid ${paramName}`),
  
  handleValidationErrors
];

// Validation rules for pagination queries
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateBookingCreation,
  validateBookingStatusUpdate,
  validateObjectIdParam,
  validatePagination,
  handleValidationErrors
};