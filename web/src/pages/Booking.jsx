import React, { useState, useEffect } from 'react'
import WorkerBooking from '../components/WorkerBooking'
import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

export default function Booking(){
  const navigate = useNavigate()
  const location = useLocation()
  const service = location.state?.service

  useEffect(()=>{
    // require login
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) {
      navigate('/login', { state: { redirectTo: '/booking' } })
      return
    }

    // Require service selection
    if (!service) {
      navigate('/', { replace: true })
      return
    }
  }, [navigate, service])

  if (!service) {
    return <div>Đang chuyển hướng...</div>
  }

  return (
    <div className="booking-page">
      <div className="booking-header">
        <h1>Đặt lịch dịch vụ</h1>
        <p>Chọn thời gian và điền thông tin để hoàn tất đặt lịch</p>
      </div>
      <WorkerBooking selectedService={service} />
    </div>
  )
}
