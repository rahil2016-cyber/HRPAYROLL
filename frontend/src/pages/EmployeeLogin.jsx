import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import { MdLock, MdMail, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function EmployeeLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/auth/login', {
        email,
        password,
        role: 'employee'
      });
      if (response.data.token) {
        onLoginSuccess(response.data.token, response.data.user);
        navigate('/employee');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container" style={{ '--theme-accent': '#0047B8', '--theme-accent-rgb': '0, 71, 184' }}>
      <div className="login-left-panel">
        <div className="login-form-wrapper">
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Logo width={185} height={46} />
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 500 }}>
              Enterprise HR & Payroll Automation
            </p>
          </div>

          <div style={{
            textAlign: 'center',
            marginBottom: '1.75rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(0, 71, 184, 0.04)',
            border: '1px solid rgba(0, 71, 184, 0.12)',
            borderRadius: '10px'
          }}>
            <h3 style={{ color: '#0047B8', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
              Employee Portal Login
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.725rem', marginTop: '0.25rem', margin: 0, lineHeight: '1.4' }}>
              Access your work dashboard, check-in, and view payslips using your email or unique Employee Code.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(227, 6, 19, 0.05)',
              border: '1px solid rgba(227, 6, 19, 0.2)',
              borderRadius: '6px',
              color: '#E30613',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="login-input-group">
              <label className="login-input-label">Email Address or Unique ID</label>
              <div className="login-input-wrapper">
                <MdMail className="login-input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Enter email or EMPxxxxx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input-field"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-input-label">Password</label>
              <div className="login-input-wrapper">
                <MdLock className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
              style={{
                backgroundColor: '#0047B8',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                marginTop: '0.5rem'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Back to Portal Gateways
            </button>
          </div>
        </div>
      </div>

      <div className="login-right-panel" style={{ background: 'linear-gradient(135deg, #0047B8 0%, #1e40af 100%)' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.08) 0%, transparent 60%)',
          zIndex: 0
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="mockup-content" style={{
            background: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '1.5rem',
            width: '85%',
            maxWidth: '440px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>Employee Workspace</span>
              <span className="mockup-badge" style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 600
              }}>
                ● In Office Geofence
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#94a3b8' }}>Shift Tracker</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>08:42:15</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#94a3b8' }}>Geofence Distance</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>12 Meters</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '0.6rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Verify Payslips</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                  <span>Payslip_2026_APR.pdf</span>
                  <span style={{ color: '#10b981' }}>Processed</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                  <span>Payslip_2026_MAR.pdf</span>
                  <span style={{ color: '#10b981' }}>Processed</span>
                </div>
              </div>
            </div>
          </div>

          <h2 className="login-hero-title">Empower Your Workday</h2>
          <p className="login-hero-desc">
            Clock-in using GPS geofencing, track your working hours in real-time, view verified payslips, and manage your leaves effortlessly.
          </p>
        </div>
      </div>
    </div>
  );
}
