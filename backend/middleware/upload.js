const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const servicesDir = path.join(uploadsDir, 'services');
const bannersDir = path.join(uploadsDir, 'banners');
const avatarsDir = path.join(uploadsDir, 'avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure storage for services
const serviceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, servicesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Allowed MIME types
const allowedImageTypes = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

const allowedVideoTypes = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm'
];

// File filter for services with strict MIME type checking
const serviceFileFilter = (req, file, cb) => {
  // Check file extension matches MIME type (prevent MIME type spoofing)
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'images') {
    if (allowedImageTypes.includes(file.mimetype) && 
        ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  } else if (file.fieldname === 'videos') {
    if (allowedVideoTypes.includes(file.mimetype) && 
        ['.mp4', '.mpeg', '.mov', '.webm'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, MPEG, MOV, and WebM videos are allowed'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Configure multer for services with security limits
const serviceUpload = multer({
  storage: serviceStorage,
  fileFilter: serviceFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (reduced from 50MB)
    files: 8, // Maximum 8 files total (reduced from 10)
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // 100 bytes field name limit
    fields: 10 // Maximum 10 fields
  }
});

// Configure storage for banners
const bannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bannersDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter for banners (only images)
const bannerFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'image') {
    if (allowedImageTypes.includes(file.mimetype) && 
        ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed for banners'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Configure multer for banners
const bannerUpload = multer({
  storage: bannerStorage,
  fileFilter: bannerFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for banners
    files: 1, // Only 1 banner image
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // 100 bytes field name limit
    fields: 10 // Maximum 10 fields
  }
});

// Middleware for handling service media uploads
const uploadServiceMedia = serviceUpload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 3 }
]);

// Middleware for handling banner uploads
const uploadBanner = bannerUpload.single('image');

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter for avatars (only images)
const avatarFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'avatar') {
    if (allowedImageTypes.includes(file.mimetype) && 
        ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed for avatars'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Configure multer for avatars
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
    files: 1, // Only 1 avatar image
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // 100 bytes field name limit
    fields: 10 // Maximum 10 fields
  }
});

// Middleware for handling avatar uploads
const uploadAvatar = avatarUpload.single('avatar');

module.exports = {
  uploadServiceMedia,
  uploadBanner,
  uploadAvatar
};