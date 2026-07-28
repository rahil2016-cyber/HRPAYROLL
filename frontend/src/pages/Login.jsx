import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import { 
  MdBusiness, MdLock, MdMail, MdPeople, MdArrowForward, MdArrowBack, MdCheckCircle,
  MdVisibility, MdVisibilityOff, MdPerson, MdPayments, MdAdminPanelSettings
} from 'react-icons/md';

export default function Login({ onLoginSuccess, initialRole, initialTab = 'login' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab); // login or register
  const [roleMode, setRoleMode] = useState(initialRole || 'employee'); // superadmin, hr, finance, employee
  const [showPassword, setShowPassword] = useState(false);

  const renderDashboardMockup = () => {
    switch (roleMode) {
      case 'hr':
        return (
          <div className="mockup-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>HR Management Portal</span>
              <span className="mockup-badge">
                <span className="mockup-pulse-dot"></span> Active
              </span>
            </div>
            
            <div className="mockup-grid">
              <div className="mockup-card">
                <span className="mockup-card-title">Total Staff</span>
                <span className="mockup-card-value">128</span>
                <span style={{ fontSize: '0.55rem', color: '#10b981' }}>+8 onboarded this month</span>
              </div>
              <div className="mockup-card">
                <span className="mockup-card-title">Present Today</span>
                <span className="mockup-card-value">114 / 120</span>
                <div className="mockup-progress-bar">
                  <div className="mockup-progress-fill" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>

            <div className="mockup-card" style={{ flex: 1 }}>
              <span className="mockup-card-title">Geofence Parameters</span>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem', alignItems: 'center' }}>
                <div className="mockup-geofence-visualizer" style={{ flex: 1 }}>
                  <div className="mockup-geofence-circle"></div>
                  <div className="mockup-geofence-pin"></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.6rem' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>Main Office HQ</span>
                  <span>Lat: 12.9716° N</span>
                  <span>Lon: 77.5946° E</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Radius: 150m (Strict)</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'finance':
        return (
          <div className="mockup-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>Finance & Payroll Portal</span>
              <span className="mockup-badge neutral">Audit Mode</span>
            </div>
            
            <div className="mockup-grid">
              <div className="mockup-card">
                <span className="mockup-card-title">Total Payroll Cost</span>
                <span className="mockup-card-value">₹48,250</span>
                <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>July 2026 Cycle</span>
              </div>
              <div className="mockup-card">
                <span className="mockup-card-title">Tax Thresholds</span>
                <span className="mockup-card-value">Compliance OK</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '0.15rem' }}>
                  <span style={{ fontSize: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '1px 3px', borderRadius: '2px' }}>TDS: 5%</span>
                  <span style={{ fontSize: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '1px 3px', borderRadius: '2px' }}>PF: 12%</span>
                </div>
              </div>
            </div>

            <div className="mockup-card" style={{ flex: 1 }}>
              <span className="mockup-card-title">Expense Claims for Audit</span>
              <div className="mockup-list" style={{ marginTop: '0.2rem' }}>
                <div className="mockup-list-item">
                  <span className="mockup-list-item-title">Client dinner meeting bills</span>
                  <span className="mockup-list-item-status" style={{ color: '#f59e0b' }}>Pending Audit</span>
                </div>
                <div className="mockup-list-item">
                  <span className="mockup-list-item-title">AWS Server Cloud Invoice</span>
                  <span className="mockup-list-item-status" style={{ color: '#10b981' }}>Approved</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'superadmin':
        return (
          <div className="mockup-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>Super Admin Console</span>
              <span className="mockup-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>System Diagnostic</span>
            </div>
            
            <div className="mockup-grid">
              <div className="mockup-card">
                <span className="mockup-card-title">Tenant Companies</span>
                <span className="mockup-card-value">18 Active</span>
                <span style={{ fontSize: '0.55rem', color: '#10b981' }}>All SQLite DB pools OK</span>
              </div>
              <div className="mockup-card">
                <span className="mockup-card-title">Resource Utilization</span>
                <span className="mockup-card-value">12.4% CPU</span>
                <div className="mockup-progress-bar">
                  <div className="mockup-progress-fill" style={{ width: '12%', backgroundColor: '#ef4444' }}></div>
                </div>
              </div>
            </div>

            <div className="mockup-card" style={{ flex: 1 }}>
              <span className="mockup-card-title">System Diagnostic Log Stream</span>
              <div className="mockup-terminal" style={{ marginTop: '0.2rem' }}>
                <div>[SYSTEM] 2026-07-07 16:10:56 - Connection established</div>
                <div>[DATABASE] Migration check: 14 schemas verified [OK]</div>
                <div>[API] Auth Token validation active - JWT module ready</div>
              </div>
            </div>
          </div>
        );
      case 'employee':
      default:
        return (
          <div className="mockup-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>Employee Workspace</span>
              <span className="mockup-badge">
                <span className="mockup-pulse-dot"></span> In Office Geofence
              </span>
            </div>
            
            <div className="mockup-grid">
              <div className="mockup-card">
                <span className="mockup-card-title">Shift Tracker</span>
                <span className="mockup-card-value">08:42:15</span>
                <span style={{ fontSize: '0.55rem', color: '#10b981' }}>Shift Active - Checked In</span>
              </div>
              <div className="mockup-card">
                <span className="mockup-card-title">Geofence Distance</span>
                <span className="mockup-card-value">12 Meters Away</span>
                <div className="mockup-progress-bar">
                  <div className="mockup-progress-fill" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            <div className="mockup-card" style={{ flex: 1 }}>
              <span className="mockup-card-title">My Recent Payslips</span>
              <div className="mockup-list" style={{ marginTop: '0.2rem' }}>
                <div className="mockup-list-item">
                  <span className="mockup-list-item-title">Payslip_2026_APR.pdf</span>
                  <span className="mockup-list-item-status" style={{ color: '#10b981' }}>₹3,420 (Net)</span>
                </div>
                <div className="mockup-list-item">
                  <span className="mockup-list-item-title">Payslip_2026_MAR.pdf</span>
                  <span className="mockup-list-item-status" style={{ color: '#10b981' }}>₹3,420 (Net)</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // Auto-fill logins based on selected portal
  const getInitialCredentials = (role) => {
    switch (role) {
      case 'superadmin':
        return { email: 'superadmin@hrallocate.com', password: 'admin123' };
      case 'hr':
        return { email: 'hr@hrallocate.com', password: 'hr123' };
      case 'finance':
        return { email: 'finance@hrallocate.com', password: 'finance123' };
      case 'employee':
      default:
        return { email: 'employee@hrallocate.com', password: 'emp123' };
    }
  };

  const initialCreds = getInitialCredentials(initialRole || 'employee');
  const [email, setEmail] = useState(initialCreds.email);
  const [password, setPassword] = useState(initialCreds.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Setup Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    companyName: '',
    companyCode: '',
    branchName: 'Main Head Office',
    branchAddress: '',
    latitude: '12.9716',
    longitude: '77.5946',
    radiusMeters: '200',
    departmentName: 'Engineering',
    designationName: 'Software Engineer',
    salaryBasic: '50',
    salaryHra: '25',
    geofenceEnabled: 'true',
    leaveTotalDays: '12',
    hrName: '',
    hrEmail: '',
    hrPassword: ''
  });
  const [wizardSuccess, setWizardSuccess] = useState(false);

  // Portal Theme Definitions
  const portalThemes = {
    employee: {
      name: 'Employee Portal',
      accent: '#0047B8',
      desc: 'Access your work dashboard, check-in, and view payslips.',
      rgb: '0, 71, 184',
      gradient: 'linear-gradient(135deg, #0047B8 0%, #1e40af 100%)',
      heroTitle: 'Empower Your Workday',
      heroDesc: 'Clock-in using GPS geofencing, track your working hours in real-time, view verified payslips, and manage your leaves effortlessly.'
    },
    hr: {
      name: 'HR Management Portal',
      accent: '#E30613',
      desc: 'Manage payroll, branch setup, company rules, and directory.',
      rgb: '227, 6, 19',
      gradient: 'linear-gradient(135deg, #E30613 0%, #be123c 100%)',
      heroTitle: 'Streamline HR Operations',
      heroDesc: 'Onboard employees, configure custom branch geofencing parameters, approve leave requests, and manage corporate hierarchies from a single panel.'
    },
    finance: {
      name: 'Finance & CA Operations',
      accent: '#0d9488',
      desc: 'Configure tax limits, process monthly cycles, and audit expenses.',
      rgb: '13, 148, 136',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
      heroTitle: 'Automated Payroll & Compliance',
      heroDesc: 'Generate monthly payslip cycles, audit corporate expense reimbursement claims, and configure automated TDS, PF, and ESI tax thresholds.'
    },
    superadmin: {
      name: 'Super Admin Console',
      accent: '#475569',
      desc: 'System diagnostics and global corporation registrations.',
      rgb: '71, 85, 105',
      gradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
      heroTitle: 'Global Platform Control',
      heroDesc: 'Register new client companies, monitor tenant active plans, configure system parameters, and diagnose database performance.'
    }
  };
  
  const theme = portalThemes[roleMode] || portalThemes.employee;

  const selectPortalRole = (role) => {
    setRoleMode(role);
    setError(null);
    const creds = getInitialCredentials(role);
    setEmail(creds.email);
    setPassword(creds.password);
  };

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
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleWizardChange = (e) => {
    const { name, value } = e.target;
    setWizardData(prev => ({ ...prev, [name]: value }));
  };

  const handleWizardSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/auth/register-wizard', wizardData);
      setWizardSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration wizard failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container" style={{ '--theme-accent': theme.accent, '--theme-accent-rgb': theme.rgb }}>
      <div className="login-left-panel">
        <div className={`login-form-wrapper ${activeTab === 'register' ? 'login-form-wrapper-wide' : ''}`}>
        
        {/* Brand Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Logo width={185} height={46} />
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 500 }}>
            Enterprise HR & Payroll Automation
          </p>
        </div>

        {/* Portal-Specific Subheader Banner */}
        {initialRole && (
          <div style={{
            textAlign: 'center',
            marginBottom: '1.75rem',
            padding: '0.85rem 1rem',
            backgroundColor: `${theme.accent}0a`,
            border: `1px solid ${theme.accent}18`,
            borderRadius: '10px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <h3 style={{ color: theme.accent, fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
              {theme.name}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.725rem', marginTop: '0.25rem', margin: 0, lineHeight: '1.4' }}>
              {theme.desc}
            </p>
          </div>
        )}

        {/* Tab Selector */}
        {(!initialRole || initialRole === 'hr') && (
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '0.25rem',
            marginBottom: '1.75rem'
          }}>
            <button
              onClick={() => { setActiveTab('login'); setError(null); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: activeTab === 'login' ? '#ffffff' : 'transparent',
                color: activeTab === 'login' ? theme.accent : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeTab === 'login' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Portal Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); setWizardStep(1); setWizardSuccess(false); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: activeTab === 'register' ? '#ffffff' : 'transparent',
                color: activeTab === 'register' ? theme.accent : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeTab === 'register' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Register Company (Wizard)
            </button>
          </div>
        )}

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

        {/* TAB 1: LOGIN PORTAL */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Quick Demo Role Cards / Demo credentials info */}
            {!initialRole ? (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>
                  Select Portal Mode (Pre-fills Credentials):
                </span>
                <div className="role-grid-container">
                  {[
                    { label: 'Employee', role: 'employee', icon: MdPeople },
                    { label: 'HR Admin', role: 'hr', icon: MdBusiness },
                    { label: 'Finance/CA', role: 'finance', icon: MdPayments },
                    { label: 'Super Admin', role: 'superadmin', icon: MdAdminPanelSettings }
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => selectPortalRole(item.role)}
                      className={`role-card-btn ${roleMode === item.role ? 'active' : ''}`}
                    >
                      <item.icon className="role-card-icon" />
                      <span className="role-card-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: `1px dashed ${theme.accent}40`,
                fontSize: '0.75rem',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Evaluation Mode (Auto-filled Demo Account):</span>
                <div>Email: <code style={{ backgroundColor: '#fff', padding: '1px 4px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>{email}</code></div>
                <div>Password: <code style={{ backgroundColor: '#fff', padding: '1px 4px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>{password}</code></div>
              </div>
            )}

            {/* Email Field */}
            <div className="login-input-group">
              <label className="login-input-label">Email Address</label>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <MdMail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="login-input-field"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="login-input-label">Password</label>
                <a href="#" style={{ fontSize: '0.75rem', color: theme.accent, textDecoration: 'none', fontWeight: 600 }}>Forgot?</a>
              </div>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <MdLock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="login-input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="login-password-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? 'Logging in...' : `Enter ${roleMode.toUpperCase()} Portal`}
            </button>

            {/* Switch Portal Action Link */}
            {initialRole && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Switch to Another Workspace Gateway:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
                  {['employee', 'hr', 'finance', 'superadmin'].filter(r => r !== initialRole).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => navigate(`/${r}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.accent,
                        fontSize: '0.8rem',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      {r === 'hr' ? 'HR' : r === 'finance' ? 'Finance' : r === 'superadmin' ? 'Super Admin' : 'Employee'}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </form>
        )}

        {/* TAB 2: REGISTER COMPANY WIZARD (9 Steps) */}
        {activeTab === 'register' && (
          <div>
            {wizardSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <MdCheckCircle size={64} color={theme.accent} style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Company Setup Complete!</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                  Your company and default configurations have been successfully created.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setRoleMode('hr');
                    setEmail(wizardData.hrEmail);
                    setPassword(wizardData.hrPassword);
                  }}
                  style={{
                    backgroundColor: theme.accent,
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Proceed to HR Login
                </button>
              </div>
            ) : (
              <div>
                {/* Wizard steps indicator bar */}
                <div className="wizard-progress-bar-container">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
                    <span 
                      key={step} 
                      className={`wizard-progress-step ${wizardStep === step ? 'active' : ''} ${wizardStep > step ? 'completed' : ''}`}
                    >
                      Step {step}
                    </span>
                  ))}
                </div>

                <div className="wizard-step-card" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Step 1: Company details */}
                  {wizardStep === 1 && (
                    <div>
                      <h4 className="wizard-step-title">Step 1: Company Profile</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Company Name</label>
                          <input type="text" name="companyName" value={wizardData.companyName} onChange={handleWizardChange} placeholder="e.g. Acme Corp" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Short Code</label>
                          <input type="text" name="companyCode" value={wizardData.companyCode} onChange={handleWizardChange} placeholder="e.g. ACME" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Branch Creation */}
                  {wizardStep === 2 && (
                    <div>
                      <h4 className="wizard-step-title">Step 2: Geofenced Branch Creation</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Branch Name</label>
                          <input type="text" name="branchName" value={wizardData.branchName} onChange={handleWizardChange} placeholder="Headquarters" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Office Latitude</label>
                            <input type="text" name="latitude" value={wizardData.latitude} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Office Longitude</label>
                            <input type="text" name="longitude" value={wizardData.longitude} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Radius (Meters)</label>
                            <input type="text" name="radiusMeters" value={wizardData.radiusMeters} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Departments */}
                  {wizardStep === 3 && (
                    <div>
                      <h4 className="wizard-step-title">Step 3: Initial Department</h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Department Name</label>
                        <input type="text" name="departmentName" value={wizardData.departmentName} onChange={handleWizardChange} placeholder="e.g. Engineering, Sales, HR" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Designations */}
                  {wizardStep === 4 && (
                    <div>
                      <h4 className="wizard-step-title">Step 4: Designation Parameters</h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Designation Name</label>
                        <input type="text" name="designationName" value={wizardData.designationName} onChange={handleWizardChange} placeholder="e.g. Senior Developer" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  )}

                  {/* Step 5: Salary Components */}
                  {wizardStep === 5 && (
                    <div>
                      <h4 className="wizard-step-title">Step 5: Salary Components Allocation</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Basic (% of Gross)</label>
                          <input type="number" name="salaryBasic" value={wizardData.salaryBasic} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>HRA (% of Gross)</label>
                          <input type="number" name="salaryHra" value={wizardData.salaryHra} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Attendance Rules */}
                  {wizardStep === 6 && (
                    <div>
                      <h4 className="wizard-step-title">Step 6: Attendance Rules</h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Enable GPS Geofencing Check-in?</label>
                        <select name="geofenceEnabled" value={wizardData.geofenceEnabled} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#1e293b' }}>
                          <option value="true">Yes, strict geofence radius check</option>
                          <option value="false">No, allow clock-in anywhere</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Step 7: Leave Policies */}
                  {wizardStep === 7 && (
                    <div>
                      <h4 className="wizard-step-title">Step 7: Leave Policies</h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Total Casual/Sick Leaves Allocated (Annual)</label>
                        <input type="number" name="leaveTotalDays" value={wizardData.leaveTotalDays} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  )}

                  {/* Step 8: Invite Employees / Admin User creation */}
                  {wizardStep === 8 && (
                    <div>
                      <h4 className="wizard-step-title">Step 8: HR / Company Owner Credentials</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Full Name</label>
                          <input type="text" name="hrName" value={wizardData.hrName} onChange={handleWizardChange} placeholder="John Doe" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Login Email</label>
                            <input type="email" name="hrEmail" value={wizardData.hrEmail} onChange={handleWizardChange} placeholder="owner@company.com" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Login Password</label>
                            <input type="password" name="hrPassword" value={wizardData.hrPassword} onChange={handleWizardChange} placeholder="••••••••" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 9: Review & Submit */}
                  {wizardStep === 9 && (
                    <div>
                      <h4 className="wizard-step-title">Step 9: Review Settings & Submit</h4>
                      <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div><strong>Company:</strong> {wizardData.companyName} ({wizardData.companyCode})</div>
                        <div><strong>Geofence Branch:</strong> {wizardData.branchName} ({wizardData.radiusMeters}m radius)</div>
                        <div><strong>Operations Department:</strong> {wizardData.departmentName}</div>
                        <div><strong>Salary Rule:</strong> {wizardData.salaryBasic}% Basic / {wizardData.salaryHra}% HRA</div>
                        <div><strong>HR Admin Account:</strong> {wizardData.hrEmail}</div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                        Clicking Register creates the database schema records and sets up permissions.
                      </p>
                    </div>
                  )}

                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  {wizardStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep(prev => prev - 1)}
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <MdArrowBack /> Back
                    </button>
                  ) : <div />}

                  {wizardStep < 9 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep(prev => prev + 1)}
                      style={{
                        backgroundColor: theme.accent,
                        color: '#fff',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      Next <MdArrowForward />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleWizardSubmit}
                      disabled={loading}
                      style={{
                        backgroundColor: theme.accent,
                        color: '#fff',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {loading ? 'Configuring System...' : 'Finish Setup & Register'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        </div> {/* login-form-wrapper */}
      </div> {/* login-left-panel */}

      {activeTab === 'login' && (
        <div className="login-right-panel" style={{ background: theme.gradient }}>
          {/* Dynamic Mockup Window */}
          <div className="mockup-window">
            <div className="mockup-header">
              <div className="mockup-dots">
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
              </div>
              <div className="mockup-title-bar">{window.location.host}/{roleMode}</div>
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                <div className="mockup-sidebar-item active"></div>
                <div className="mockup-sidebar-item"></div>
                <div className="mockup-sidebar-item"></div>
                <div className="mockup-sidebar-item"></div>
              </div>
              {renderDashboardMockup()}
            </div>
          </div>

          <h2 className="login-hero-title" style={{ marginTop: '2.5rem' }}>{theme.heroTitle}</h2>
          <p className="login-hero-desc">{theme.heroDesc}</p>
        </div>
      )}
    </div>
  );
}
