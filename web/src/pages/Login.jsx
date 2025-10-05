import React, { useState } from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try{
      const res = await api.post('/api/users/login', { phone, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    }catch(err){
      setError(err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="booking-container">
      <h2>Đăng nhập</h2>
      <form onSubmit={submit} className="form">
        <div className="field">
          <label>Số điện thoại</label>
          <input placeholder="Ví dụ: 09xxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Mật khẩu</label>
          <input placeholder="••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button className="btn primary" type="submit">Đăng nhập</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
