import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const NotificationSystem = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Connect to socket
    const newSocket = io('http://localhost:5000', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification service');
      // Join user's room for targeted notifications
      const userId = user._id || user.id;
      newSocket.emit('join', userId);
      
      // If admin, also join admin room
      if (user.role === 'admin') {
        newSocket.emit('join_admin', userId);
      }
    });

    // Listen for notifications
    newSocket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep only 20 latest
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if supported
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.type
        });
      }
      
      // Play notification sound (optional)
      playNotificationSound();
    });

    // Listen for other notification types
    newSocket.on('worker_assigned', (data) => {
      addNotification({
        type: 'success',
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
        data: data.data
      });
    });

    newSocket.on('booking_status_change', (data) => {
      addNotification({
        type: 'info',
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
        data: data.data
      });
    });

    newSocket.on('system_announcement', (data) => {
      addNotification({
        type: data.level || 'info',
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
        data: data.data,
        priority: 'high'
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);
    setUnreadCount(prev => prev + 1);
    playNotificationSound();
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound'));
    } catch (e) {
      console.log('Notification sound not available');
    }
  };

  const markAsRead = (index) => {
    setNotifications(prev => 
      prev.map((notif, i) => 
        i === index ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'promotion': return '🎉';
      case 'system': return '🔧';
      case 'booking': return '📅';
      case 'payment': return '💳';
      case 'emergency': return '🚨';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'promotion': return '#a855f7';
      case 'system': return '#64748b';
      case 'booking': return '#3b82f6';
      case 'payment': return '#10b981';
      case 'emergency': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Notification Bell */}
      <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read">
                  Đánh dấu đã đọc
                </button>
              )}
              <button onClick={clearNotifications} className="clear-all">
                Xóa tất cả
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span>📭</span>
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(index)}
                >
                  <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">{formatTime(notification.timestamp)}</span>
                  </div>
                  {notification.priority === 'urgent' && (
                    <div className="urgent-indicator">🚨</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div 
          className="notification-overlay" 
          onClick={() => setShowNotifications(false)}
        />
      )}

      <style>{`
        .notification-bell {
          position: relative;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: background-color 0.3s ease;
        }

        .notification-bell:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .bell-icon {
          font-size: 20px;
          display: block;
        }

        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #ef4444;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: bold;
          min-width: 18px;
          text-align: center;
        }

        .notification-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 400px;
          max-height: 500px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
        }

        .notification-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }

        .notification-actions {
          display: flex;
          gap: 8px;
        }

        .mark-all-read, .clear-all {
          background: none;
          border: none;
          color: var(--muted);
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .mark-all-read:hover, .clear-all:hover {
          background: var(--hover-bg);
          color: var(--text);
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .no-notifications {
          padding: 40px 20px;
          text-align: center;
          color: var(--muted);
        }

        .no-notifications span {
          font-size: 40px;
          display: block;
          margin-bottom: 12px;
        }

        .no-notifications p {
          margin: 0;
          font-size: 14px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .notification-item:hover {
          background: var(--hover-bg);
        }

        .notification-item.unread {
          background: var(--primary-bg);
          border-left: 3px solid var(--primary);
        }

        .notification-icon {
          font-size: 18px;
          margin-right: 12px;
          margin-top: 2px;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          line-height: 1.3;
        }

        .notification-message {
          margin: 0 0 6px 0;
          font-size: 13px;
          color: var(--muted);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notification-time {
          font-size: 11px;
          color: var(--muted);
        }

        .urgent-indicator {
          margin-left: 8px;
          font-size: 16px;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .notification-dropdown {
            width: 320px;
            max-width: calc(100vw - 40px);
          }
        }
      `}</style>
    </>
  );
};

export default NotificationSystem;