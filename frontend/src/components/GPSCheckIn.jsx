import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdMyLocation, MdHome, MdCheckCircle, MdError, MdDirectionsWalk } from 'react-icons/md';

export default function GPSCheckIn({ employeeId, token, onAttendanceMarked, attendanceToday, branchGeofence }) {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ latitude: 12.9716, longitude: 77.5946 }); // Default Office (Bengaluru Center)
  const [isWfh, setIsWfh] = useState(false);
  const [isSimulated, setIsSimulated] = useState(true); // Default to simulation mode for evaluation ease
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  // Load real coordinates if not simulated
  useEffect(() => {
    if (!isSimulated && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => {
          console.error("Error fetching real GPS position, falling back to simulated", err);
          setIsSimulated(true);
        }
      );
    }
  }, [isSimulated]);

  // Adjust coordinates based on simulation choice
  const handleSimulationChange = (type) => {
    if (type === 'inside') {
      // 12.9716, 77.5946 is the seeded Office location. Setting it exact is inside the 200m geofence.
      setCoords({ latitude: 12.9716, longitude: 77.5946 });
    } else if (type === 'outside') {
      // Offset position by ~5km to trigger geofence breach
      setCoords({ latitude: 13.0200, longitude: 77.6500 });
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post('http://localhost:8000/index.php?route=/api/employee/attendance/clock-in', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        is_wfh: isWfh ? 1 : 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessageType('success');
      setMessage(response.data.message);
      if (onAttendanceMarked) onAttendanceMarked();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.error || 'Clock-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post('http://localhost:8000/index.php?route=/api/employee/attendance/clock-out', {
        latitude: coords.latitude,
        longitude: coords.longitude
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessageType('success');
      setMessage(response.data.message);
      if (onAttendanceMarked) onAttendanceMarked();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.error || 'Clock-out failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MdMyLocation color="#E30613" /> Geofenced GPS Check-In
        </h3>
        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: 600, color: '#64748b' }}>
          Target Office Radius: {branchGeofence?.radius_meters || 200}m
        </span>
      </div>

      {attendanceToday ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <MdCheckCircle size={48} color="#0047B8" style={{ marginBottom: '0.5rem' }} />
          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>You are clocked in for today</h4>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
            Check-In: <strong>{attendanceToday.clock_in}</strong> 
            {attendanceToday.clock_out ? (
              <span> | Check-Out: <strong>{attendanceToday.clock_out}</strong></span>
            ) : null}
          </p>

          {!attendanceToday.clock_out && (
            <button
              onClick={handleClockOut}
              disabled={loading}
              style={{
                marginTop: '1.25rem',
                backgroundColor: '#E30613',
                color: '#fff',
                border: 'none',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Processing...' : 'Clock Out Now'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setIsWfh(false)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: !isWfh ? '#0047B8' : '#fff',
                color: !isWfh ? '#fff' : '#475569',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <MdDirectionsWalk /> Office Duty
            </button>
            <button
              onClick={() => setIsWfh(true)}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: isWfh ? '#0047B8' : '#fff',
                color: isWfh ? '#fff' : '#475569',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <MdHome /> Work from Home
            </button>
          </div>

          {/* Simulated Location controls for testing geofences */}
          {!isWfh && (
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>GPS Simulation Settings (Test Radii)</span>
                <input 
                  type="checkbox" 
                  checked={isSimulated} 
                  onChange={(e) => setIsSimulated(e.target.checked)} 
                />
              </div>

              {isSimulated && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleSimulationChange('inside')}
                    style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #0047B8', cursor: 'pointer', backgroundColor: coords.latitude === 12.9716 ? 'rgba(0, 71, 184, 0.1)' : '#fff' }}
                  >
                    Simulate: Inside Geofence (0 meters)
                  </button>
                  <button 
                    onClick={() => handleSimulationChange('outside')}
                    style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #E30613', cursor: 'pointer', backgroundColor: coords.latitude === 13.0200 ? 'rgba(227, 6, 19, 0.1)' : '#fff' }}
                  >
                    Simulate: Outside Geofence (~5 km)
                  </button>
                </div>
              )}

              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Coordinates: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </div>
            </div>
          )}

          {message && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: messageType === 'success' ? 'rgba(0, 71, 184, 0.05)' : 'rgba(227, 6, 19, 0.05)',
              color: messageType === 'success' ? '#0047B8' : '#E30613',
              fontSize: '0.825rem'
            }}>
              {messageType === 'success' ? <MdCheckCircle size={18} /> : <MdError size={18} />}
              <span>{message}</span>
            </div>
          )}

          <button
            onClick={handleClockIn}
            disabled={loading}
            style={{
              backgroundColor: '#0047B8',
              color: '#fff',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? 'Processing...' : 'Clock In Now'}
          </button>
        </div>
      )}
    </div>
  );
}
