import React, { useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [address, setAddress] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try{
      // role is always customer from web registration
      await api.post('/api/users/register', { name, phone, password, role: 'customer', address })
      navigate('/login')
    }catch(err){
      setError(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="booking-container">
      <h2>Tạo tài khoản</h2>
      <form onSubmit={submit} className="form">
        <div className="field">
          <label>Họ tên</label>
          <input placeholder="Nguyễn Văn A" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Số điện thoại</label>
          <input placeholder="09xxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Mật khẩu</label>
          <input placeholder="••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Địa chỉ (tuỳ chọn)</label>
          <input placeholder="Số nhà, đường, quận/huyện" value={address} onChange={e=>setAddress(e.target.value)} />
        </div>
        <button className="btn primary" type="submit">Đăng ký</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
