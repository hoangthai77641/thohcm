import React, { useState, useEffect } from 'react';
import api from '../api';

const NotificationTest = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/users', { params: { limit: 10 } });
      const usersData = Array.isArray(response.data) ? response.data : response.data?.items || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const sendTestNotification = async (type) => {
    setLoading(true);
    const timestamp = new Date().toLocaleString();
    
    try {
      let endpoint = '';
      let payload = {
        title: '',
        message: '',
        type: 'info',
        priority: 'normal'
      };

      switch (type) {
        case 'specific':
          if (users.length === 0) {
            throw new Error('Không có user để test');
          }
          endpoint = '/api/notifications/send/user';
          payload = {
            userId: users[0]._id,
            title: '🎯 Test - Thông báo cá nhân',
            message: `Đây là thông báo test gửi đến ${users[0].name} lúc ${timestamp}`,
            type: 'info',
            priority: 'normal'
          };
          break;

        case 'customers':
          endpoint = '/api/notifications/send/customers';
          payload = {
            title: '🛒 Test - Thông báo khách hàng',
            message: `Thông báo test cho tất cả khách hàng - ${timestamp}`,
            type: 'promotion',
            priority: 'high'
          };
          break;

        case 'workers':
          endpoint = '/api/notifications/send/workers';
          payload = {
            title: '🔧 Test - Thông báo thợ',
            message: `Thông báo test cho tất cả thợ - ${timestamp}`,
            type: 'warning',
            priority: 'high'
          };
          break;

        case 'all':
          endpoint = '/api/notifications/send/all-users';
          payload = {
            title: '📢 Test - Thông báo toàn hệ thống',
            message: `Thông báo test cho tất cả người dùng - ${timestamp}`,
            type: 'system',
            priority: 'normal'
          };
          break;

        default:
          throw new Error('Invalid notification type');
      }

      const response = await api.post(endpoint, payload);
      
      setResults(prev => [{
        type,
        success: true,
        message: response.data.message,
        recipients: response.data.recipients,
        breakdown: response.data.breakdown,
        timestamp
      }, ...prev]);

    } catch (error) {
      setResults(prev => [{
        type,
        success: false,
        message: error.response?.data?.message || error.message,
        timestamp
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-test">
      <div className="test-header">
        <h2>🧪 Test Hệ thống Thông báo</h2>
        <p>Trang này cho phép admin test các tính năng gửi thông báo</p>
      </div>

      <div className="test-actions">
        <div className="action-group">
          <h3>Gửi thông báo test</h3>
          <div className="button-grid">
            <button 
              onClick={() => sendTestNotification('specific')}
              disabled={loading || users.length === 0}
              className="test-btn specific"
            >
              🎯 Gửi đến 1 User
              {users.length > 0 && <small>({users[0]?.name})</small>}
            </button>

            <button 
              onClick={() => sendTestNotification('customers')}
              disabled={loading}
              className="test-btn customers"
            >
              🛒 Gửi đến Khách hàng
            </button>

            <button 
              onClick={() => sendTestNotification('workers')}
              disabled={loading}
              className="test-btn workers"
            >
              🔧 Gửi đến Thợ
            </button>

            <button 
              onClick={() => sendTestNotification('all')}
              disabled={loading}
              className="test-btn all"
            >
              📢 Gửi đến Tất cả
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Đang gửi thông báo...</p>
        </div>
      )}

      <div className="test-results">
        <h3>Kết quả test ({results.length})</h3>
        {results.length === 0 ? (
          <div className="no-results">
            <p>Chưa có kết quả test nào</p>
          </div>
        ) : (
          <div className="results-list">
            {results.map((result, index) => (
              <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  <span className="result-type">{getTypeLabel(result.type)}</span>
                  <span className="result-status">
                    {result.success ? '✅ Thành công' : '❌ Thất bại'}
                  </span>
                  <span className="result-time">{result.timestamp}</span>
                </div>
                <div className="result-message">{result.message}</div>
                {result.success && result.recipients && (
                  <div className="result-details">
                    <strong>Đã gửi đến: {result.recipients} người</strong>
                    {result.breakdown && (
                      <div className="breakdown">
                        <span>Khách hàng: {result.breakdown.customers}</span>
                        <span>Thợ: {result.breakdown.workers}</span>
                        <span>Admin: {result.breakdown.admins}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .notification-test {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .test-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .test-header h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
        }

        .test-header p {
          margin: 0;
          opacity: 0.9;
        }

        .action-group h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .test-btn {
          padding: 16px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .test-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .test-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .test-btn.specific {
          background: #3b82f6;
          color: white;
        }

        .test-btn.customers {
          background: #10b981;
          color: white;
        }

        .test-btn.workers {
          background: #f59e0b;
          color: white;
        }

        .test-btn.all {
          background: #8b5cf6;
          color: white;
        }

        .test-btn small {
          font-size: 11px;
          opacity: 0.9;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 8px;
          margin: 20px 0;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e0e7ff;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .test-results {
          margin-top: 30px;
        }

        .test-results h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .no-results {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
          font-style: italic;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .result-item {
          padding: 16px;
          border-radius: 8px;
          border: 1px solid;
        }

        .result-item.success {
          background: #f0fdf4;
          border-color: #22c55e;
        }

        .result-item.error {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .result-type {
          background: rgba(0,0,0,0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .result-status {
          font-weight: 500;
        }

        .result-time {
          margin-left: auto;
          color: #6b7280;
          font-size: 12px;
        }

        .result-message {
          margin-bottom: 8px;
        }

        .result-details {
          font-size: 14px;
          padding-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.1);
        }

        .breakdown {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }

        .breakdown span {
          background: rgba(59, 130, 246, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .button-grid {
            grid-template-columns: 1fr;
          }
          
          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .result-time {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );

  function getTypeLabel(type) {
    switch (type) {
      case 'specific': return '🎯 User cụ thể';
      case 'customers': return '🛒 Khách hàng';
      case 'workers': return '🔧 Thợ';
      case 'all': return '📢 Tất cả';
      default: return type;
    }
  }
};

export default NotificationTest;