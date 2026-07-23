import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import { MdLock, MdMail, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function HRLogin({ onLoginSuccess }) {
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
        password
      });
      if (response.data.token) {
        onLoginSuccess(response.data.token, response.data.user);
        navigate('/hr');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container" style={{ '--theme-accent': '#E30613', '--theme-accent-rgb': '227, 6, 19' }}>
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
            backgroundColor: 'rgba(227, 6, 19, 0.04)',
            border: '1px solid rgba(227, 6, 19, 0.12)',
            borderRadius: '10px'
          }}>
            <h3 style={{ color: '#E30613', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
              HR Manager Portal Login
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.725rem', marginTop: '0.25rem', margin: 0, lineHeight: '1.4' }}>
              Onboard employees, monitor geofence settings, approve leaves, and manage organizational hierarchies.
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
              <label className="login-input-label">HR Email Address</label>
              <div className="login-input-wrapper">
                <MdMail className="login-input-icon" />
                <input
                  type="email"
                  required
                  placeholder="hr@company.com"
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
                backgroundColor: '#E30613',
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
              {loading ? 'Verifying Gateway...' : 'Authenticate HR Portal'}
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

      <div className="login-right-panel" style={{ background: 'linear-gradient(135deg, #E30613 0%, #be123c 100%)' }}>
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
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>HR Management Portal</span>
              <span className="mockup-badge" style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 600
              }}>
                ● Setup Active
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#fca5a5' }}>Active Staff</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>128 Employees</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#fca5a5' }}>Billing Per Employee</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>₹150 / mo</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '0.6rem', color: '#fca5a5', marginBottom: '0.5rem' }}>Branch GeofenceHQ</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.6rem', color: '#fff' }}>
                <span>Lat: 12.9716° N</span>
                <span>Lon: 77.5946° E</span>
                <span style={{ color: '#fca5a5', fontWeight: 600 }}>Radius Limit: 200m</span>
              </div>
            </div>
          </div>

          <h2 className="login-hero-title">Streamline HR Operations</h2>
          <p className="login-hero-desc">
            Onboard new employees, configure custom branch geofencing parameters, approve leave requests, and manage corporate hierarchies from a single dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
