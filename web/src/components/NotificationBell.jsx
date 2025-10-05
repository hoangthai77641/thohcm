import React, { useState, useEffect } from 'react'
import api from '../api'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, []) // Chỉ chạy một lần khi component mount

  const loadNotifications = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await api.get('/api/notifications/user', {
        params: { limit: 10, unreadOnly: false }
      })
      
      const notifs = response.data.notifications || []
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
      // Nếu lỗi 401, không gọi lại API để tránh infinite loop
      if (error.response?.status === 401) {
        setNotifications([])
        setUnreadCount(0)
      }
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`)
      
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/user/read-all')
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`)
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      setUnreadCount(prev => {
        const notification = notifications.find(n => n._id === notificationId)
        return notification && !notification.read ? prev - 1 : prev
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  if (!user) return null

  return (
    <div className="notification-bell">
      <button 
        className="bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="bell-icon">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read"
                onClick={markAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && (
              <div className="notification-loading">Đang tải...</div>
            )}
            
            {!loading && notifications.length === 0 && (
              <div className="notification-empty">
                <p>Chưa có thông báo nào</p>
              </div>
            )}

            {!loading && notifications.map(notification => (
              <div 
                key={notification._id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div className="notification-content">
                  <h4 className="notification-title">{notification.title}</h4>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </span>
                    {notification.sentBy && (
                      <span className="notification-sender">
                        từ {notification.sentBy.name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="notification-actions">
                  {!notification.read && (
                    <button 
                      className="mark-read-btn"
                      onClick={() => markAsRead(notification._id)}
                      title="Đánh dấu đã đọc"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    className="delete-btn"
                    onClick={() => deleteNotification(notification._id)}
                    title="Xóa thông báo"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => setShowDropdown(false)}
              >
                Xem tất cả
              </button>
            </div>
          )}
        </div>
      )}

      {showDropdown && (
        <div 
          className="dropdown-backdrop"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}