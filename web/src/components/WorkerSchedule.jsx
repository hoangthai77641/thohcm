import React, { useState, useEffect } from 'react';
import '../styles/WorkerSchedule.css';

const WorkerSchedule = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchWorkers();
  }, [selectedDate]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const url = selectedDate 
        ? `/api/schedules/workers?date=${selectedDate}`
        : '/api/schedules/workers';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setWorkers(data.schedules || []);
      } else {
        setError(data.message || 'Lỗi khi tải danh sách thợ');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('vi-VN');
  };

  const handleBookSlot = (worker, slot) => {
    setSelectedWorker(worker);
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBooking = async (serviceId, address, note) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập để đặt lịch');
        return;
      }

      const response = await fetch(`/api/schedules/book/${selectedWorker.worker._id}/${selectedSlot._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service: serviceId,
          address: address,
          note: note
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Đặt lịch thành công!');
        setShowBookingModal(false);
        fetchWorkers(); // Refresh the list
      } else {
        alert(data.message || 'Lỗi khi đặt lịch');
      }
    } catch (err) {
      alert('Lỗi kết nối server');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'busy': return '#FF9800';
      case 'offline': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Sẵn sàng';
      case 'busy': return 'Đang bận';
      case 'offline': return 'Offline';
      default: return 'Không xác định';
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="worker-schedule-container">
      <div className="schedule-header">
        <h2>Lịch Rãnh Của Thợ</h2>
        <div className="date-filter">
          <label htmlFor="date-select">Chọn ngày:</label>
          <input
            id="date-select"
            type="date"
            value={selectedDate}
            min={today}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={() => setSelectedDate('')} className="clear-date-btn">
            Xem tất cả
          </button>
        </div>
      </div>

      {loading && <div className="loading">Đang tải...</div>}
      {error && <div className="error">{error}</div>}

      <div className="workers-grid">
        {workers.map((workerSchedule, index) => (
          <div key={index} className="worker-card">
            <div className="worker-info">
              <h3>{workerSchedule.worker.name}</h3>
              <p className="worker-phone">{workerSchedule.worker.phone}</p>
              <div className="worker-status">
                <span 
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(workerSchedule.currentStatus) }}
                ></span>
                {getStatusText(workerSchedule.currentStatus)}
                {workerSchedule.currentStatus === 'busy' && workerSchedule.estimatedCompletion && (
                  <div className="estimated-completion">
                    <small>
                      Dự kiến rãnh lúc: {new Date(workerSchedule.estimatedCompletion).toLocaleString('vi-VN')}
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div className="available-slots">
              <h4>Khung giờ rãnh:</h4>
              {workerSchedule.availableSlots.length === 0 ? (
                <p className="no-slots">Không có khung giờ rãnh</p>
              ) : (
                <div className="slots-list">
                  {workerSchedule.availableSlots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="time-slot">
                      <div className="slot-time">
                        <span className="date">{formatDate(slot.startTime)}</span>
                        <span className="time">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      </div>
                      {slot.note && (
                        <div className="slot-note">{slot.note}</div>
                      )}
                      <button
                        className="book-slot-btn"
                        onClick={() => handleBookSlot(workerSchedule, slot)}
                        disabled={workerSchedule.currentStatus === 'offline'}
                      >
                        Đặt lịch
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="last-updated">
              Cập nhật lần cuối: {new Date(workerSchedule.lastUpdated).toLocaleString('vi-VN')}
            </div>
          </div>
        ))}
      </div>

      {workers.length === 0 && !loading && (
        <div className="no-workers">
          Không tìm thấy thợ nào có lịch rãnh
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          worker={selectedWorker}
          slot={selectedSlot}
          onBook={handleBooking}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};

// Booking Modal Component
const BookingModal = ({ worker, slot, onBook, onClose }) => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      if (response.ok) {
        setServices(data.services || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedService || !address.trim()) {
      alert('Vui lòng chọn dịch vụ và nhập địa chỉ');
      return;
    }
    onBook(selectedService, address.trim(), note.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Đặt lịch với {worker.worker.name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="booking-info">
          <p><strong>Thời gian:</strong> {new Date(slot.startTime).toLocaleString('vi-VN')} - {new Date(slot.endTime).toLocaleTimeString('vi-VN')}</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label htmlFor="service-select">Chọn dịch vụ:</label>
            <select
              id="service-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              required
            >
              <option value="">-- Chọn dịch vụ --</option>
              {services.map(service => (
                <option key={service._id} value={service._id}>
                  {service.name} - {service.basePrice.toLocaleString('vi-VN')}đ
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="address-input">Địa chỉ:</label>
            <textarea
              id="address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ cần thực hiện dịch vụ..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="note-input">Ghi chú (không bắt buộc):</label>
            <textarea
              id="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm về yêu cầu..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Hủy
            </button>
            <button type="submit" className="confirm-btn">
              Xác nhận đặt lịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerSchedule;