import React, { useState, useEffect } from 'react'
import api from '../api'
import NotificationManager from '../components/NotificationManager'

export default function BannerManagement() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'notification',
    isActive: true,
    image: null
  })
  const [activeTab, setActiveTab] = useState('banners')

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      loadBanners()
    }
  }, [isAdmin])

  const loadBanners = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Không có token xác thực')
      }
      
      const response = await api.get('/api/banners', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('API response:', response.data) // Debug log
      
      // Xử lý response data
      if (Array.isArray(response.data)) {
        setBanners(response.data)
      } else if (response.data && Array.isArray(response.data.items)) {
        setBanners(response.data.items)
      } else {
        setBanners([])
      }
    } catch (error) {
      console.error('Error loading banners:', error)
      setError(error.response?.data?.message || error.message || 'Không thể tải danh sách banner')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vui lòng đăng nhập lại')
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('content', formData.content)
      formDataToSend.append('type', formData.type)
      formDataToSend.append('isActive', formData.isActive)
      
      if (formData.image) {
        formDataToSend.append('image', formData.image)
        console.log('Uploading file:', formData.image.name, formData.image.type, formData.image.size)
      }

      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }

      if (editingBanner) {
        const response = await api.put(`/api/banners/${editingBanner._id}`, formDataToSend, config)
        console.log('Update response:', response.data)
        alert('Cập nhật banner thành công!')
      } else {
        if (!formData.image) {
          alert('Vui lòng chọn ảnh cho banner')
          return
        }
        const response = await api.post('/api/banners', formDataToSend, config)
        console.log('Create response:', response.data)
        alert('Tạo banner thành công!')
      }

      setShowForm(false)
      setEditingBanner(null)
      setFormData({
        title: '',
        content: '',
        type: 'notification',
        isActive: true,
        image: null
      })
      loadBanners()
    } catch (error) {
      console.error('Error saving banner:', error)
      alert('Lỗi khi lưu banner: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title || '',
      content: banner.content || '',
      type: banner.type || 'notification',
      isActive: banner.isActive,
      image: null
    })
    setShowForm(true)
  }

  const handleDelete = async (bannerId) => {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return
    
    try {
      await api.delete(`/api/banners/${bannerId}`)
      alert('Xóa banner thành công!')
      loadBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('Lỗi khi xóa banner: ' + (error.response?.data?.message || error.message))
    }
  }

  const toggleActive = async (bannerId, currentStatus) => {
    try {
      await api.patch(`/api/banners/${bannerId}/toggle`)
      loadBanners()
    } catch (error) {
      console.error('Error toggling banner status:', error)
      alert('Lỗi khi thay đổi trạng thái: ' + (error.response?.data?.message || error.message))
    }
  }

  if (!isAdmin) {
    return <div>Bạn không có quyền truy cập trang này.</div>
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  return (
    <div className="banner-management">
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', 
          borderRadius: '8px', marginBottom: '20px', border: '1px solid #fecaca'
        }}>
          ❌ {error}
        </div>
      )}
      
      <div className="page-header">
        <h1>Quản lý Banner & Thông báo</h1>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'banners' ? 'active' : ''}`}
            onClick={() => setActiveTab('banners')}
          >
            🖼️ Quản lý Banner
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            📢 Gửi Thông báo
          </button>
        </div>
        
        {activeTab === 'banners' && (
          <button 
            className="btn primary"
            onClick={() => {
              setShowForm(true)
              setEditingBanner(null)
              setFormData({
                title: '',
                content: '',
                type: 'notification',
                isActive: true,
                image: null
              })
            }}
          >
            + Thêm Banner
          </button>
        )}
      </div>

      {/* Banner Management Tab */}
      {activeTab === 'banners' && (
        <>
          {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="banner-form">
              <div className="form-group">
                <label>Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="Nhập tiêu đề banner"
                />
              </div>

              <div className="form-group">
                <label>Nội dung</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Nhập nội dung chi tiết"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Loại</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="notification">Thông báo</option>
                  <option value="promotion">Khuyến mãi</option>
                  <option value="blog">Blog</option>
                  <option value="advertisement">Quảng cáo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hình ảnh</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                />
                {editingBanner && editingBanner.imageUrl && (
                  <div className="current-image">
                    <p>Hình ảnh hiện tại:</p>
                    <img 
                      src={`http://localhost:5000${editingBanner.imageUrl}`} 
                      alt="Current banner"
                      style={{maxWidth: '200px', height: 'auto'}}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Hiển thị banner
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn outline" onClick={() => setShowForm(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn primary">
                  {editingBanner ? 'Cập nhật' : 'Tạo Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="banners-list">
        {banners.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có banner nào. Hãy tạo banner đầu tiên!</p>
          </div>
        ) : (
          banners.map(banner => (
            <div key={banner._id} className={`banner-item ${!banner.isActive ? 'inactive' : ''}`}>
              {banner.imageUrl && (
                <div className="banner-image">
                  <img 
                    src={`http://localhost:5000${banner.imageUrl}`}
                    alt={banner.title}
                  />
                </div>
              )}
              
              <div className="banner-content">
                <div className="banner-info">
                  <h3>{banner.title}</h3>
                  {banner.content && <p>{banner.content}</p>}
                  <div className="banner-meta">
                    <span className={`type-badge type-${banner.type}`}>
                      {banner.type === 'notification' && 'Thông báo'}
                      {banner.type === 'promotion' && 'Khuyến mãi'}
                      {banner.type === 'blog' && 'Blog'}
                      {banner.type === 'advertisement' && 'Quảng cáo'}
                    </span>
                    <span className="date">
                      {new Date(banner.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                
                <div className="banner-actions">
                  <button
                    className={`btn ${banner.isActive ? 'outline' : 'primary'}`}
                    onClick={() => toggleActive(banner._id, banner.isActive)}
                  >
                    {banner.isActive ? 'Ẩn' : 'Hiện'}
                  </button>
                  <button
                    className="btn outline"
                    onClick={() => handleEdit(banner)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => handleDelete(banner._id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}

      {/* Notification Management Tab */}
      {activeTab === 'notifications' && (
        <div className="notifications-tab">
          <NotificationManager />
        </div>
      )}
    </div>
  )
}