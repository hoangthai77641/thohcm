import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/WorkerBooking.css';

const WorkerBooking = ({ selectedService }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Khung giờ cố định từ 8:00 sáng đến 8:00 tối, cách nhau 1 tiếng
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  useEffect(() => {
    if (selectedService?.worker) {
      fetchBookedSlots();
    }
  }, [selectedDate, selectedService]);

  const fetchBookedSlots = async () => {
    try {
      setLoadingSlots(true);
      const workerId = selectedService.worker._id || selectedService.worker;
      
      // Lấy thời gian bận của thợ trong ngày
      const response = await api.get(`/api/bookings/worker/${workerId}/busy-times`, {
        params: {
          date: selectedDate
        }
      });

      // Trích xuất khung giờ đã được đặt
      const booked = (response.data?.busyTimes || []).map(busyTime => {
        const startTime = new Date(busyTime.start);
        return startTime.getHours().toString().padStart(2, '0') + ':00';
      });

      setBookedSlots(booked);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isSlotBooked = (timeSlot) => {
    return bookedSlots.includes(timeSlot);
  };

  const isSlotInPast = (timeSlot) => {
    const now = new Date();
    const slotDate = new Date(selectedDate);
    const [hour] = timeSlot.split(':').map(Number);
    slotDate.setHours(hour, 0, 0, 0);
    
    return slotDate < now;
  };

  const isSlotAvailable = (timeSlot) => {
    return !isSlotBooked(timeSlot) && !isSlotInPast(timeSlot);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTime || !address.trim()) {
      alert('Vui lòng chọn thời gian và nhập địa chỉ');
      return;
    }

    if (address.trim().length < 10) {
      alert('Địa chỉ phải có ít nhất 10 ký tự');
      return;
    }

    const workerId = selectedService.worker?._id || selectedService.worker;
    if (!workerId) {
      alert('Không tìm thấy thông tin thợ cho dịch vụ này');
      return;
    }

    setLoading(true);
    try {
      const [hour] = selectedTime.split(':').map(Number);
      const preferredTime = new Date(selectedDate);
      preferredTime.setHours(hour, 0, 0, 0);
      
      // Đảm bảo thời gian trong tương lai
      const now = new Date();
      if (preferredTime <= now) {
        alert('Không thể đặt lịch cho thời gian đã qua. Vui lòng chọn thời gian trong tương lai.');
        return;
      }

      const bookingData = {
        service: selectedService._id,
        worker: workerId, 
        date: preferredTime.toISOString(),
        preferredTime: preferredTime.toISOString(),
        address: address.trim(),
        note: note.trim()
      };

      console.log('Sending booking data:', bookingData);
      console.log('Selected service:', selectedService);
      console.log('Preferred time:', preferredTime);
      console.log('Current time:', new Date());
      console.log('Time difference (ms):', preferredTime.getTime() - new Date().getTime());

      await api.post('/api/bookings', bookingData);
      
      alert('Đặt lịch thành công!');
      
      // Reset form
      setSelectedTime('');
      setAddress('');
      setNote('');
      
      // Refresh booked slots
      fetchBookedSlots();
      
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đặt lịch';
      
      if (error.response?.status === 403) {
        alert('Bạn không có quyền thực hiện hành động này. Vui lòng đăng nhập lại.');
        // Redirect to login
        window.location.href = '/login';
      } else if (error.response?.status === 400) {
        // Validation errors or bad request
        const responseData = error.response?.data;
        console.log('400 error response data:', responseData);
        
        if (responseData?.errors && Array.isArray(responseData.errors)) {
          const errorMessages = responseData.errors.map(err => err.msg || err.message).join('\n');
          alert(`Thông tin không hợp lệ:\n${errorMessages}`);
        } else {
          alert(`Lỗi: ${errorMessage}`);
        }
      } else if (error.response?.status === 409) {
        // Conflict - time slot already booked
        alert(`Xung đột lịch: ${errorMessage}`);
      } else {
        alert(`Lỗi không xác định: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!selectedService) {
    return (
      <div className="worker-booking">
        <div className="error">Không tìm thấy thông tin dịch vụ</div>
      </div>
    );
  }

  return (
    <div className="worker-booking">
      <div className="booking-info">
        <h3>Thông tin dịch vụ</h3>
        <div className="service-info">
          <p><strong>Dịch vụ:</strong> {selectedService.name}</p>
          <p><strong>Thợ:</strong> {selectedService.worker?.name || 'Chưa có thông tin'}</p>
          <p><strong>Giá:</strong> {selectedService.basePrice?.toLocaleString('vi-VN')} VNĐ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label>Chọn ngày *</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Chọn thời gian *</label>
          <div className="selected-date-info">
            <p>{formatDate(selectedDate)}</p>
          </div>
          
          {loadingSlots ? (
            <div className="loading-slots">Đang tải khung giờ...</div>
          ) : (
            <div className="time-slots-grid">
              {timeSlots.map(timeSlot => {
                const booked = isSlotBooked(timeSlot);
                const inPast = isSlotInPast(timeSlot);
                const available = isSlotAvailable(timeSlot);
                
                return (
                  <label 
                    key={timeSlot} 
                    className={`time-slot ${!available ? 'disabled' : ''} ${selectedTime === timeSlot ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="time"
                      value={timeSlot}
                      checked={selectedTime === timeSlot}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      disabled={!available}
                    />
                    <span className="time-text">{timeSlot}</span>
                    {booked && <span className="status-badge booked">Đã đặt</span>}
                    {inPast && <span className="status-badge past">Đã qua</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Địa chỉ dịch vụ *</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nhập địa chỉ cụ thể để thợ có thể đến (tối thiểu 10 ký tự)..."
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label>Ghi chú (tùy chọn)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Thêm ghi chú về yêu cầu đặc biệt..."
            rows={2}
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={loading || !selectedTime || !address.trim()}
          >
            {loading ? 'Đang đặt lịch...' : 'Đặt lịch ngay'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkerBooking;