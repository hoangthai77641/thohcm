import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Users(){
  const navigate = useNavigate()
  const me = JSON.parse(localStorage.getItem('user')||'null')
  const isAdmin = me && me.role === 'admin'
  const apiBase = api.defaults.baseURL || ''
  const [q,setQ] = useState('')
  const [role,setRole] = useState('')
  const [status,setStatus] = useState('')
  const [page,setPage] = useState(1)
  const [limit] = useState(20)
  const [data,setData] = useState({ items: [], total:0, pages:0 })
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState(null)
  const initialWorkerForm = {
    name: '',
    phone: '',
    address: '',
    citizenId: '',
    status: 'pending',
    password: '',
  }
  const [showForm,setShowForm] = useState(false)
  const [formMode,setFormMode] = useState('create') // 'create' | 'edit'
  const [formData,setFormData] = useState(initialWorkerForm)
  const [avatarFile,setAvatarFile] = useState(null)
  const [saving,setSaving] = useState(false)
  const [selectedUser,setSelectedUser] = useState(null)
  const selectedAvatarUrl = useMemo(() => {
    if (!selectedUser?.avatar) return null
    return selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `${apiBase}${selectedUser.avatar}`
  }, [selectedUser, apiBase])


  useEffect(()=>{ if (!isAdmin) navigate('/') },[isAdmin, navigate])

  const params = useMemo(()=>({ q, role, status, page, limit }),[q, role, status, page, limit])

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true); setError(null)
    try{
      const res = await api.get('/api/users', { params })
      let payload = res.data
      if (Array.isArray(payload)) {
        payload = { items: payload, total: payload.length, page: 1, pages: 1 }
      } else if (!payload || !Array.isArray(payload.items)) {
        payload = { items: [], total: 0, page: 1, pages: 1 }
      }
      setData(payload)
    }catch(e){ setError(e.response?.data?.message || e.message) }
    finally{ setLoading(false) }
  },[isAdmin, params])

  useEffect(()=>{
    loadUsers()
  },[loadUsers])

  const openCreateForm = () => {
    setFormMode('create')
    setSelectedUser(null)
    setFormData({ ...initialWorkerForm })
    setAvatarFile(null)
    setShowForm(true)
  }

  const openEditForm = (user) => {
    setFormMode('edit')
    setSelectedUser(user)
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      citizenId: user.citizenId || '',
      status: user.status || 'pending',
      password: '',
    })
    setAvatarFile(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setAvatarFile(null)
    setFormData({ ...initialWorkerForm })
    setSelectedUser(null)
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const uploadWorkerAvatar = async (userId) => {
    if (!avatarFile) return
    const form = new FormData()
    form.append('avatar', avatarFile)
    form.append('userId', userId)
    await api.post('/api/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try{
      if (formMode === 'create' && (!formData.password || formData.password.length < 6)) {
        alert('Mật khẩu phải có ít nhất 6 ký tự')
        setSaving(false)
        return
      }
      if (formMode === 'edit' && formData.password && formData.password.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự')
        setSaving(false)
        return
      }
      if (formMode === 'create') {
        const payload = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          citizenId: formData.citizenId.trim() || undefined,
          status: formData.status,
          password: formData.password,
        }
        const res = await api.post('/api/users/workers', payload)
        const created = res.data
        if (avatarFile) {
          await uploadWorkerAvatar(created._id || created.id)
        }
      } else if (selectedUser) {
        const payload = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          citizenId: formData.citizenId.trim() || undefined,
          status: formData.status,
        }
        if (formData.password && formData.password.length >= 6) {
          payload.password = formData.password
        }
        await api.put(`/api/users/workers/${selectedUser._id}`, payload)
        if (avatarFile) {
          await uploadWorkerAvatar(selectedUser._id)
        }
      }
      await loadUsers()
      closeForm()
    }catch(err){
      alert(err.response?.data?.message || err.message)
    }finally{
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Xóa thợ ${user.name}?`)) return
    setSaving(true)
    try{
      await api.delete(`/api/users/workers/${user._id}`)
      await loadUsers()
    }catch(err){
      alert(err.response?.data?.message || err.message)
    }finally{
      setSaving(false)
    }
  }



  if (!isAdmin) return null

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Quản lý người dùng</h1>
        <div className="users-stats">
          <div className="stat-card">
            <span className="stat-number">{data.total}</span>
            <span className="stat-label">Tổng người dùng</span>
          </div>
        </div>
      </div>

      {/* Compact Toolbar */}
      <div className="users-toolbar">
        <div className="search-filters">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input 
              value={q} 
              onChange={e=>{ setQ(e.target.value); setPage(1) }} 
              placeholder="Tìm theo tên, SĐT, địa chỉ..." 
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select value={role} onChange={e=>{ setRole(e.target.value); setPage(1) }} className="filter-select">
              <option value="">Tất cả vai trò</option>
              <option value="customer">Khách hàng</option>
              <option value="worker">Thợ</option>
              <option value="admin">Admin</option>
            </select>
            <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1) }} className="filter-select">
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="active">Hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
          </div>
        </div>
        <button className="btn primary" onClick={openCreateForm}>
          + Thêm thợ
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="col-name">Name</th>
                <th className="col-phone">Phone</th>
                <th className="col-citizen">CCCD</th>
                <th className="col-role">Role</th>
                <th className="col-status">Status</th>
                <th className="col-address">Address</th>
                <th className="col-avatar">Avatar</th>
                <th className="col-created">Created</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.items || []).map(u => {
                const avatarUrl = u.avatar
                  ? (u.avatar.startsWith('http') ? u.avatar : `${apiBase}${u.avatar}`)
                  : null
                const statusClass = u.status==='active' ? 'success' : (u.status==='pending' ? 'warning' : 'danger')
                return (
                  <tr key={u._id}>
                    <td className="col-name">{u.name}</td>
                    <td className="col-phone">{u.phone}</td>
                    <td className="col-citizen">{u.citizenId || '—'}</td>
                    <td className="col-role">
                      <select
                        className="role-select"
                        value={u.role}
                        onChange={async (e)=>{
                          const val = e.target.value
                          try{
                            await api.put(`/api/users/${u._id}/role`, { role: val })
                            setData(prev=>({ ...prev, items: prev.items.map(x=> x._id===u._id ? { ...x, role: val } : x) }))
                          }catch(err){ alert(err.response?.data?.message || err.message) }
                        }}
                      >
                        <option value="customer">customer</option>
                        <option value="worker">worker</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="col-status">
                      <select
                        className={`status-select ${statusClass}`}
                        value={u.status || 'active'}
                        onChange={async (e)=>{
                          const val = e.target.value
                          try{
                            await api.put(`/api/users/${u._id}/status`, { status: val })
                            setData(prev=>({ ...prev, items: prev.items.map(x=> x._id===u._id ? { ...x, status: val } : x) }))
                          }catch(err){ alert(err.response?.data?.message || err.message) }
                        }}
                      >
                        <option value="pending">Chờ duyệt</option>
                        <option value="active">Hoạt động</option>
                        <option value="suspended">Tạm khóa</option>
                      </select>
                    </td>
                    <td className="col-address">{u.address || '—'}</td>
                    <td className="col-avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={`Avatar ${u.name}`} className="avatar-thumb" />
                      ) : '—'}
                    </td>
                    <td className="col-created">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="actions-cell col-actions">
                      {u.role === 'worker' ? (
                        <div className="action-icons">
                          <button
                            className="icon-btn"
                            type="button"
                            onClick={()=>openEditForm(u)}
                            aria-label={`Sửa thông tin ${u.name}`}
                            title="Sửa"
                          >
                            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <path d="M4 13.5V16h2.5l7.07-7.07-2.5-2.5L4 13.5z" fill="currentColor" />
                              <path d="M15.04 7.46a.75.75 0 000-1.06L13.6 5 16 2.6 17.4 4a.75.75 0 010 1.06L15.04 7.46z" fill="currentColor" />
                            </svg>
                          </button>
                          <button
                            className="icon-btn danger"
                            type="button"
                            onClick={()=>handleDelete(u)}
                            aria-label={`Xóa thợ ${u.name}`}
                            title="Xóa"
                          >
                            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <path d="M7 3.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <path d="M4.5 5.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <path d="M6.5 5.5l.5 10a1.5 1.5 0 001.5 1.4h3a1.5 1.5 0 001.5-1.4l.5-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="actions-note">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'center' }}>
            <button className="btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Trang trước</button>
            <span>Trang {data.page} / {data.pages}</span>
            <button className="btn" disabled={data.page>=data.pages} onClick={()=>setPage(p=>p+1)}>Trang sau</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>{formMode === 'create' ? 'Thêm thợ mới' : `Cập nhật thợ: ${selectedUser?.name || ''}`}</h2>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Họ tên
                  <input
                    value={formData.name}
                    onChange={e=>handleFieldChange('name', e.target.value)}
                    required
                    placeholder="Ví dụ: Nguyễn Văn Thợ"
                  />
                </label>
                <label>
                  Số điện thoại
                  <input
                    value={formData.phone}
                    onChange={e=>handleFieldChange('phone', e.target.value)}
                    required
                    placeholder="0909xxxxxx"
                  />
                </label>
                <label>
                  CCCD
                  <input
                    value={formData.citizenId}
                    onChange={e=>handleFieldChange('citizenId', e.target.value)}
                    placeholder="Ví dụ: 0790xxxxxx"
                  />
                </label>
                <label>
                  Địa chỉ
                  <input
                    value={formData.address}
                    onChange={e=>handleFieldChange('address', e.target.value)}
                    placeholder="123 Đường ABC, TP.HCM"
                  />
                </label>
                <label>
                  Trạng thái
                  <select
                    value={formData.status}
                    onChange={e=>handleFieldChange('status', e.target.value)}
                  >
                    <option value="pending">Chờ duyệt</option>
                    <option value="active">Hoạt động</option>
                    <option value="suspended">Tạm khóa</option>
                  </select>
                </label>
                <label>
                  {formMode === 'create' ? 'Mật khẩu' : 'Mật khẩu mới (tùy chọn)'}
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e=>handleFieldChange('password', e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                  />
                </label>
                <label>
                  Ảnh đại diện
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e=>setAvatarFile(e.target.files?.[0] || null)}
                  />
                </label>
                {selectedAvatarUrl && formMode === 'edit' && (
                  <div className="current-avatar">
                    <span>Ảnh hiện tại:</span>
                    <img src={selectedAvatarUrl} alt="Avatar hiện tại" className="avatar-thumb" />
                  </div>
                )}
                {avatarFile && (
                  <div className="current-avatar">
                    <span>Ảnh mới sẽ cập nhật:</span>
                    <img src={URL.createObjectURL(avatarFile)} alt="Avatar xem trước" className="avatar-thumb" />
                  </div>
                )}
              </div>
              <p className="hint">Ảnh đại diện của thợ sẽ được đồng bộ với ứng dụng di động sau khi lưu.</p>
              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={closeForm} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu' }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  )
}
