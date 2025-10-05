import React, { useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import Users from './pages/Users'
import ServiceDetail from './pages/ServiceDetail'
import BannerManagement from './pages/BannerManagement'

import TestAPI from './components/TestAPI'
import SearchBox from './components/SearchBox'
import NotificationSystem from './components/NotificationSystem'
import logo from './assets/logo.png'


function AppContent() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const logout = () => {
    if (!window.confirm('Bạn có chắc muốn đăng xuất?')) return
    // optional: call backend logout if you implement one
    try {
      const token = localStorage.getItem('token')
      if (token) fetch(`${process.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }
  
  const isAdmin = user && (user.role === 'admin' || user.role === 'worker')
  
  return (
    <div className="app">
      <nav className="nav">
        <Link to="/" className="brand">
          <img src={logo} alt="Logo" className="brand-logo" />
          <span>Thợ HCM</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="nav-desktop">
          <Link to="/">Trang chủ</Link>
          {!user && <Link to="/register">Đăng ký</Link>}
          {!user && <Link to="/login">Đăng nhập</Link>}
          {user && user.role === 'customer' && <Link to="/my-bookings">Đơn của tôi</Link>}
          
          {user && <Link to="/profile">Thông tin cá nhân</Link>}
          {isAdmin && <>
            <Link to="/admin">Bảng điều khiển</Link>
            {user?.role === 'admin' && <Link to="/users">Người dùng</Link>}
            {user?.role === 'admin' && <Link to="/banners">Banner & Thông báo</Link>}
          </>}
          <SearchBox />
          <span className="spacer" />
          {user && <NotificationSystem user={user} />}
          <button className="btn" onClick={()=>{
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
          }}>Giao diện</button>
          {user && <button className="btn" onClick={logout}>Thoát ({user.name})</button>}
        </div>

        {/* Mobile Search */}
        <div className="nav-mobile-search">
          <SearchBox />
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Navigation */}
        <div className={`nav-mobile ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
          {!user && <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Đăng ký</Link>}
          {!user && <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>}
          {user && user.role === 'customer' && <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)}>Đơn của tôi</Link>}
          
          {user && <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Thông tin cá nhân</Link>}
          {isAdmin && <>
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Bảng điều khiển</Link>
            {user?.role === 'admin' && <Link to="/users" onClick={() => setMobileMenuOpen(false)}>Người dùng</Link>}
            {user?.role === 'admin' && <Link to="/banners" onClick={() => setMobileMenuOpen(false)}>Banner & Thông báo</Link>}
          </>}
          <button className="btn" onClick={()=>{
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            setMobileMenuOpen(false);
          }}>Giao diện</button>
          {user && <button className="btn" onClick={() => {logout(); setMobileMenuOpen(false);}}>Thoát ({user.name})</button>}
        </div>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/service/:id" element={<ServiceDetail/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/booking" element={<Booking/>} />
          <Route path="/my-bookings" element={<MyBookings/>} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/admin" element={<AdminDashboard/>} />
          <Route path="/users" element={<Users/>} />
          <Route path="/banners" element={<BannerManagement/>} />

          <Route path="/test-api" element={<TestAPI/>} />

        </Routes>
      </main>
      <footer className="footer">
        <div>
          <p>&copy; 2025 Thợ HCM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return <AppContent />
}
