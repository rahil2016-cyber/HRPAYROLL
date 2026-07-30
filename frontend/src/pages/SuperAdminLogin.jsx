import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import { MdLock, MdMail, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function SuperAdminLogin({ onLoginSuccess }) {
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
        role: 'superadmin'
      });
      if (response.data.token) {
        onLoginSuccess(response.data.token, response.data.user);
        navigate('/superadmin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container" style={{ '--theme-accent': '#475569', '--theme-accent-rgb': '71, 85, 105' }}>
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
            backgroundColor: 'rgba(71, 85, 105, 0.04)',
            border: '1px solid rgba(71, 85, 105, 0.12)',
            borderRadius: '10px'
          }}>
            <h3 style={{ color: '#475569', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
              Super Admin Console Login
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.725rem', marginTop: '0.25rem', margin: 0, lineHeight: '1.4' }}>
              System diagnostic controls, multi-tenant databases management, client company subscriptions, and portal setups.
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
              <label className="login-input-label">Super Admin Email Address</label>
              <div className="login-input-wrapper">
                <MdMail className="login-input-icon" />
                <input
                  type="email"
                  required
                  placeholder="admin@platform.com"
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
                backgroundColor: '#475569',
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
              {loading ? 'Securing Session...' : 'Authenticate Platform Admin'}
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

      <div className="login-right-panel" style={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)' }}>
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
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>Super Admin Console</span>
              <span className="mockup-badge" style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 600
              }}>
                ● System Diagnostic
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#cbd5e1' }}>Tenant Companies</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>18 Active</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#cbd5e1' }}>CPU Utilization</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>12.4%</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.55rem', color: '#94a3b8' }}>
              <div>[SYSTEM] JWT module active</div>
              <div>[DATABASE] Checked 14 pools [OK]</div>
            </div>
          </div>

          <h2 className="login-hero-title">Global Platform Control</h2>
          <p className="login-hero-desc">
            Register new tenant companies, monitor subscriptions and plans, configure global parameters, and diagnose system database performance.
          </p>
        </div>
      </div>
    </div>
  );
}
