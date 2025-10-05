import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function SearchBox({ onResultSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef()
  const navigate = useNavigate()

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(() => {
      searchServices(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchServices = async (searchQuery) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await api.get(`/api/services?search=${encodeURIComponent(searchQuery)}`)
      setResults(response.data.slice(0, 5)) // Limit to 5 results
      setIsOpen(true)
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectResult = (service) => {
    setQuery('')
    setIsOpen(false)
    if (onResultSelect) {
      onResultSelect(service)
    } else {
      navigate(`/service/${service._id}`)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      // Navigate to search results page or filter current page
      navigate(`/?search=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="search-box" ref={searchRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            onFocus={() => query && setIsOpen(true)}
          />
          <button type="submit" className="search-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </form>

      {isOpen && (
        <div className="search-dropdown">
          {loading ? (
            <div className="search-loading">
              <div className="search-spinner"></div>
              Đang tìm kiếm...
            </div>
          ) : results.length > 0 ? (
            <div className="search-results">
              {results.map((service) => (
                <div
                  key={service._id}
                  className="search-result-item"
                  onClick={() => handleSelectResult(service)}
                >
                  <div className="search-result-content">
                    {service.images && service.images[0] && (
                      <img 
                        src={service.images[0]} 
                        alt={service.name}
                        className="search-result-image"
                      />
                    )}
                    <div className="search-result-info">
                      <div className="search-result-name">{service.name}</div>
                      {service.worker && (
                        <div className="search-result-worker">Thợ: {service.worker.name}</div>
                      )}
                      <div className="search-result-price">
                        {(service.effectivePrice ?? service.basePrice)?.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {query && (
                <div className="search-view-all" onClick={() => navigate(`/?search=${encodeURIComponent(query)}`)}>
                  Xem tất cả kết quả cho "{query}"
                </div>
              )}
            </div>
          ) : query && !loading ? (
            <div className="search-no-results">
              <div style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Không tìm thấy dịch vụ nào cho "{query}"
              </div>
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', padding: '8px 0 0' }}>
                  Gợi ý tìm kiếm:
                </div>
                <div className="search-suggestions">
                  {['sửa máy lạnh', 'sửa máy giặt', 'sửa tủ lạnh', 'điện gia dụng', 'sửa xe máy'].map(suggestion => (
                    <div
                      key={suggestion}
                      className="search-suggestion-item"
                      onClick={() => {
                        setQuery(suggestion)
                        setIsOpen(false)
                        navigate(`/?search=${encodeURIComponent(suggestion)}`)
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}