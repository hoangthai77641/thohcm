import React, { useEffect, useState } from 'react'
import api from '../api'
import { Link, useSearchParams } from 'react-router-dom'
import { ServiceMediaGallery } from '../components/ServiceMediaGallery'
import ReviewSection from '../components/ReviewSection'
import StarDisplay from '../components/StarDisplay'

export default function Home(){
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search')
  const user = JSON.parse(localStorage.getItem('user')||'null')
  const isAdmin = user && (user.role === 'admin' || user.role === 'worker')

  useEffect(()=>{
    loadServices()
  },[searchQuery])

  const loadServices = () => {
    setLoading(true)
    const url = searchQuery ? `/api/services?search=${encodeURIComponent(searchQuery)}` : '/api/services'
    api.get(url)
      .then(r=>setServices(r.data))
      .catch(e=>console.error(e))
      .finally(()=>setLoading(false))
  }

  if (loading) return (
    <div>
      {/* <h1 style={{marginBottom:12}}>Dịch vụ nổi bật</h1> */}
      <div className="services">
        {Array.from({length:6}).map((_,i)=> (
          <div key={i} className="card">
            <div className="skeleton" style={{height:20, width:'60%', borderRadius:8, marginBottom:10}} />
            <div className="skeleton" style={{height:14, width:'90%', borderRadius:8, marginBottom:6}} />
            <div className="skeleton" style={{height:14, width:'70%', borderRadius:8, marginBottom:16}} />
            <div className="skeleton" style={{height:36, width:'40%', borderRadius:10}} />
          </div>
        ))}
      </div>
    </div>
  )
  return (
    <div>
      {searchQuery ? (
        <h1 style={{marginBottom: 20}}>
          Kết quả tìm kiếm cho "{searchQuery}" ({services.length} dịch vụ)
        </h1>
      ) : (
        <h1 style={{marginBottom: 20, display: 'none'}}>Dịch vụ nổi bật</h1>
      )}
      
      {searchQuery && services.length === 0 ? (
        <div style={{
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          margin: '20px 0'
        }}>
          <div style={{fontSize: '48px', marginBottom: '16px', opacity: 0.5}}>🔍</div>
          <h3 style={{marginBottom: '12px', color: 'var(--text)'}}>
            Không tìm thấy dịch vụ nào
          </h3>
          <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>
            Không có dịch vụ nào phù hợp với từ khóa "{searchQuery}"
          </p>
          <div style={{marginBottom: '20px'}}>
            <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px'}}>
              Gợi ý tìm kiếm:
            </p>
            <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center'}}>
              {['sửa máy lạnh', 'sửa máy giặt', 'sửa tủ lạnh', 'điện gia dụng', 'sửa xe máy'].map(suggestion => (
                <button 
                  key={suggestion}
                  onClick={() => {
                    setSearchParams({ search: suggestion });
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    background: 'var(--bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'var(--primary)';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'var(--bg)';
                    e.target.style.color = 'var(--text-secondary)';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={() => {
              setSearchParams({});
            }}
            className="btn primary"
            style={{margin: '0 auto'}}
          >
            Xem tất cả dịch vụ
          </button>
        </div>
      ) : (
        <div className="services">
          {services.map(s=> (
            <div key={s._id} className="card service-card">
              <ServiceMediaGallery 
                images={s.images || []} 
                videos={s.videos || []} 
              />
              <h3>
                <Link to={`/service/${s._id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                  {s.name}
                </Link>
              </h3>
              {s.worker && (
                <div className="service-worker">
                  Thợ: {s.worker.name}
                </div>
              )}
              <StarDisplay 
                rating={s.averageRating} 
                reviewCount={s.reviewCount}
                showCount={true}
              />
              {/* <p style={{minHeight:40, color:'#475569'}}>{s.description}</p> */}
              <p className="price">
                { (s.effectivePrice ?? s.basePrice)?.toLocaleString('vi-VN') } VNĐ
                { s.vipPrice && <span className="vip">(VIP: {s.vipPrice.toLocaleString('vi-VN')} VNĐ)</span> }
              </p>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                <Link className="btn outline" to={`/service/${s._id}`}>Xem chi tiết</Link>
                {!isAdmin && (
                  <Link className="btn primary" to="/booking" state={{ service: s }}>Đặt lịch</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
