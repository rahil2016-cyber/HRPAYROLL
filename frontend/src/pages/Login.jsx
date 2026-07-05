import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../components/Logo';
import { MdBusiness, MdLock, MdMail, MdPeople, MdArrowForward, MdArrowBack, MdCheckCircle } from 'react-icons/md';

export default function Login({ onLoginSuccess, initialRole, initialTab = 'login' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab); // login or register
  const [roleMode, setRoleMode] = useState(initialRole || 'employee'); // superadmin, hr, finance, employee

  // Auto-fill logins based on selected portal
  const getInitialCredentials = (role) => {
    switch (role) {
      case 'superadmin':
        return { email: 'superadmin@hrpayroll.com', password: 'admin123' };
      case 'hr':
        return { email: 'hr@hrpayroll.com', password: 'hr123' };
      case 'finance':
        return { email: 'finance@hrpayroll.com', password: 'finance123' };
      case 'employee':
      default:
        return { email: 'employee@hrpayroll.com', password: 'emp123' };
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
      rgb: '0, 71, 184'
    },
    hr: {
      name: 'HR Management Portal',
      accent: '#E30613',
      desc: 'Manage payroll, branch setup, company rules, and directory.',
      rgb: '227, 6, 19'
    },
    finance: {
      name: 'Finance & CA Operations',
      accent: '#0d9488',
      desc: 'Configure tax limits, process monthly cycles, and audit expenses.',
      rgb: '13, 148, 136'
    },
    superadmin: {
      name: 'Super Admin Console',
      accent: '#475569',
      desc: 'System diagnostics and global corporation registrations.',
      rgb: '71, 85, 105'
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
      const response = await axios.post('http://localhost:8000/index.php?route=/api/auth/login', {
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
      await axios.post('http://localhost:8000/index.php?route=/api/auth/register-wizard', wizardData);
      setWizardSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration wizard failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: activeTab === 'login' ? '500px' : '750px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: `0 20px 25px -5px rgba(${theme.rgb}, 0.08), 0 10px 10px -5px rgba(${theme.rgb}, 0.04)`,
        border: '1px solid #e2e8f0',
        padding: '2.5rem',
        transition: 'max-width 0.3s'
      }}>
        
        {/* Brand Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Logo width={180} height={45} />
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 500 }}>
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
            <h3 style={{ color: theme.accent, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
              {theme.name}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', margin: 0, lineHeight: '1.4' }}>
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
            marginBottom: '2rem'
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
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                  Select Portal Mode (Pre-fills Credentials):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {[
                    { label: 'Employee', role: 'employee' },
                    { label: 'HR Admin', role: 'hr' },
                    { label: 'Finance/CA', role: 'finance' },
                    { label: 'Super Admin', role: 'superadmin' }
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => selectPortalRole(item.role)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid',
                        borderColor: roleMode === item.role ? theme.accent : '#cbd5e1',
                        borderRadius: '6px',
                        backgroundColor: roleMode === item.role ? `${theme.accent}0d` : '#fff',
                        color: roleMode === item.role ? theme.accent : '#475569',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item.label}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <MdMail style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Password</label>
                <a href="#" style={{ fontSize: '0.75rem', color: theme.accent, textDecoration: 'none', fontWeight: 600 }}>Forgot?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <MdLock style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                backgroundColor: theme.accent,
                color: '#fff',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? 'Logging in...' : `Enter ${roleMode.toUpperCase()} Portal`}
            </button>

            {/* Switch Portal Action Link */}
            {initialRole && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = theme.accent}
                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                >
                  ← Go back to Portal Selection
                </button>
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '2rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.75rem'
                }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
                    <span 
                      key={step} 
                      style={{ 
                        color: wizardStep === step ? theme.accent : (wizardStep > step ? '#0047B8' : '#94a3b8'),
                        borderBottom: wizardStep === step ? `2px solid ${theme.accent}` : 'none',
                        paddingBottom: '0.25rem'
                      }}
                    >
                      Step {step}
                    </span>
                  ))}
                </div>

                <div style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Step 1: Company details */}
                  {wizardStep === 1 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 1: Company Profile</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Company Name</label>
                          <input type="text" name="companyName" value={wizardData.companyName} onChange={handleWizardChange} placeholder="e.g. Acme Corp" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Short Code</label>
                          <input type="text" name="companyCode" value={wizardData.companyCode} onChange={handleWizardChange} placeholder="e.g. ACME" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Branch Creation */}
                  {wizardStep === 2 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 2: Geofenced Branch Creation</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Branch Name</label>
                          <input type="text" name="branchName" value={wizardData.branchName} onChange={handleWizardChange} placeholder="Headquarters" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Office Latitude</label>
                            <input type="text" name="latitude" value={wizardData.latitude} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Office Longitude</label>
                            <input type="text" name="longitude" value={wizardData.longitude} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Radius (Meters)</label>
                            <input type="text" name="radiusMeters" value={wizardData.radiusMeters} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Departments */}
                  {wizardStep === 3 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 3: Initial Department</h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Department Name</label>
                        <input type="text" name="departmentName" value={wizardData.departmentName} onChange={handleWizardChange} placeholder="e.g. Engineering, Sales, HR" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Designations */}
                  {wizardStep === 4 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 4: Designation Parameters</h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Designation Name</label>
                        <input type="text" name="designationName" value={wizardData.designationName} onChange={handleWizardChange} placeholder="e.g. Senior Developer" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  )}

                  {/* Step 5: Salary Components */}
                  {wizardStep === 5 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 5: Salary Components Allocation</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Basic (% of Gross)</label>
                          <input type="number" name="salaryBasic" value={wizardData.salaryBasic} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>HRA (% of Gross)</label>
                          <input type="number" name="salaryHra" value={wizardData.salaryHra} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Attendance Rules */}
                  {wizardStep === 6 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 6: Attendance Rules</h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Enable GPS Geofencing Check-in?</label>
                        <select name="geofenceEnabled" value={wizardData.geofenceEnabled} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          <option value="true">Yes, strict geofence radius check</option>
                          <option value="false">No, allow clock-in anywhere</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Step 7: Leave Policies */}
                  {wizardStep === 7 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 7: Leave Policies</h4>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Total Casual/Sick Leaves Allocated (Annual)</label>
                        <input type="number" name="leaveTotalDays" value={wizardData.leaveTotalDays} onChange={handleWizardChange} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  )}

                  {/* Step 8: Invite Employees / Admin User creation */}
                  {wizardStep === 8 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 8: HR / Company Owner Credentials</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                          <input type="text" name="hrName" value={wizardData.hrName} onChange={handleWizardChange} placeholder="John Doe" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Login Email</label>
                            <input type="email" name="hrEmail" value={wizardData.hrEmail} onChange={handleWizardChange} placeholder="owner@company.com" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Login Password</label>
                            <input type="password" name="hrPassword" value={wizardData.hrPassword} onChange={handleWizardChange} placeholder="••••••••" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 9: Review & Submit */}
                  {wizardStep === 9 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>Step 9: Review Settings & Submit</h4>
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

      </div>
    </div>
  );
}
