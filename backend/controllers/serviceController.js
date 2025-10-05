const Service = require('../models/Service');
const Review = require('../models/Review');

// helper to add computed prices and rating
async function decorate(service, user){
  if (!service) return service;
  const obj = service.toObject();
  
  // Price calculations
  obj.vipPrice = Math.round(obj.basePrice * 0.9);
  if (user && user.role === 'customer' && user.loyaltyLevel === 'vip') {
    obj.effectivePrice = obj.vipPrice;
  } else {
    obj.effectivePrice = obj.basePrice;
  }
  
  // Calculate average rating
  const reviews = await Review.find({ service: service._id });
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    obj.averageRating = (totalRating / reviews.length).toFixed(1);
    obj.reviewCount = reviews.length;
  } else {
    obj.averageRating = 0;
    obj.reviewCount = 0;
  }
  
  return obj;
}

exports.createService = async (req, res) => {
  try {
    console.log('Create service request body:', req.body);
    console.log('Create service files:', req.files);
    
    const workerId = req.user && req.user.id;
    const { name, description, basePrice, promoPercent, images, videos, category } = req.body;
    
    // Basic validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tên dịch vụ là bắt buộc' });
    }
    
    // Handle uploaded files
    const imageUrls = [];
    const videoUrls = [];
    
    if (req.files) {
      // Process uploaded images
      if (req.files.images) {
        req.files.images.forEach(file => {
          imageUrls.push(`/uploads/services/${file.filename}`);
        });
      }
      
      // Process uploaded videos
      if (req.files.videos) {
        req.files.videos.forEach(file => {
          videoUrls.push(`/uploads/services/${file.filename}`);
        });
      }
    }
    
    // Merge with existing images/videos from request body (for updates)
    const existingImages = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);
    const existingVideos = Array.isArray(videos) ? videos : (videos ? JSON.parse(videos) : []);
    
    const allImages = [...existingImages, ...imageUrls];
    const allVideos = [...existingVideos, ...videoUrls];
    
    const service = new Service({ 
      name: name,
      description: description,
      basePrice: basePrice ? Number(basePrice) : undefined, 
      promoPercent: promoPercent ? Number(promoPercent) : 0, 
      worker: workerId,
      images: allImages,
      videos: allVideos,
      category: category || 'Điện Lạnh'
    });
    
    await service.save();
    res.status(201).json(decorate(service));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { category, search, mine } = req.query;
    const mineRequested = typeof mine === 'string' && ['true', '1', 'yes'].includes(mine.toLowerCase());

    const filter = {};

    if (mineRequested) {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      // Workers manage their own services, admins can inspect theirs using the same flag
      filter.worker = req.user.id;
      // Include inactive services as well when viewing personal list
    } else {
      filter.isActive = true;

      // Filter by category if provided
      if (category && category !== 'all') {
        filter.category = category;
      }
    }
    
    // Filter by category for mine scope as well (optional)
    if (mineRequested && category && category !== 'all') {
      filter.category = category;
    }
    
    // Enhanced search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      
      // Create flexible search patterns
      const searchPatterns = [
        searchTerm,
        searchTerm.replace(/\s+/g, ''), // Remove spaces
        ...searchTerm.split(' ').filter(word => word.length > 1) // Individual words
      ];
      
      // Common Vietnamese keywords mapping
      const keywordMappings = {
        'sửa': ['sửa chữa', 'bảo dưỡng', 'thay thế'],
        'máy lạnh': ['điều hòa', 'máy điều hòa', 'air conditioner', 'ac'],
        'máy giặt': ['washing machine', 'máy giặt'],
        'tủ lạnh': ['refrigerator', 'tủ lạnh'],
        'điện': ['electrical', 'electric'],
        'nước': ['water', 'plumbing'],
        'xe': ['motorbike', 'motorcycle', 'bike', 'car'],
        'lắp đặt': ['installation', 'install', 'setup'],
        'vệ sinh': ['cleaning', 'clean', 'wash']
      };
      
      // Expand search terms with mappings
      const expandedTerms = [...searchPatterns];
      for (const [key, values] of Object.entries(keywordMappings)) {
        if (searchTerm.includes(key)) {
          expandedTerms.push(...values);
        }
      }
      
      // Create regex patterns for fuzzy matching
      const regexPatterns = expandedTerms.map(term => new RegExp(term, 'i'));
      
      // Build comprehensive search filter
      const searchConditions = [];
      
      // Search in service fields
      regexPatterns.forEach(regex => {
        searchConditions.push(
          { name: regex },
          { description: regex },
          { category: regex }
        );
      });
      
      // Add partial word matching for Vietnamese
      const partialRegex = new RegExp(searchTerm.split('').join('.*'), 'i');
      searchConditions.push(
        { name: partialRegex },
        { description: partialRegex }
      );
      
      filter.$or = searchConditions;
    }
    
  let services = await Service.find(filter).populate('worker', 'name phone address');
    
    // If searching, also search by worker name and merge results
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const workerRegex = new RegExp(searchTerm, 'i');
      
      const workerServices = await Service.find({ isActive: true })
        .populate({
          path: 'worker',
          match: { name: workerRegex },
          select: 'name phone address'
        });
      
      // Filter out services where worker didn't match
      const matchedWorkerServices = workerServices.filter(s => s.worker);
      
      // Merge and deduplicate results
      const allServices = [...services, ...matchedWorkerServices];
      const uniqueServices = allServices.filter((service, index, self) => 
        index === self.findIndex(s => s._id.toString() === service._id.toString())
      );
      
      services = uniqueServices;
      
      // Sort results by relevance (exact matches first)
      const exactNameMatch = new RegExp(`^${searchTerm}$`, 'i');
      const startsWithMatch = new RegExp(`^${searchTerm}`, 'i');
      
      services.sort((a, b) => {
        const aExact = exactNameMatch.test(a.name) ? 3 : 0;
        const bExact = exactNameMatch.test(b.name) ? 3 : 0;
        const aStarts = startsWithMatch.test(a.name) ? 2 : 0;
        const bStarts = startsWithMatch.test(b.name) ? 2 : 0;
        const aContains = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0;
        const bContains = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0;
        
        return (bExact + bStarts + bContains) - (aExact + aStarts + aContains);
      });
    }
    
    const user = req.user; // may be undefined (public)
    const decoratedServices = await Promise.all(services.map(s => decorate(s, user)));
    
    res.json(decoratedServices);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('worker', 'name phone address');
    if (!service) return res.status(404).json({ message: 'Not found' });
    const decoratedService = await decorate(service, req.user);
    res.json(decoratedService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Not found' });
    
    // Handle simple fields
    const fields = ['name', 'description', 'basePrice','promoPercent','isActive','category'];
    fields.forEach(f=> { if (req.body[f] !== undefined) service[f] = req.body[f]; });
    
    // Handle uploaded files
    const newImageUrls = [];
    const newVideoUrls = [];
    
    if (req.files) {
      // Process uploaded images
      if (req.files.images) {
        req.files.images.forEach(file => {
          newImageUrls.push(`/uploads/services/${file.filename}`);
        });
      }
      
      // Process uploaded videos
      if (req.files.videos) {
        req.files.videos.forEach(file => {
          newVideoUrls.push(`/uploads/services/${file.filename}`);
        });
      }
    }
    
    // Handle existing media from request body
    if (req.body.images !== undefined) {
      const existingImages = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? JSON.parse(req.body.images) : []);
      service.images = [...existingImages, ...newImageUrls];
    } else if (newImageUrls.length > 0) {
      service.images = [...(service.images || []), ...newImageUrls];
    }
    
    if (req.body.videos !== undefined) {
      const existingVideos = Array.isArray(req.body.videos) ? req.body.videos : (req.body.videos ? JSON.parse(req.body.videos) : []);
      service.videos = [...existingVideos, ...newVideoUrls];
    } else if (newVideoUrls.length > 0) {
      service.videos = [...(service.videos || []), ...newVideoUrls];
    }
    
    await service.save();
    res.json(decorate(service, req.user));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Not found' });
    await service.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Find service by type/name for booking
exports.findServiceByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Map service types to actual service names
    const typeMapping = {
      'air_conditioning': ['Điều hòa', 'điều hòa', 'Air Conditioning'],
      'refrigerator': ['Tủ lạnh', 'tủ lạnh', 'Refrigerator'],
      'washing_machine': ['Máy giặt', 'máy giặt', 'Washing Machine'],
      'water_heater': ['Máy nước nóng', 'máy nước nóng', 'Water Heater'],
      'electrical': ['Điện dân dụng', 'điện dân dụng', 'Electrical']
    };

    const searchNames = typeMapping[type] || [type];
    
    // Find service by name (case insensitive)
    const service = await Service.findOne({
      name: { $in: searchNames.map(name => new RegExp(name, 'i')) },
      isActive: true
    });

    if (!service) {
      // If no specific service found, create a default one or return first active service
      const defaultService = await Service.findOne({ isActive: true });
      if (!defaultService) {
        return res.status(404).json({ message: 'Không tìm thấy dịch vụ nào' });
      }
      return res.json(await decorate(defaultService, req.user));
    }

    res.json(await decorate(service, req.user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      'Điện Lạnh', 
      'Máy Giặt', 
      'Điện Gia Dụng', 
      'Hệ Thống Điện', 
      'Sửa Xe Đạp', 
      'Sửa Xe Máy', 
      'Sửa Xe Oto', 
      'Sửa Xe Điện'
    ];
    
    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Service.countDocuments({ 
          category, 
          isActive: true 
        });
        return { name: category, count };
      })
    );
    
    res.json(categoriesWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
