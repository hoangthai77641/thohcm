import React, { useState, useEffect } from 'react';
import api from '../api';

const TestAPI = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      if (body) {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`http://localhost:5000/api${endpoint}`, config);
      const data = await response.json();
      
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Test API Endpoints</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Worker Schedule APIs</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => testEndpoint('/worker-schedule/workers')}>
            Get All Workers
          </button>
          <button onClick={() => testEndpoint('/worker-schedule/default-time-slots')}>
            Get Default Time Slots
          </button>
          <button onClick={() => testEndpoint('/worker-schedule/my-schedule')}>
            Get My Schedule
          </button>
          <button onClick={() => testEndpoint('/worker-schedule/current-job')}>
            Get Current Job
          </button>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => testEndpoint('/worker-schedule/update-availability-after-booking', 'POST', {
            completedBookingTime: new Date().toISOString(),
            additionalDays: 3
          })}>
            Update After Booking
          </button>
          <button onClick={() => testEndpoint('/worker-schedule/custom-availability', 'PUT', {
            date: new Date().toISOString().split('T')[0],
            availableHours: ['08:00', '09:00', '14:00']
          })}>
            Update Custom Availability
          </button>
          <button onClick={() => testEndpoint('/worker-schedule/generate-schedule', 'POST', {
            days: 7
          })}>
            Generate Schedule
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results:</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {result}
          </pre>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Login Status:</h3>
        <p>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
        <p>User: {JSON.stringify(JSON.parse(localStorage.getItem('user') || 'null'))}</p>
      </div>
    </div>
  );
};

export default TestAPI;