import React, { useState, useEffect } from 'react';
import api from '../api';

const NotificationManager = () => {
  const [notificationForm, setNotificationForm] = useState({
    targetType: 'specific',
    userIds: [],
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    data: {}
  });

  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [activeTab, setActiveTab] = useState('send');

  // Load users data
  useEffect(() => {
    loadUsersData();
  }, []);

  const loadUsersData = async () => {
    try {
      const [usersRes, customersRes, workersRes] = await Promise.all([
        api.get('/api/users', { params: { limit: 100 } }),
        api.get('/api/users/customers'),
        api.get('/api/users', { params: { role: 'worker', limit: 100 } })
      ]);

      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : customersRes.data?.items || []);
      setWorkers(Array.isArray(workersRes.data) ? workersRes.data : workersRes.data?.items || []);
    } catch (error) {
      console.error('Error loading users data:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setNotificationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    setNotificationForm(prev => ({
      ...prev,
      userIds: [userId]
    }));
  };

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      alert('Vui lòng nhập tiêu đề và nội dung thông báo');
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      let endpoint = '';
      let payload = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        priority: notificationForm.priority,
        data: notificationForm.data
      };

      switch (notificationForm.targetType) {
        case 'specific':
          if (!selectedUser) {
            alert('Vui lòng chọn người dùng');
            return;
          }
          endpoint = '/api/notifications/send/user';
          payload.userId = selectedUser;
          break;
        case 'customers':
          endpoint = '/api/notifications/send/customers';
          break;
        case 'workers':
          endpoint = '/api/notifications/send/workers';
          break;
        case 'all':
          endpoint = '/api/notifications/send/all-users';
          break;
        default:
          alert('Loại người nhận không hợp lệ');
          return;
      }

      const response = await api.post(endpoint, payload);
      setSendResult({
        success: true,
        message: response.data.message,
        data: response.data
      });

      // Reset form
      setNotificationForm({
        targetType: 'specific',
        userIds: [],
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
        data: {}
      });
      setSelectedUser('');

    } catch (error) {
      setSendResult({
        success: false,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo'
      });
    } finally {
      setSending(false);
    }
  };

  const notificationTypes = [
    { value: 'info', label: 'Thông tin', color: '#3498db' },
    { value: 'success', label: 'Thành công', color: '#2ecc71' },
    { value: 'warning', label: 'Cảnh báo', color: '#f39c12' },
    { value: 'error', label: 'Lỗi', color: '#e74c3c' },
    { value: 'promotion', label: 'Khuyến mãi', color: '#9b59b6' },
    { value: 'system', label: 'Hệ thống', color: '#34495e' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Thấp' },
    { value: 'normal', label: 'Bình thường' },
    { value: 'high', label: 'Cao' },
    { value: 'urgent', label: 'Khẩn cấp' }
  ];

  return (
    <div className="notification-manager">
      <div className="notification-tabs">
        <button 
          className={`tab-button ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          Gửi thông báo
        </button>
        <button 
          className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Mẫu thông báo
        </button>
      </div>

      {activeTab === 'send' && (
        <div className="send-notification-form">
          <h3>Gửi thông báo mới</h3>

          {/* Target Type Selection */}
          <div className="form-group">
            <label>Gửi đến:</label>
            <div className="target-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="targetType"
                  value="specific"
                  checked={notificationForm.targetType === 'specific'}
                  onChange={(e) => handleInputChange('targetType', e.target.value)}
                />
                <span>Người dùng cụ thể</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="targetType"
                  value="customers"
                  checked={notificationForm.targetType === 'customers'}
                  onChange={(e) => handleInputChange('targetType', e.target.value)}
                />
                <span>Tất cả khách hàng ({customers.length})</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="targetType"
                  value="workers"
                  checked={notificationForm.targetType === 'workers'}
                  onChange={(e) => handleInputChange('targetType', e.target.value)}
                />
                <span>Tất cả thợ ({workers.length})</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="targetType"
                  value="all"
                  checked={notificationForm.targetType === 'all'}
                  onChange={(e) => handleInputChange('targetType', e.target.value)}
                />
                <span>Tất cả người dùng ({users.length})</span>
              </label>
            </div>
          </div>

          {/* User Selection for specific target */}
          {notificationForm.targetType === 'specific' && (
            <div className="form-group">
              <label>Chọn người dùng:</label>
              <select
                value={selectedUser}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="user-select"
              >
                <option value="">-- Chọn người dùng --</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notification Content */}
          <div className="form-group">
            <label>Tiêu đề:</label>
            <input
              type="text"
              value={notificationForm.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Nhập tiêu đề thông báo"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Nội dung:</label>
            <textarea
              value={notificationForm.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Nhập nội dung thông báo"
              rows={4}
              maxLength={1000}
            />
          </div>

          {/* Type and Priority */}
          <div className="form-row">
            <div className="form-group">
              <label>Loại thông báo:</label>
              <select
                value={notificationForm.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mức độ ưu tiên:</label>
              <select
                value={notificationForm.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                {priorityLevels.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Send Button */}
          <div className="form-actions">
            <button
              onClick={sendNotification}
              disabled={sending}
              className="send-button"
            >
              {sending ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>

          {/* Send Result */}
          {sendResult && (
            <div className={`send-result ${sendResult.success ? 'success' : 'error'}`}>
              <h4>{sendResult.success ? '✅ Thành công' : '❌ Thất bại'}</h4>
              <p>{sendResult.message}</p>
              {sendResult.success && sendResult.data && (
                <div className="result-details">
                  <p>Đã gửi đến: {sendResult.data.recipients} người</p>
                  {sendResult.data.breakdown && (
                    <div className="breakdown">
                      <span>Khách hàng: {sendResult.data.breakdown.customers}</span>
                      <span>Thợ: {sendResult.data.breakdown.workers}</span>
                      <span>Admin: {sendResult.data.breakdown.admins}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="notification-templates">
          <h3>Mẫu thông báo</h3>
          <div className="templates-grid">
            <div className="template-card" onClick={() => {
              setActiveTab('send');
              setNotificationForm({
                ...notificationForm,
                title: 'Khuyến mãi đặc biệt',
                message: 'Giảm giá 20% cho tất cả dịch vụ sửa chữa điện. Có hiệu lực từ ngày hôm nay đến hết tuần.',
                type: 'promotion',
                priority: 'high'
              });
            }}>
              <h4>🎉 Khuyến mãi</h4>
              <p>Thông báo khuyến mãi cho khách hàng</p>
            </div>

            <div className="template-card" onClick={() => {
              setActiveTab('send');
              setNotificationForm({
                ...notificationForm,
                title: 'Thông báo bảo trì hệ thống',
                message: 'Hệ thống sẽ được bảo trì từ 2:00 - 4:00 sáng ngày mai. Quý khách vui lòng thông cảm.',
                type: 'system',
                priority: 'normal'
              });
            }}>
              <h4>🔧 Bảo trì</h4>
              <p>Thông báo bảo trì hệ thống</p>
            </div>

            <div className="template-card" onClick={() => {
              setActiveTab('send');
              setNotificationForm({
                ...notificationForm,
                title: 'Cập nhật chính sách',
                message: 'Chúng tôi đã cập nhật chính sách bảo mật và điều khoản sử dụng. Vui lòng xem chi tiết.',
                type: 'info',
                priority: 'normal'
              });
            }}>
              <h4>📋 Chính sách</h4>
              <p>Thông báo cập nhật chính sách</p>
            </div>

            <div className="template-card" onClick={() => {
              setActiveTab('send');
              setNotificationForm({
                ...notificationForm,
                title: 'Cảnh báo thời tiết',
                message: 'Dự báo có mưa lớn. Các thợ vui lòng chú ý an toàn khi di chuyển.',
                type: 'warning',
                priority: 'high'
              });
            }}>
              <h4>⚠️ Cảnh báo</h4>
              <p>Thông báo cảnh báo quan trọng</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .notification-manager {
          background: var(--primary-bg, white);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          color: var(--text, #333);
        }

        .notification-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border, #e0e0e0);
        }

        .tab-button {
          padding: 12px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 500;
          color: var(--muted, #666);
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .tab-button.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
        }

        .send-notification-form h3 {
          margin-bottom: 24px;
          color: var(--text, #333);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text, #333);
        }

        .target-options {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .radio-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text, #333);
        }

        .radio-option input[type="radio"] {
          margin: 0;
        }

        .user-select, select, input, textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border, #ddd);
          border-radius: 6px;
          font-size: 14px;
          background: var(--primary-bg, white);
          color: var(--text, #333);
        }

        .user-select:focus, select:focus, input:focus, textarea:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-actions {
          margin-top: 24px;
        }

        .send-button {
          background: #2196F3;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.3s ease;
        }

        .send-button:hover:not(:disabled) {
          background: #1976D2;
        }

        .send-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .send-result {
          margin-top: 20px;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid;
        }

        .send-result.success {
          background: var(--primary-bg, #f0f9ff);
          border-left-color: #2ecc71;
          color: #27ae60;
        }

        .send-result.error {
          background: var(--primary-bg, #fef2f2);
          border-left-color: #e74c3c;
          color: #c0392b;
        }

        .result-details {
          margin-top: 12px;
          font-size: 14px;
          color: var(--text, #333);
        }

        .breakdown {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }

        .breakdown span {
          background: rgba(33, 150, 243, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: var(--text, #333);
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .template-card {
          padding: 20px;
          border: 1px solid var(--border, #e0e0e0);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: var(--primary-bg, white);
        }

        .template-card:hover {
          border-color: #2196F3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          background: var(--hover-bg, #f8fafc);
        }

        .template-card h4 {
          margin: 0 0 8px 0;
          color: var(--text, #333);
        }

        .template-card p {
          margin: 0;
          color: var(--muted, #666);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .target-options {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationManager;