const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.'
  },
});

// Security middleware setup
const setupSecurity = (app, options = {}) => {
  const {
    allowedOrigins = [],
    enableRateLimit,
  } = options;

  const environment = process.env.NODE_ENV || 'development';
  const shouldEnableRateLimit =
    typeof enableRateLimit === 'boolean'
      ? enableRateLimit
      : environment !== 'development';

  // Normalize origins for CSP (strip trailing slashes)
  const normalizedOrigins = allowedOrigins.map((origin) => origin.replace(/\/$/, ''));

  // Helmet for security headers
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding for development
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", ...normalizedOrigins],
        scriptSrc: ["'self'", ...normalizedOrigins],
        imgSrc: ["'self'", "data:", "https:", ...normalizedOrigins],
        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          ...normalizedOrigins,
          ...normalizedOrigins.map((origin) => origin.replace(/^http/, 'ws'))
        ]
      }
    }
  }));

  // Custom MongoDB query sanitization for Express 5 compatibility
  app.use((req, res, next) => {
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const sanitized = Array.isArray(obj) ? [] : {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Remove keys that start with $ or contain dots
          if (key.startsWith('$') || key.includes('.')) {
            console.log(`Sanitized key: ${key} in request to ${req.path}`);
            sanitized[key.replace(/[$\.]/g, '_')] = sanitize(obj[key]);
          } else {
            sanitized[key] = sanitize(obj[key]);
          }
        }
      }
      
      return sanitized;
    };

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      try {
        const sanitizedQuery = sanitize(req.query);
        // Create a new query object instead of modifying the existing one
        Object.defineProperty(req, 'sanitizedQuery', {
          value: sanitizedQuery,
          writable: false,
          enumerable: true
        });
        // Replace the original query for backward compatibility
        req.originalQuery = req.query;
        req.query = sanitizedQuery;
      } catch (error) {
        console.warn('Query sanitization failed:', error.message);
      }
    }

    // Sanitize body parameters
    if (req.body && typeof req.body === 'object') {
      req.body = sanitize(req.body);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitize(req.params);
    }

    next();
  });

  // Apply general rate limiting to all API routes
  if (shouldEnableRateLimit) {
    app.use('/api', apiLimiter);
  } else {
    console.log('[security] API rate limiting disabled for environment:', environment);
  }
};

module.exports = {
  setupSecurity,
  authLimiter,
  uploadLimiter
};