import React, { useState, useEffect } from 'react';
import '../styles/WorkerJobManager.css';

const WorkerJobManager = () => {
  const [currentJob, setCurrentJob] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchCurrentJob();
    fetchPendingBookings();
  }, []);

  const fetchCurrentJob = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedules/current-job', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setCurrentJob(data.hasCurrentJob ? data : null);
      }
    } catch (err) {
      console.error('Error fetching current job:', err);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bookings?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = (booking) => {
    setSelectedBooking(booking);
    setShowEstimateModal(true);
  };

  const handleEstimateSubmit = async (e) => {
    e.preventDefault();
    
    if (!estimatedTime) {
      alert('Vui lòng nhập thời gian dự kiến hoàn thành');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Cập nhật trạng thái booking thành confirmed với thời gian dự kiến
      const response = await fetch(`/api/bookings/${selectedBooking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'confirmed',
          estimatedCompletionTime: estimatedTime
        })
      });

      if (response.ok) {
        alert('Xác nhận đơn hàng và cập nhật lịch rãnh thành công!');
        setShowEstimateModal(false);
        setEstimatedTime('');
        setSelectedBooking(null);
        
        // Refresh data
        fetchCurrentJob();
        fetchPendingBookings();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Lỗi khi xác nhận đơn hàng');
      }
    } catch (err) {
      alert('Lỗi kết nối server');
    }
  };

  const handleUpdateEstimatedTime = async () => {
    const newTime = prompt(
      'Nhập thời gian dự kiến hoàn thành mới:', 
      currentJob?.estimatedCompletion ? 
        new Date(currentJob.estimatedCompletion).toISOString().slice(0, 16) : ''
    );

    if (!newTime) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedules/update-estimated-time', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newEstimatedCompletionTime: newTime
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Cập nhật thời gian dự kiến thành công!');
        fetchCurrentJob();
      } else {
        alert(data.message || 'Lỗi khi cập nhật thời gian');
      }
    } catch (err) {
      alert('Lỗi kết nối server');
    }
  };

  const handleCompleteJob = async () => {
    if (!confirm('Xác nhận hoàn thành công việc hiện tại?')) return;

    try {
      const token = localStorage.getItem('token');
      
      // Cập nhật booking status thành done
      const bookingResponse = await fetch(`/api/bookings/${currentJob.currentJob.booking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'done'
        })
      });

      // Hoàn thành công việc trong schedule
      const scheduleResponse = await fetch('/api/schedules/complete-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: currentJob.currentJob.booking._id
        })
      });

      if (bookingResponse.ok && scheduleResponse.ok) {
        alert('Hoàn thành công việc thành công!');
        fetchCurrentJob();
        fetchPendingBookings();
      } else {
        alert('Lỗi khi hoàn thành công việc');
      }
    } catch (err) {
      alert('Lỗi kết nối server');
    }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    return new Date(dateTime).toLocaleString('vi-VN');
  };

  const getTimeRemaining = (estimatedTime) => {
    if (!estimatedTime) return '';
    
    const now = new Date();
    const estimated = new Date(estimatedTime);
    const diff = estimated - now;
    
    if (diff <= 0) return 'Đã quá thời gian dự kiến';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `Còn ${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="worker-job-manager">
      <h2>Quản Lý Công Việc</h2>

      {/* Current Job Section */}
      <div className="current-job-section">
        <h3>Công Việc Hiện Tại</h3>
        {currentJob ? (
          <div className="current-job-card">
            <div className="job-info">
              <h4>Đang thực hiện công việc</h4>
              <p><strong>Khách hàng:</strong> {currentJob.currentJob.booking.customer?.name}</p>
              <p><strong>Dịch vụ:</strong> {currentJob.currentJob.booking.service?.name}</p>
              <p><strong>Địa chỉ:</strong> {currentJob.currentJob.booking.address}</p>
              <p><strong>Thời gian bắt đầu:</strong> {formatTime(currentJob.currentJob.actualStartTime)}</p>
              <p><strong>Dự kiến hoàn thành:</strong> {formatTime(currentJob.estimatedCompletion)}</p>
              <p className="time-remaining">
                <strong>{getTimeRemaining(currentJob.estimatedCompletion)}</strong>
              </p>
            </div>
            
            <div className="job-actions">
              <button 
                onClick={handleUpdateEstimatedTime}
                className="update-time-btn"
              >
                Cập nhật thời gian dự kiến
              </button>
              <button 
                onClick={handleCompleteJob}
                className="complete-job-btn"
              >
                Hoàn thành công việc
              </button>
            </div>
          </div>
        ) : (
          <div className="no-current-job">
            <p>Hiện tại không có công việc nào đang thực hiện</p>
            <p className="status-available">Trạng thái: Sẵn sàng nhận việc mới</p>
          </div>
        )}
      </div>

      {/* Pending Bookings Section */}
      <div className="pending-bookings-section">
        <h3>Đơn Hàng Chờ Xác Nhận ({bookings.length})</h3>
        {bookings.length === 0 ? (
          <p className="no-bookings">Không có đơn hàng nào chờ xác nhận</p>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking._id} className="pending-booking-card">
                <div className="booking-info">
                  <h4>{booking.service?.name}</h4>
                  <p><strong>Khách hàng:</strong> {booking.customer?.name} - {booking.customer?.phone}</p>
                  <p><strong>Thời gian đặt:</strong> {formatTime(booking.date)}</p>
                  <p><strong>Địa chỉ:</strong> {booking.address}</p>
                  {booking.note && <p><strong>Ghi chú:</strong> {booking.note}</p>}
                  <p><strong>Giá:</strong> {booking.finalPrice?.toLocaleString('vi-VN')}đ</p>
                </div>
                
                <div className="booking-actions">
                  <button 
                    onClick={() => handleConfirmBooking(booking)}
                    className="confirm-booking-btn"
                    disabled={currentJob !== null}
                  >
                    {currentJob ? 'Đang bận' : 'Xác nhận & Dự kiến thời gian'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estimate Time Modal */}
      {showEstimateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Xác nhận đơn hàng và dự kiến thời gian hoàn thành</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowEstimateModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="booking-details">
              <h4>Chi tiết đơn hàng:</h4>
              <p><strong>Khách hàng:</strong> {selectedBooking?.customer?.name}</p>
              <p><strong>Dịch vụ:</strong> {selectedBooking?.service?.name}</p>
              <p><strong>Địa chỉ:</strong> {selectedBooking?.address}</p>
            </div>

            <form onSubmit={handleEstimateSubmit}>
              <div className="form-group">
                <label htmlFor="estimated-time">
                  Thời gian dự kiến hoàn thành:
                </label>
                <input
                  id="estimated-time"
                  type="datetime-local"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
                <small className="help-text">
                  Lịch rãnh sẽ được tự động tạo sau thời gian này
                </small>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEstimateModal(false)}
                  className="cancel-btn"
                >
                  Hủy
                </button>
                <button type="submit" className="confirm-btn">
                  Xác nhận đơn hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerJobManager;