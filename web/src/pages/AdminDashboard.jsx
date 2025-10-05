import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import NotificationManager from '../components/NotificationManager'

export default function AdminDashboard(){
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user')||'null')
  const isAdmin = user && (user.role === 'admin' || user.role === 'worker')
  const [bookings, setBookings] = useState([])
  const [services, setServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingWorkers, setPendingWorkers] = useState([])
  const [actionMsg, setActionMsg] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('7days')
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(()=>{
    if (!isAdmin){
      navigate('/')
      return
    }
    async function load(){
      try{
        const [b,s,c,w] = await Promise.all([
          api.get('/api/bookings'),
          api.get('/api/services'),
          api.get('/api/users/customers'),
          api.get('/api/users', { params: { role: 'worker', limit: 100 } })
        ])
        setBookings(Array.isArray(b.data) ? b.data : b.data?.items || [])
        setServices(Array.isArray(s.data) ? s.data : s.data?.items || [])
        setCustomers(Array.isArray(c.data) ? c.data : c.data?.items || [])
        setWorkers(Array.isArray(w.data) ? w.data : w.data?.items || [])
        
        // try dedicated pending endpoint first; if 404, fallback to filtered users
        try {
          const pw = await api.get('/api/users/workers/pending')
          setPendingWorkers(pw.data)
        } catch (e) {
          if (e.response?.status === 404) {
            const res = await api.get('/api/users', { params: { role: 'worker', status: 'pending', limit: 100 } })
            const payload = Array.isArray(res.data) ? res.data : (res.data?.items || [])
            setPendingWorkers(payload)
          } else {
            throw e
          }
        }

        // Generate revenue data for chart
        generateRevenueData(Array.isArray(b.data) ? b.data : b.data?.items || [])
      }catch(e){
        setError(e.response?.data?.message || e.message)
      }finally{
        setLoading(false)
      }
    }

    function generateRevenueData(bookingsData) {
      const now = new Date()
      const days = selectedPeriod === '30days' ? 30 : 7
      const revenueByDay = []
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayBookings = bookingsData.filter(b => 
          new Date(b.createdAt).toISOString().split('T')[0] === dateStr
        )
        
        const revenue = dayBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0)
        
        revenueByDay.push({
          date: dateStr,
          revenue,
          bookings: dayBookings.length,
          label: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' })
        })
      }
      
      setRevenueData(revenueByDay)
    }
    load()
  },[isAdmin, navigate, selectedPeriod])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0)
    const completedBookings = bookings.filter(b => b.status === 'done').length
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
    const activeServices = services.filter(s => s.isActive).length
    const vipCustomers = customers.filter(c => c.loyaltyLevel === 'vip').length
    const activeWorkers = workers.filter(w => w.status === 'active').length
    
    return {
      totalRevenue,
      totalBookings: bookings.length,
      completedBookings,
      pendingBookings,
      totalCustomers: customers.length,
      vipCustomers,
      totalServices: services.length,
      activeServices,
      totalWorkers: workers.length,
      activeWorkers,
      pendingWorkers: pendingWorkers.length
    }
  }, [bookings, services, customers, workers, pendingWorkers])

  if (!isAdmin) return null
  if (loading) return <div className="loading-dashboard">Đang tải dữ liệu...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Bảng điều khiển Admin</h1>
        <div className="dashboard-actions">
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              📢 Thông báo
            </button>
          </div>
          {activeTab === 'dashboard' && (
            <div className="period-selector">
              <select 
                value={selectedPeriod} 
                onChange={e => setSelectedPeriod(e.target.value)}
                className="period-select"
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <>
          {/* Statistics Cards */}
          <div className="stats-grid">
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalRevenue.toLocaleString('vi-VN')} VNĐ</div>
            <div className="stat-label">Tổng doanh thu</div>
          </div>
        </div>
        
        <div className="stat-card bookings">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBookings}</div>
            <div className="stat-label">Tổng đặt lịch</div>
            <div className="stat-detail">{stats.completedBookings} hoàn thành</div>
          </div>
        </div>
        
        <div className="stat-card customers">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCustomers}</div>
            <div className="stat-label">Khách hàng</div>
            <div className="stat-detail">{stats.vipCustomers} VIP</div>
          </div>
        </div>
        
        <div className="stat-card workers">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalWorkers}</div>
            <div className="stat-label">Thợ</div>
            <div className="stat-detail">{stats.pendingWorkers} chờ duyệt</div>
          </div>
        </div>
        
        <div className="stat-card services">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalServices}</div>
            <div className="stat-label">Dịch vụ</div>
            <div className="stat-detail">{stats.activeServices} đang hoạt động</div>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingBookings}</div>
            <div className="stat-label">Chờ xử lý</div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Doanh thu theo ngày</h2>
        </div>
        <div className="chart-container">
          <div className="chart">
            {revenueData.map((item, index) => {
              const maxRevenue = Math.max(...revenueData.map(d => d.revenue))
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
              
              return (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar" 
                    style={{ height: `${height}%` }}
                    title={`${item.label}: ${item.revenue.toLocaleString('vi-VN')} VNĐ`}
                  ></div>
                  <div className="bar-label">{item.label}</div>
                  <div className="bar-value">{item.revenue.toLocaleString('vi-VN', { notation: 'compact' })}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Pending Workers Section */}
      {pendingWorkers.length > 0 && (
        <div className="pending-section">
          <div className="section-header">
            <h2>🔔 Thợ chờ phê duyệt ({pendingWorkers.length})</h2>
            {actionMsg && <div className="success-message">{actionMsg}</div>}
          </div>
          <div className="pending-grid">
            {pendingWorkers.map(w => (
              <div key={w._id} className="pending-card">
                <div className="worker-info">
                  <h4>{w.name}</h4>
                  <p>📞 {w.phone}</p>
                  <p>📍 {w.address || 'Chưa có địa chỉ'}</p>
                  <p>📅 {new Date(w.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="worker-actions">
                  <button className="btn success" onClick={async ()=>{
                    try{
                      await api.put(`/api/users/workers/${w._id}/approve`)
                      setPendingWorkers(prev=>prev.filter(x=>x._id!==w._id))
                      setActionMsg('Đã phê duyệt thành công')
                      setTimeout(()=>setActionMsg(null), 3000)
                    }catch(e){
                      alert(e.response?.data?.message || e.message)
                    }
                  }}>✅ Phê duyệt</button>
                  <button className="btn danger" onClick={async ()=>{
                    try{
                      await api.put(`/api/users/workers/${w._id}/suspend`)
                      setPendingWorkers(prev=>prev.filter(x=>x._id!==w._id))
                      setActionMsg('Đã tạm khóa tài khoản')
                      setTimeout(()=>setActionMsg(null), 3000)
                    }catch(e){
                      alert(e.response?.data?.message || e.message)
                    }
                  }}>❌ Từ chối</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Dashboard */}
      <div className="dashboard-grid">
        {/* Recent Bookings */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>📅 Đặt lịch gần đây</h3>
            <span className="card-count">{bookings.length}</span>
          </div>
          <div className="card-content">
            {bookings.length === 0 ? (
              <p className="empty-state">Chưa có đặt lịch nào</p>
            ) : (
              <div className="items-list">
                {bookings.slice(0, 5).map(b => (
                  <div key={b._id} className="item">
                    <div className="item-main">
                      <strong>{b.customer?.name || 'N/A'}</strong>
                      <span className="item-service">{b.service?.name || 'N/A'}</span>
                    </div>
                    <div className="item-meta">
                      <span className={`status-badge ${b.status}`}>{
                        b.status === 'pending' ? 'Chờ xác nhận' :
                        b.status === 'confirmed' ? 'Đã xác nhận' :
                        b.status === 'done' ? 'Hoàn thành' :
                        b.status === 'cancelled' ? 'Đã hủy' : b.status
                      }</span>
                      {typeof b.finalPrice === 'number' && (
                        <span className="item-price">{b.finalPrice.toLocaleString('vi-VN')} VNĐ</span>
                      )}
                    </div>
                  </div>
                ))}
                {bookings.length > 5 && (
                  <div className="see-more">+{bookings.length - 5} đặt lịch khác</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Services Overview */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>⚡ Dịch vụ</h3>
            <span className="card-count">{services.length}</span>
          </div>
          <div className="card-content">
            {services.length === 0 ? (
              <p className="empty-state">Chưa có dịch vụ nào</p>
            ) : (
              <div className="items-list">
                {services.slice(0, 5).map(s => (
                  <div key={s._id} className="item">
                    <div className="item-main">
                      <strong>{s.name}</strong>
                      <span className="item-desc">{s.description?.substring(0, 50)}...</span>
                    </div>
                    <div className="item-meta">
                      <span className={`status-badge ${s.isActive ? 'active' : 'inactive'}`}>
                        {s.isActive ? 'Hoạt động' : 'Tắt'}
                      </span>
                      <span className="item-price">{s.basePrice?.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                  </div>
                ))}
                {services.length > 5 && (
                  <div className="see-more">+{services.length - 5} dịch vụ khác</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>👥 Khách hàng nổi bật</h3>
            <span className="card-count">{customers.length}</span>
          </div>
          <div className="card-content">
            {customers.length === 0 ? (
              <p className="empty-state">Chưa có khách hàng nào</p>
            ) : (
              <div className="items-list">
                {customers
                  .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                  .slice(0, 5)
                  .map(c => (
                    <div key={c._id} className="item">
                      <div className="item-main">
                        <strong>{c.name}</strong>
                        <span className="item-phone">{c.phone}</span>
                      </div>
                      <div className="item-meta">
                        {c.loyaltyLevel === 'vip' && <span className="vip-badge">⭐ VIP</span>}
                        <span className="usage-count">{c.usageCount || 0} lần sử dụng</span>
                      </div>
                    </div>
                  ))}
                {customers.length > 5 && (
                  <div className="see-more">+{customers.length - 5} khách hàng khác</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Notifications Content */}
      {activeTab === 'notifications' && (
        <div className="notifications-content">
          <NotificationManager />
        </div>
      )}
    </div>
  )
}
