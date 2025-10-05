import React, { useState, useEffect } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    avatar: null,
    stats: {
      totalBookings: 0,
      completedBookings: 0,
      totalSpent: 0,
      loyaltyLevel: 'normal',
      serviceStats: {}
    }
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) {
      navigate('/login')
      return
    }
    fetchProfile()
  }, [navigate])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProfile({
        name: response.data.name || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        avatar: response.data.avatar || null,
        stats: response.data.stats || {
          totalBookings: 0,
          completedBookings: 0,
          totalSpent: 0,
          loyaltyLevel: 'normal',
          serviceStats: {}
        }
      })
      setLoading(false)
    } catch (error) {
      setMsg('Lỗi khi tải thông tin: ' + (error.response?.data?.message || error.message))
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setMsg(null)
    
    try {
      const token = localStorage.getItem('token')
      await api.put('/api/users/me', {
        name: profile.name,
        phone: profile.phone,
        address: profile.address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.name = profile.name
      localStorage.setItem('user', JSON.stringify(user))
      
      setMsg('Cập nhật thông tin thành công!')
      setUpdating(false)
    } catch (error) {
      setMsg('Lỗi cập nhật: ' + (error.response?.data?.message || error.message))
      setUpdating(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMsg('Mật khẩu xác nhận không khớp')
      return
    }
    
    if (passwords.newPassword.length < 6) {
      setMsg('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    
    setUpdating(true)
    
    try {
      const token = localStorage.getItem('token')
      await api.put('/api/users/me', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMsg('Đổi mật khẩu thành công!')
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordChange(false)
      setUpdating(false)
    } catch (error) {
      setMsg('Lỗi đổi mật khẩu: ' + (error.response?.data?.message || error.message))
      setUpdating(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setMsg('Chỉ chấp nhận file ảnh JPEG, PNG, WebP')
        return
      }
      
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMsg('Kích thước ảnh không được vượt quá 2MB')
        return
      }
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      // Upload immediately
      uploadAvatar(file)
    }
  }

  const uploadAvatar = async (file) => {
    setUploadingAvatar(true)
    setMsg(null)
    
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      
      console.log('Uploading avatar:', file.name, file.size)
      
      const response = await api.post('/api/users/avatar', formData)
      
      console.log('Upload response:', response.data)
      
      setProfile(prev => ({ ...prev, avatar: response.data.user.avatar }))
      setAvatarPreview(null)
      setMsg('Cập nhật ảnh đại diện thành công!')
    } catch (error) {
      console.error('Upload error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      setMsg('Lỗi upload ảnh: ' + (error.response?.data?.message || error.message))
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const deleteAvatar = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh đại diện?')) return
    
    setUploadingAvatar(true)
    setMsg(null)
    
    try {
      const token = localStorage.getItem('token')
      const response = await api.delete('/api/users/avatar', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setProfile(prev => ({ ...prev, avatar: null }))
      setMsg('Đã xóa ảnh đại diện!')
    } catch (error) {
      setMsg('Lỗi xóa ảnh: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div>
      <h2>Thông tin cá nhân</h2>
      
      {/* Avatar Section */}
      <div className="card" style={{ marginBottom: '20px', textAlign: 'center', padding: '20px' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '15px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--primary)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            position: 'relative'
          }}>
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : profile.avatar ? (
              <img 
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.avatar}`}
                alt="Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onLoad={() => console.log('Avatar loaded successfully')}
                onError={(e) => {
                  console.error('Avatar load error:', e)
                  console.error('Avatar URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.avatar}`)
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div style={{
              width: '100%', 
              height: '100%', 
              display: profile.avatar && !avatarPreview ? 'none' : 'flex',
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '48px',
              color: '#ccc'
            }}>
              👤
            </div>
          </div>
          
          {uploadingAvatar && (
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px'
            }}>
              Đang tải...
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <label style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            border: 'none'
          }}>
            {profile.avatar ? 'Đổi ảnh' : 'Thêm ảnh'}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              disabled={uploadingAvatar}
            />
          </label>
          
          {profile.avatar && (
            <button
              onClick={deleteAvatar}
              disabled={uploadingAvatar}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                border: 'none'
              }}
            >
              Xóa ảnh
            </button>
          )}
        </div>
        
        <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--muted)' }}>
          Định dạng: JPEG, PNG, WebP. Tối đa 2MB
        </p>
      </div>
      
      <div className="profile-layout">
        {/* Left Column - Statistics */}
        <div className="profile-stats">
          {profile.stats && (
            <>
              {/* Loyalty Level Display */}
              <div className="card" style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3>Hạng khách hàng</h3>
                <div style={{ padding: '20px' }}>
                  {(() => {
                    const badges = {
                      'normal': { color: '#6c757d', text: 'Khách hàng thường', icon: '👤' },
                      'vip': { color: '#ffd700', text: 'Khách hàng VIP', icon: '⭐' }
                    }
                    const badge = badges[profile.stats?.loyaltyLevel || 'normal'] || badges.normal
                    
                    return (
                      <div>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                          {badge.icon}
                        </div>
                        <span style={{
                          backgroundColor: badge.color,
                          color: 'white',
                          padding: '8px 20px',
                          borderRadius: '20px',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}>
                          {badge.text}
                        </span>
                        <p style={{ 
                          marginTop: '16px', 
                          fontSize: '14px', 
                          color: 'var(--muted)' 
                        }}>
                          Sử dụng {profile.stats?.totalBookings || 0} dịch vụ
                        </p>
                        {(profile.stats?.loyaltyLevel || 'normal') === 'normal' && (
                          <p style={{ 
                            marginTop: '8px', 
                            fontSize: '12px', 
                            color: '#ffd700',
                            fontStyle: 'italic'
                          }}>
                            💡 Sử dụng từ 3 dịch vụ để trở thành VIP và nhận ưu đãi 10%
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Stats Summary Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px', 
                marginBottom: '20px' 
              }}>
                <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {profile.stats?.totalBookings || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Tổng đơn</div>
                </div>
                
                <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                    {profile.stats?.completedBookings || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Hoàn thành</div>
                </div>
              </div>

              {/* Total Spent */}
              <div className="card" style={{ textAlign: 'center', padding: '20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {(profile.stats?.totalSpent || 0).toLocaleString('vi-VN')} ₫
                </div>
                <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Tổng chi tiêu</div>
              </div>

              {/* Top Services */}
              {profile.stats?.serviceStats && Object.keys(profile.stats.serviceStats).length > 0 && (
                <div className="card" style={{ marginBottom: '20px' }}>
                  <h4>Dịch vụ thường dùng</h4>
                  <div style={{ marginTop: '12px' }}>
                    {Object.entries(profile.stats?.serviceStats || {})
                      .sort(([,a], [,b]) => b.count - a.count)
                      .slice(0, 3)
                      .map(([serviceName, stats]) => (
                        <div key={serviceName} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: '1px solid var(--border)'
                        }}>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '14px' }}>{serviceName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {(stats?.totalSpent || 0).toLocaleString('vi-VN')} ₫
                            </div>
                          </div>
                          <div style={{ 
                            padding: '2px 8px', 
                            backgroundColor: 'var(--primary)', 
                            color: 'white', 
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {stats.count}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Right Column - Profile Form */}
        <div className="profile-form">
          {/* Profile Information Form */}
          <div className="profile-form-card">
            <form onSubmit={handleProfileSubmit} className="form">
            <h3>Thông tin cơ bản</h3>
            
            <label>Họ tên *</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            
            <label>Số điện thoại *</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
            
            <label>Địa chỉ</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Nhập địa chỉ của bạn"
            />
            
            <button type="submit" disabled={updating}>
              {updating ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            </button>
          </form>
          </div>

          {/* Password Change Section */}
          <div style={{ marginTop: '24px' }}>
            <button 
              className="btn" 
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              style={{ marginBottom: '16px' }}
            >
              {showPasswordChange ? 'Hủy đổi mật khẩu' : 'Đổi mật khẩu'}
            </button>
            
            {showPasswordChange && (
              <div className="profile-form-card">
                <form onSubmit={handlePasswordSubmit} className="form">
                <h3>Đổi mật khẩu</h3>
                
                <label>Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
                
                <label>Mật khẩu mới *</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  minLength={6}
                />
                
                <label>Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
                
                <button type="submit" disabled={updating}>
                  {updating ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {msg && <p style={{ 
        padding: '12px 16px', 
        borderRadius: '8px', 
        backgroundColor: msg.includes('thành công') ? '#d1fae5' : '#fee2e2',
        color: msg.includes('thành công') ? '#065f46' : '#dc2626',
        marginTop: '20px',
        border: `1px solid ${msg.includes('thành công') ? '#10b981' : '#ef4444'}`,
        fontSize: '14px',
        fontWeight: '500'
      }}>{msg}</p>}
    </div>
  )
}