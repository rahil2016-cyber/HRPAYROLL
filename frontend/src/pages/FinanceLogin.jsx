import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import { MdLock, MdMail, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function FinanceLogin({ onLoginSuccess }) {
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
        navigate('/finance');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container" style={{ '--theme-accent': '#0d9488', '--theme-accent-rgb': '13, 148, 136' }}>
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
            backgroundColor: 'rgba(13, 148, 136, 0.04)',
            border: '1px solid rgba(13, 148, 136, 0.12)',
            borderRadius: '10px'
          }}>
            <h3 style={{ color: '#0d9488', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
              Finance & Compliance Login
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.725rem', marginTop: '0.25rem', margin: 0, lineHeight: '1.4' }}>
              Run monthly payroll cycles, verify tax deductions, adjust TDS rates, and audit reimbursement expenses.
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
              <label className="login-input-label">Finance Email Address</label>
              <div className="login-input-wrapper">
                <MdMail className="login-input-icon" />
                <input
                  type="email"
                  required
                  placeholder="finance@company.com"
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
                backgroundColor: '#0d9488',
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
              {loading ? 'Entering Vault...' : 'Verify Finance Credentials'}
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

      <div className="login-right-panel" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
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
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>Finance Operations</span>
              <span className="mockup-badge" style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 600
              }}>
                ● Compliance OK
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#99f6e4' }}>Monthly Budget</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>₹4,82,500</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.6rem', color: '#99f6e4' }}>Tax Bracket</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>5% TDS</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '0.6rem', color: '#99f6e4', marginBottom: '0.5rem' }}>Pending Expenses Audit</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.65rem', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>AWS Server Costs</span>
                  <span style={{ color: '#2dd4bf' }}>Verify</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Travel Reimbursement</span>
                  <span style={{ color: '#2dd4bf' }}>Verify</span>
                </div>
              </div>
            </div>
          </div>

          <h2 className="login-hero-title">Automated Payroll & Compliance</h2>
          <p className="login-hero-desc">
            Generate monthly payslip cycles, audit corporate expense reimbursement claims, and configure automated TDS, PF, and ESI tax thresholds.
          </p>
        </div>
      </div>
    </div>
  );
}
