import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WorkerAvailability from './WorkerAvailability';

const ServiceBooking = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceDetails: {
      type: '',
      action: 'repair',
      brand: '',
      model: '',
      issueDescription: '',
      urgency: 'normal',
      photos: []
    },
    location: {
      district: '',
      ward: '',
      fullAddress: '',
      coordinates: null,
      accessInstructions: ''
    },
    scheduledTime: '',
    note: ''
  });
  
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  const serviceTypes = [
    { value: 'air_conditioning', label: 'Điều hòa', icon: '❄️' },
    { value: 'refrigerator', label: 'Tủ lạnh', icon: '🧊' },
    { value: 'washing_machine', label: 'Máy giặt', icon: '👕' },
    { value: 'water_heater', label: 'Máy nước nóng', icon: '🚿' },
    { value: 'electrical', label: 'Điện dân dụng', icon: '⚡' }
  ];

  const districts = [
    'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
    'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Phú Nhuận', 'Bình Thạnh', 'Tân Bình',
    'Tân Phú', 'Gò Vấp', 'Thủ Đức', 'Bình Chánh', 'Hóc Môn', 'Củ Chi', 'Nhà Bè'
  ];

  const urgencyOptions = [
    { value: 'normal', label: 'Bình thường', desc: 'Trong 24h', fee: 'Không phí' },
    { value: 'urgent', label: 'Khẩn cấp', desc: 'Trong 6h', fee: '+30%' },
    { value: 'emergency', label: 'Cấp cứu', desc: 'Trong 2h', fee: '+50%' }
  ];

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: [longitude, latitude]
            }
          }));
          
          // Reverse geocoding would go here to get district/ward
          // For now, just prompt user to select manually
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Không thể lấy vị trí hiện tại. Vui lòng chọn quận/huyện thủ công.');
        }
      );
    }
  };

  // Get service data and price estimate
  useEffect(() => {
    if (formData.serviceDetails.type) {
      getServiceData();
    }
  }, [formData.serviceDetails.type]);

  useEffect(() => {
    if (formData.serviceDetails.type && formData.location.district) {
      getPriceEstimate();
    }
  }, [formData.serviceDetails.type, formData.location.district, formData.serviceDetails.urgency]);

  const getServiceData = async () => {
    try {
      const response = await axios.get(`/api/services/type/${formData.serviceDetails.type}`);
      setCurrentService(response.data);
    } catch (error) {
      console.error('Service data error:', error);
    }
  };

  const getPriceEstimate = async () => {
    try {
      const response = await axios.post('/api/enhanced/estimate', {
        serviceType: formData.serviceDetails.type,
        district: formData.location.district,
        urgency: formData.serviceDetails.urgency
      });
      
      setPriceEstimate(response.data.estimate);
    } catch (error) {
      console.error('Price estimate error:', error);
    }
  };

  // Find available workers
  const findWorkers = async () => {
    if (!formData.location.district || !formData.serviceDetails.type) return;
    
    setLoading(true);
    try {
      const response = await axios.post('/api/enhanced/workers/available', {
        location: formData.location,
        serviceDetails: formData.serviceDetails,
        urgency: formData.serviceDetails.urgency
      });
      
      setAvailableWorkers(response.data.workers);
    } catch (error) {
      console.error('Find workers error:', error);
      alert('Không thể tìm thợ trong khu vực');
    } finally {
      setLoading(false);
    }
  };

  // Book service
  const bookService = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/enhanced/book', {
        ...formData,
        autoAssign: !selectedWorker,
        preferredWorker: selectedWorker?.id
      });
      
      alert('Đặt dịch vụ thành công! Đang tìm thợ phù hợp...');
      // Redirect to tracking page
      window.location.href = `/booking/${response.data.booking.id}/track`;
    } catch (error) {
      console.error('Booking error:', error);
      alert('Không thể đặt dịch vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 2) {
      findWorkers();
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="service-booking">
      {/* Progress bar */}
      <div className="booking-progress">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Dịch vụ</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Vị trí</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Thợ</div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Xác nhận</div>
      </div>

      {/* Step 1: Service Details */}
      {step === 1 && (
        <div className="step-content">
          <h2>Chọn dịch vụ cần sửa chữa</h2>
          
          <div className="service-grid">
            {serviceTypes.map(service => (
              <div 
                key={service.value}
                className={`service-card ${formData.serviceDetails.type === service.value ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({
                  ...prev,
                  serviceDetails: { ...prev.serviceDetails, type: service.value }
                }))}
              >
                <div className="service-icon">{service.icon}</div>
                <div className="service-label">{service.label}</div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Mô tả vấn đề</label>
            <textarea
              value={formData.serviceDetails.issueDescription}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                serviceDetails: { ...prev.serviceDetails, issueDescription: e.target.value }
              }))}
              placeholder="Ví dụ: Điều hòa không lạnh, kêu to..."
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hãng</label>
              <input
                type="text"
                value={formData.serviceDetails.brand}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  serviceDetails: { ...prev.serviceDetails, brand: e.target.value }
                }))}
                placeholder="Samsung, LG, Panasonic..."
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                value={formData.serviceDetails.model}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  serviceDetails: { ...prev.serviceDetails, model: e.target.value }
                }))}
                placeholder="Nếu biết"
              />
            </div>
          </div>

          <div className="urgency-options">
            <h3>Mức độ khẩn cấp</h3>
            {urgencyOptions.map(option => (
              <label key={option.value} className="urgency-option">
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  checked={formData.serviceDetails.urgency === option.value}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    serviceDetails: { ...prev.serviceDetails, urgency: e.target.value }
                  }))}
                />
                <div className="option-details">
                  <div className="option-title">{option.label}</div>
                  <div className="option-desc">{option.desc}</div>
                  <div className="option-fee">{option.fee}</div>
                </div>
              </label>
            ))}
          </div>

          <button 
            className="btn-primary" 
            onClick={nextStep}
            disabled={!formData.serviceDetails.type || !formData.serviceDetails.issueDescription}
          >
            Tiếp theo
          </button>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="step-content">
          <h2>Địa chỉ dịch vụ</h2>
          
          <button className="btn-secondary" onClick={getCurrentLocation}>
            📍 Sử dụng vị trí hiện tại
          </button>

          <div className="form-row">
            <div className="form-group">
              <label>Quận/Huyện *</label>
              <select
                value={formData.location.district}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, district: e.target.value }
                }))}
                required
              >
                <option value="">Chọn quận/huyện</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Phường/Xã</label>
              <input
                type="text"
                value={formData.location.ward}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, ward: e.target.value }
                }))}
                placeholder="Phường/Xã"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Địa chỉ chi tiết *</label>
            <input
              type="text"
              value={formData.location.fullAddress}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, fullAddress: e.target.value }
              }))}
              placeholder="Số nhà, đường, khu vực..."
              required
            />
          </div>

          <div className="form-group">
            <label>Hướng dẫn tìm đường</label>
            <textarea
              value={formData.location.accessInstructions}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, accessInstructions: e.target.value }
              }))}
              placeholder="Ví dụ: Cổng chính, tầng 2, gọi chuông..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Thời gian mong muốn</label>
            <input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                scheduledTime: e.target.value
              }))}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {priceEstimate && (
            <div className="price-estimate">
              <h3>Ước tính chi phí</h3>
              <div className="price-range">
                {priceEstimate.priceRange.min.toLocaleString()} - {priceEstimate.priceRange.max.toLocaleString()} VNĐ
              </div>
              <div className="price-factors">
                {priceEstimate.factors.map((factor, idx) => (
                  <div key={idx} className={`factor ${factor.impact}`}>
                    {factor.factor}: {factor.impact === 'increase' ? '+' : ''}{factor.amount.toLocaleString()} VNĐ
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="step-buttons">
            <button className="btn-secondary" onClick={prevStep}>Quay lại</button>
            <button 
              className="btn-primary" 
              onClick={nextStep}
              disabled={!formData.location.district || !formData.location.fullAddress}
            >
              Tìm thợ
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Worker Selection */}
      {step === 3 && (
        <div className="step-content">
          <h2>Chọn thợ (tùy chọn)</h2>
          <p>Hệ thống sẽ tự động tìm thợ phù hợp nhất nếu bạn không chọn</p>

          {/* Auto-assign option */}
          <div className="mb-6">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                !selectedWorker 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedWorker(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <div className="font-medium">Tự động chọn thợ tốt nhất</div>
                    <div className="text-sm text-gray-600">Hệ thống sẽ tìm thợ gần nhất và ít việc nhất</div>
                  </div>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Khuyến nghị
                </div>
              </div>
            </div>
          </div>

          {/* Worker availability component */}
          {formData.scheduledTime && currentService && (
            <WorkerAvailability 
              serviceId={currentService._id}
              selectedDate={formData.scheduledTime}
              onWorkerSelect={setSelectedWorker}
            />
          )}

          <div className="step-buttons mt-6">
            <button className="btn-secondary" onClick={prevStep}>Quay lại</button>
            <button className="btn-primary" onClick={nextStep}>
              {selectedWorker ? `Chọn ${selectedWorker.name}` : 'Tự động chọn thợ'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="step-content">
          <h2>Xác nhận đặt dịch vụ</h2>
          
          <div className="booking-summary">
            <div className="summary-section">
              <h3>Dịch vụ</h3>
              <p>{serviceTypes.find(s => s.value === formData.serviceDetails.type)?.label}</p>
              <p>{formData.serviceDetails.issueDescription}</p>
              <p>Mức độ: {urgencyOptions.find(u => u.value === formData.serviceDetails.urgency)?.label}</p>
            </div>

            <div className="summary-section">
              <h3>Địa chỉ</h3>
              <p>{formData.location.fullAddress}</p>
              <p>{formData.location.ward}, {formData.location.district}</p>
              {formData.scheduledTime && (
                <p>Thời gian: {new Date(formData.scheduledTime).toLocaleString('vi-VN')}</p>
              )}
            </div>

            <div className="summary-section">
              <h3>Thợ được chọn</h3>
              <p>{selectedWorker ? selectedWorker.name : 'Tự động chọn thợ tốt nhất'}</p>
            </div>

            {priceEstimate && (
              <div className="summary-section">
                <h3>Chi phí ước tính</h3>
                <div className="final-price">
                  {priceEstimate.estimatedPrice.toLocaleString()} VNĐ
                </div>
                <small>*Giá cuối cùng có thể thay đổi tùy theo tình trạng thực tế</small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Ghi chú thêm</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Ghi chú đặc biệt cho thợ..."
              rows={2}
            />
          </div>

          <div className="step-buttons">
            <button className="btn-secondary" onClick={prevStep}>Quay lại</button>
            <button 
              className="btn-primary btn-confirm" 
              onClick={bookService}
              disabled={loading}
            >
              {loading ? 'Đang đặt dịch vụ...' : 'Xác nhận đặt dịch vụ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBooking;