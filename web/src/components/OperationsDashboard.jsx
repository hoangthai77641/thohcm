import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const OperationsDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeWorkers: 0,
    onlineWorkers: 0,
    pendingBookings: 0,
    revenue: 0
  });

  const [realtimeData, setRealtimeData] = useState({
    activeBookings: [],
    workerLocations: [],
    recentActivities: []
  });

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io();
    setSocket(newSocket);

    // Load initial data
    fetchDashboardStats();
    fetchRealtimeData();

    // Socket listeners for real-time updates
    newSocket.on('booking_created', handleNewBooking);
    newSocket.on('worker_status_change', handleWorkerStatusChange);
    newSocket.on('booking_status_change', handleBookingStatusChange);
    newSocket.on('worker_location_update', handleWorkerLocationUpdate);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const [bookingsRes, workersRes, activitiesRes] = await Promise.all([
        axios.get('/api/admin/bookings/active'),
        axios.get('/api/admin/workers/locations'),
        axios.get('/api/admin/activities/recent')
      ]);

      setRealtimeData({
        activeBookings: bookingsRes.data.bookings,
        workerLocations: workersRes.data.workers,
        recentActivities: activitiesRes.data.activities
      });
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
    }
  };

  const handleNewBooking = (data) => {
    setStats(prev => ({
      ...prev,
      pendingBookings: prev.pendingBookings + 1,
      totalBookings: prev.totalBookings + 1
    }));

    setRealtimeData(prev => ({
      ...prev,
      activeBookings: [...prev.activeBookings, data.booking],
      recentActivities: [
        {
          id: Date.now(),
          type: 'booking_created',
          message: `Đơn hàng mới từ ${data.booking.customerName}`,
          timestamp: new Date(),
          priority: 'high'
        },
        ...prev.recentActivities.slice(0, 9)
      ]
    }));
  };

  const handleWorkerStatusChange = (data) => {
    const { workerId, isOnline } = data;
    
    setStats(prev => ({
      ...prev,
      onlineWorkers: isOnline ? prev.onlineWorkers + 1 : prev.onlineWorkers - 1
    }));

    setRealtimeData(prev => ({
      ...prev,
      workerLocations: prev.workerLocations.map(worker => 
        worker.id === workerId 
          ? { ...worker, isOnline, lastSeen: new Date() }
          : worker
      ),
      recentActivities: [
        {
          id: Date.now(),
          type: 'worker_status',
          message: `Thợ ${data.workerName} ${isOnline ? 'online' : 'offline'}`,
          timestamp: new Date(),
          priority: 'normal'
        },
        ...prev.recentActivities.slice(0, 9)
      ]
    }));
  };

  const handleBookingStatusChange = (data) => {
    const { bookingId, newStatus, oldStatus } = data;
    
    setRealtimeData(prev => ({
      ...prev,
      activeBookings: prev.activeBookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: newStatus }
          : booking
      ),
      recentActivities: [
        {
          id: Date.now(),
          type: 'status_change',
          message: `Đơn hàng ${bookingId.slice(-6)} ${oldStatus} → ${newStatus}`,
          timestamp: new Date(),
          priority: newStatus === 'completed' ? 'success' : 'normal'
        },
        ...prev.recentActivities.slice(0, 9)
      ]
    }));

    // Update stats based on status change
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      setStats(prev => ({
        ...prev,
        pendingBookings: prev.pendingBookings - 1
      }));
    }
  };

  const handleWorkerLocationUpdate = (data) => {
    const { workerId, location } = data;
    
    setRealtimeData(prev => ({
      ...prev,
      workerLocations: prev.workerLocations.map(worker =>
        worker.id === workerId
          ? { ...worker, location, lastLocationUpdate: new Date() }
          : worker
      )
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      assigned: '#2196f3',
      confirmed: '#4caf50',
      in_progress: '#9c27b0',
      completed: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#666';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#f44336',
      normal: '#2196f3',
      success: '#4caf50'
    };
    return colors[priority] || '#666';
  };

  return (
    <div className="operations-dashboard">
      <div className="dashboard-header">
        <h1>Operations Dashboard</h1>
        <div className="last-updated">
          Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{stats.totalBookings}</div>
            <div className="metric-label">Tổng đơn hàng</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👨‍🔧</div>
          <div className="metric-content">
            <div className="metric-value">{stats.onlineWorkers}/{stats.activeWorkers}</div>
            <div className="metric-label">Thợ trực tuyến</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <div className="metric-value">{stats.pendingBookings}</div>
            <div className="metric-label">Đơn chờ xử lý</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">{(stats.revenue / 1000000).toFixed(1)}M</div>
            <div className="metric-label">Doanh thu (VNĐ)</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Active Bookings */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Đơn hàng đang hoạt động</h2>
            <div className="section-count">{realtimeData.activeBookings.length}</div>
          </div>
          
          <div className="bookings-list">
            {realtimeData.activeBookings.map(booking => (
              <div key={booking.id} className="booking-item">
                <div className="booking-info">
                  <div className="booking-id">#{booking.id.slice(-6)}</div>
                  <div className="booking-customer">{booking.customerName}</div>
                  <div className="booking-service">{booking.serviceType}</div>
                  <div className="booking-location">{booking.district}</div>
                </div>
                
                <div className="booking-status">
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {booking.status}
                  </div>
                  <div className="booking-time">
                    {new Date(booking.createdAt).toLocaleTimeString('vi-VN')}
                  </div>
                </div>

                <div className="booking-worker">
                  {booking.workerName ? (
                    <div className="worker-assigned">
                      <div className="worker-name">{booking.workerName}</div>
                      <div className="worker-phone">{booking.workerPhone}</div>
                    </div>
                  ) : (
                    <div className="no-worker">Chưa có thợ</div>
                  )}
                </div>

                <div className="booking-actions">
                  <button 
                    className="btn-small btn-primary"
                    onClick={() => window.open(`/admin/booking/${booking.id}`, '_blank')}
                  >
                    Chi tiết
                  </button>
                  {!booking.workerName && (
                    <button 
                      className="btn-small btn-warning"
                      onClick={() => {/* Manual assignment */}}
                    >
                      Chỉ định thợ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Locations Map */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Vị trí thợ trực tuyến</h2>
            <div className="section-count">{realtimeData.workerLocations.length}</div>
          </div>
          
          <div className="workers-map">
            {/* This would integrate with Google Maps to show worker locations */}
            <div className="map-placeholder">
              <div className="map-info">
                <h3>🗺️ Bản đồ thợ trực tuyến</h3>
                <p>Tích hợp Google Maps sẽ hiển thị vị trí real-time của {realtimeData.workerLocations.length} thợ</p>
              </div>
              
              <div className="workers-list">
                {realtimeData.workerLocations.map(worker => (
                  <div key={worker.id} className="worker-location-item">
                    <div className={`worker-status ${worker.isOnline ? 'online' : 'offline'}`}>
                      {worker.isOnline ? '🟢' : '🔴'}
                    </div>
                    <div className="worker-info">
                      <div className="worker-name">{worker.name}</div>
                      <div className="worker-district">{worker.location?.district}</div>
                      <div className="worker-last-seen">
                        {worker.lastLocationUpdate ? 
                          `Cập nhật: ${new Date(worker.lastLocationUpdate).toLocaleTimeString('vi-VN')}` :
                          'Chưa có vị trí'
                        }
                      </div>
                    </div>
                    <div className="worker-stats">
                      <div className="stat">Jobs: {worker.activeJobs || 0}</div>
                      <div className="stat">Rating: ⭐{worker.rating || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Hoạt động gần đây</h2>
            <button className="btn-small btn-secondary">Xem tất cả</button>
          </div>
          
          <div className="activities-list">
            {realtimeData.recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div 
                  className="activity-priority"
                  style={{ backgroundColor: getPriorityColor(activity.priority) }}
                ></div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-time">
                    {new Date(activity.timestamp).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
                <div className="activity-type">{activity.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="emergency-panel">
        <button className="btn-emergency">🚨 KHẨN CẤP</button>
        <button className="btn-broadcast">📢 Thông báo toàn hệ thống</button>
        <button className="btn-maintenance">🔧 Chế độ bảo trì</button>
      </div>
    </div>
  );
};

export default OperationsDashboard;