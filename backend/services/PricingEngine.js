class PricingEngine {
  static DISTRICTS = {
    // Center districts - premium pricing
    'Quận 1': { tier: 'premium', multiplier: 1.3 },
    'Quận 3': { tier: 'premium', multiplier: 1.2 },
    'Quận 5': { tier: 'premium', multiplier: 1.2 },
    'Quận 10': { tier: 'premium', multiplier: 1.15 },
    
    // Business districts
    'Phú Nhuận': { tier: 'business', multiplier: 1.1 },
    'Bình Thạnh': { tier: 'business', multiplier: 1.1 },
    'Tân Bình': { tier: 'business', multiplier: 1.1 },
    
    // Standard pricing
    'Quận 2': { tier: 'standard', multiplier: 1.0 },
    'Quận 4': { tier: 'standard', multiplier: 1.0 },
    'Quận 6': { tier: 'standard', multiplier: 1.0 },
    'Quận 7': { tier: 'standard', multiplier: 1.0 },
    'Quận 8': { tier: 'standard', multiplier: 1.0 },
    'Quận 11': { tier: 'standard', multiplier: 1.0 },
    'Quận 12': { tier: 'standard', multiplier: 1.0 },
    'Gò Vấp': { tier: 'standard', multiplier: 0.95 },
    'Tân Phú': { tier: 'standard', multiplier: 0.95 },
    
    // Suburban - lower pricing
    'Thủ Đức': { tier: 'suburban', multiplier: 0.9 },
    'Hóc Môn': { tier: 'suburban', multiplier: 0.85 },
    'Bình Chánh': { tier: 'suburban', multiplier: 0.85 },
    'Củ Chi': { tier: 'suburban', multiplier: 0.8 },
    'Nhà Bè': { tier: 'suburban', multiplier: 0.8 }
  };

  static SERVICE_BASE_PRICES = {
    air_conditioning: {
      cleaning: 200000,
      repair: 300000,
      installation: 500000,
      maintenance: 250000
    },
    refrigerator: {
      repair: 250000,
      maintenance: 200000,
      installation: 400000
    },
    washing_machine: {
      repair: 200000,
      maintenance: 150000,
      installation: 300000
    },
    water_heater: {
      repair: 180000,
      maintenance: 120000,
      installation: 350000
    },
    electrical: {
      wiring: 150000,
      outlet_installation: 100000,
      panel_repair: 400000
    }
  };

  static TIME_MULTIPLIERS = {
    // Peak hours (7-9 AM, 5-8 PM)
    peak: { multiplier: 1.3, label: 'Giờ cao điểm' },
    // Business hours (9 AM - 5 PM)
    business: { multiplier: 1.0, label: 'Giờ hành chính' },
    // Evening (8 PM - 10 PM)
    evening: { multiplier: 1.1, label: 'Giờ tối' },
    // Night (10 PM - 7 AM)
    night: { multiplier: 1.5, label: 'Giờ đêm' },
    // Weekend
    weekend: { multiplier: 1.2, label: 'Cuối tuần' }
  };

  /**
   * Calculate dynamic pricing for a service request
   */
  static calculatePrice(bookingRequest) {
    const {
      serviceDetails,
      location,
      scheduledTime,
      urgency = 'normal',
      customerLoyalty = 'normal'
    } = bookingRequest;

    let pricing = {
      basePrice: 0,
      locationMultiplier: 1.0,
      timeMultiplier: 1.0,
      urgencyFee: 0,
      distanceFee: 0,
      serviceFee: 0,
      vipDiscount: 0,
      promoDiscount: 0,
      breakdown: [],
      finalPrice: 0
    };

    // 1. Base price calculation
    const serviceType = serviceDetails.type;
    const serviceAction = serviceDetails.action || 'repair';
    
    if (this.SERVICE_BASE_PRICES[serviceType] && this.SERVICE_BASE_PRICES[serviceType][serviceAction]) {
      pricing.basePrice = this.SERVICE_BASE_PRICES[serviceType][serviceAction];
    } else {
      pricing.basePrice = 250000; // Default price
    }

    pricing.breakdown.push({
      item: `Dịch vụ ${this.getServiceName(serviceType, serviceAction)}`,
      amount: pricing.basePrice,
      type: 'base'
    });

    // 2. Location-based pricing
    const district = location.district;
    if (this.DISTRICTS[district]) {
      pricing.locationMultiplier = this.DISTRICTS[district].multiplier;
      const locationAdjustment = pricing.basePrice * (pricing.locationMultiplier - 1);
      if (locationAdjustment !== 0) {
        pricing.breakdown.push({
          item: `Phụ phí khu vực ${district}`,
          amount: locationAdjustment,
          type: 'location'
        });
      }
    }

    // 3. Time-based pricing
    if (scheduledTime) {
      const timeInfo = this.getTimeMultiplier(new Date(scheduledTime));
      pricing.timeMultiplier = timeInfo.multiplier;
      
      if (timeInfo.multiplier !== 1.0) {
        const timeAdjustment = pricing.basePrice * (timeInfo.multiplier - 1);
        pricing.breakdown.push({
          item: `Phụ phí ${timeInfo.label.toLowerCase()}`,
          amount: timeAdjustment,
          type: 'time'
        });
      }
    }

    // 4. Urgency fee
    switch (urgency) {
      case 'urgent':
        pricing.urgencyFee = pricing.basePrice * 0.3; // 30% surcharge
        pricing.breakdown.push({
          item: 'Phí khẩn cấp (trong ngày)',
          amount: pricing.urgencyFee,
          type: 'urgency'
        });
        break;
      case 'emergency':
        pricing.urgencyFee = pricing.basePrice * 0.5; // 50% surcharge
        pricing.breakdown.push({
          item: 'Phí khẩn cấp (tức thì)',
          amount: pricing.urgencyFee,
          type: 'urgency'
        });
        break;
    }

    // 5. Distance fee (if location is far from city center)
    if (location.coordinates) {
      const distanceFee = this.calculateDistanceFee(location.coordinates);
      if (distanceFee > 0) {
        pricing.distanceFee = distanceFee;
        pricing.breakdown.push({
          item: 'Phí di chuyển',
          amount: distanceFee,
          type: 'distance'
        });
      }
    }

    // 6. Platform service fee (3% of subtotal)
    const subtotal = pricing.basePrice * pricing.locationMultiplier * pricing.timeMultiplier + 
                    pricing.urgencyFee + pricing.distanceFee;
    pricing.serviceFee = Math.round(subtotal * 0.03);
    pricing.breakdown.push({
      item: 'Phí dịch vụ',
      amount: pricing.serviceFee,
      type: 'service'
    });

    // 7. VIP discount
    if (customerLoyalty === 'vip') {
      pricing.vipDiscount = Math.round(subtotal * 0.1); // 10% VIP discount
      pricing.breakdown.push({
        item: 'Giảm giá VIP (-10%)',
        amount: -pricing.vipDiscount,
        type: 'discount'
      });
    }

    // 8. Calculate final price
    pricing.finalPrice = Math.round(
      pricing.basePrice * pricing.locationMultiplier * pricing.timeMultiplier +
      pricing.urgencyFee +
      pricing.distanceFee +
      pricing.serviceFee -
      pricing.vipDiscount -
      pricing.promoDiscount
    );

    return pricing;
  }

  /**
   * Get time-based multiplier
   */
  static getTimeMultiplier(datetime) {
    const hour = datetime.getHours();
    const day = datetime.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend check
    if (day === 0 || day === 6) {
      return this.TIME_MULTIPLIERS.weekend;
    }

    // Peak hours
    if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 20)) {
      return this.TIME_MULTIPLIERS.peak;
    }

    // Night hours
    if (hour >= 22 || hour < 7) {
      return this.TIME_MULTIPLIERS.night;
    }

    // Evening hours
    if (hour >= 20 && hour < 22) {
      return this.TIME_MULTIPLIERS.evening;
    }

    // Business hours
    return this.TIME_MULTIPLIERS.business;
  }

  /**
   * Calculate distance fee from city center
   */
  static calculateDistanceFee(coordinates) {
    // City center reference point (Nguyen Hue Walking Street)
    const cityCenter = [106.7005, 10.7748];
    const [lng, lat] = coordinates;
    
    const distance = this.calculateDistance(cityCenter, [lng, lat]);
    
    // Free within 10km, then 10,000 VND per additional km
    if (distance <= 10) return 0;
    
    return Math.round((distance - 10) * 10000);
  }

  /**
   * Calculate distance between two coordinates
   */
  static calculateDistance(coord1, coord2) {
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
  }

  /**
   * Get human-readable service name
   */
  static getServiceName(type, action) {
    const names = {
      air_conditioning: 'điều hòa',
      refrigerator: 'tủ lạnh',
      washing_machine: 'máy giặt',
      water_heater: 'máy nước nóng',
      electrical: 'điện dân dụng'
    };

    const actions = {
      cleaning: 'vệ sinh',
      repair: 'sửa chữa',
      installation: 'lắp đặt',
      maintenance: 'bảo trì'
    };

    return `${actions[action] || 'sửa chữa'} ${names[type] || 'thiết bị'}`;
  }

  /**
   * Apply promotional discount
   */
  static applyPromoCode(pricing, promoCode) {
    // This would integrate with a promo code system
    const promoCodes = {
      'WELCOME10': { type: 'percent', value: 0.1, maxDiscount: 50000 },
      'NEWCUSTOMER': { type: 'fixed', value: 30000 },
      'VIP20': { type: 'percent', value: 0.2, maxDiscount: 100000, requiresVip: true }
    };

    const promo = promoCodes[promoCode];
    if (!promo) return pricing;

    let discount = 0;
    if (promo.type === 'percent') {
      discount = Math.min(pricing.finalPrice * promo.value, promo.maxDiscount || Infinity);
    } else {
      discount = promo.value;
    }

    pricing.promoDiscount = discount;
    pricing.finalPrice -= discount;
    
    pricing.breakdown.push({
      item: `Mã giảm giá ${promoCode}`,
      amount: -discount,
      type: 'promo'
    });

    return pricing;
  }

  /**
   * Get pricing estimate without creating booking
   */
  static getEstimate(serviceType, district, urgency = 'normal') {
    const mockRequest = {
      serviceDetails: { type: serviceType, action: 'repair' },
      location: { district },
      urgency,
      customerLoyalty: 'normal'
    };

    const pricing = this.calculatePrice(mockRequest);
    
    return {
      estimatedPrice: pricing.finalPrice,
      priceRange: {
        min: Math.round(pricing.finalPrice * 0.8),
        max: Math.round(pricing.finalPrice * 1.2)
      },
      factors: pricing.breakdown.map(item => ({
        factor: item.item,
        impact: item.amount > 0 ? 'increase' : 'decrease',
        amount: Math.abs(item.amount)
      }))
    };
  }
}

module.exports = PricingEngine;