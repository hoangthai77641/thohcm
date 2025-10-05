import React, { useEffect, useState } from 'react'
import api from '../api'

export default function MyBookings(){
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const fetchBookings = () => {
    api.get('/api/bookings/my')
      .then(r=>setBookings(r.data))
      .catch(e=>setError(e.response?.data?.message || e.message))
      .finally(()=>setLoading(false))
  }

  useEffect(()=>{
    fetchBookings()
  },[])

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này? Chỉ có thể hủy trước 24 giờ.')) {
      return
    }

    setCancelling(bookingId)
    try {
      await api.patch(`/api/bookings/${bookingId}/cancel`)
      alert('Hủy đơn thành công!')
      fetchBookings() // Refresh bookings
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message))
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <div>Đang tải đơn hàng của bạn...</div>
  if (error) return <div className="error">{error}</div>

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': '#fbbf24',
      'confirmed': '#3b82f6', 
      'done': '#10b981',
      'cancelled': '#ef4444'
    }
    const statusText = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'done': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    }
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: statusColors[status] || '#6b7280'
      }}>
        {statusText[status] || status}
      </span>
    )
  }

  return (
    <div>
      <h2>Đơn hàng của tôi</h2>
      {bookings.length === 0 && <p>Bạn chưa có đơn hàng nào</p>}
      {bookings.length > 0 && (
        <div className="table-container">
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            marginTop: '1rem',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Dịch vụ</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Ngày giờ</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Địa chỉ</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Thợ</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Giá</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Trạng thái</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Ghi chú</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, index) => (
                <tr key={b._id} style={{ 
                  borderBottom: index < bookings.length - 1 ? `1px solid var(--border)` : 'none',
                  backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'
                }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>
                    {b.service?.name || 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {new Date(b.date).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '150px', wordWrap: 'break-word' }}>
                    {b.address || 'Chưa có'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {b.worker?.name || 'N/A'}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>
                    {typeof b.finalPrice === 'number' 
                      ? `${b.finalPrice.toLocaleString('vi-VN')} ₫`
                      : 'N/A'
                    }
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getStatusBadge(b.status)}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '120px', wordWrap: 'break-word' }}>
                    {b.note || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {(['pending', 'confirmed'].includes(b.status)) && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleCancelBooking(b._id)}
                        disabled={cancelling === b._id}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          opacity: cancelling === b._id ? 0.6 : 1
                        }}
                      >
                        {cancelling === b._id ? 'Đang hủy...' : 'Hủy đơn'}
                      </button>
                    )}
                    {b.worker?.phone && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => window.open(`tel:${b.worker.phone}`)}
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          marginLeft: '8px'
                        }}
                      >
                        📞 Gọi thợ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
