import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import { ServiceMediaGallery } from '../components/ServiceMediaGallery'
import ReviewSection from '../components/ReviewSection'

export default function ServiceDetail() {
  const { id } = useParams()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isAdmin = user && (user.role === 'admin' || user.role === 'worker')

  useEffect(() => {
    if (id) {
      loadService()
    }
  }, [id])

  const loadService = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/services/${id}`)
      setService(response.data)
    } catch (error) {
      console.error('Error loading service:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton" style={{height: 300, borderRadius: 12, marginBottom: 20}} />
        <div className="skeleton" style={{height: 24, width: '60%', borderRadius: 8, marginBottom: 12}} />
        <div className="skeleton" style={{height: 16, width: '90%', borderRadius: 8, marginBottom: 8}} />
        <div className="skeleton" style={{height: 16, width: '70%', borderRadius: 8, marginBottom: 20}} />
        <div className="skeleton" style={{height: 40, width: '30%', borderRadius: 10}} />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="card">
        <h1>Không tìm thấy dịch vụ</h1>
        <Link to="/" className="btn primary">Quay lại trang chủ</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <ServiceMediaGallery 
          images={service.images || []} 
          videos={service.videos || []} 
        />
        
        <h1 style={{marginTop: 20, marginBottom: 16}}>{service.name}</h1>
        
        <p style={{fontSize: 16, lineHeight: 1.6, marginBottom: 20, color: 'var(--muted)'}}>
          {service.description}
        </p>
        
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24}}>
          <div className="price" style={{fontSize: 20, fontWeight: 600}}>
            {(service.effectivePrice ?? service.basePrice)?.toLocaleString('vi-VN')} VNĐ
          </div>
          {service.vipPrice && (
            <div className="vip-price" style={{fontSize: 16, color: 'var(--primary)'}}>
              VIP: {service.vipPrice.toLocaleString('vi-VN')} VNĐ
            </div>
          )}
        </div>
        
        {!isAdmin && (
          <Link 
            className="btn primary" 
            to="/booking" 
            state={{ service }}
            style={{marginBottom: 24}}
          >
            Đặt lịch ngay
          </Link>
        )}
      </div>

      <ReviewSection serviceId={service._id} user={user} />
    </div>
  )
}