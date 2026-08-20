import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from 'axios';
import Logo from '../components/Logo';
import { 
  MdPeople, 
  MdBusiness, 
  MdAttachMoney, 
  MdSecurity, 
  MdLocationOn, 
  MdTimeline, 
  MdReceiptLong, 
  MdLayers,
  MdArrowForward,
  MdClose,
  MdEmail,
  MdPhone,
  MdInfo,
  MdCheckCircle,
  MdArrowRightAlt
} from 'react-icons/md';

export default function PortalSelection() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isHoveredDashboard, setIsHoveredDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, services, pricing, about, contact
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  // Feature tab showcase state
  const [activeFeatureTab, setActiveFeatureTab] = useState('salary'); // salary, compliance, employee, partner

  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    company_name: '',
    phone: '',
    message: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Original colors
  const themeBlue = '#0047B8';
  const themeLightBlue = '#e0f2fe';
  const themeDarkBlue = '#0b1d3a';

  // Zoho-inspired accent palette (used for badges, bullets, and highlights)
  const zohoRed = '#E42527';
  const zohoGreen = '#089949';
  const zohoBlue = '#226DB4';
  const zohoYellow = '#F9B21D';

  const portals = [
    {
      id: 'hr',
      title: 'Hire Portal',
      subtitle: '01',
      description: 'Manage employee onboarding, geofenced tracking, and team attendance.',
      icon: MdBusiness,
      route: '/login/hr',
      color: zohoRed
    },
    {
      id: 'finance',
      title: 'Pay Portal',
      subtitle: '02',
      description: 'Automate salary calculation, statutory deductions, tax returns, and payslips.',
      icon: MdAttachMoney,
      route: '/login/finance',
      color: zohoGreen
    },
    {
      id: 'employee',
      title: 'Manage Portal',
      subtitle: '03',
      description: 'Check payslips, submit leaves, and verify attendance records easily.',
      icon: MdPeople,
      route: '/login/employee',
      color: zohoBlue
    }
  ];

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const apiBase = window.API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin);
      await axiosInstance.post(apiBase + '/index.php?route=/api/auth/book-demo', demoForm);
      setSubmitSuccess(true);
      setDemoForm({
        name: '',
        email: '',
        company_name: '',
        phone: '',
        message: ''
      });
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit demo request. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fdfdfd',
      color: '#1e293b',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Inject Keyframe Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulsePlay {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 71, 184, 0.4); }
          70% { transform: scale(1.06); box-shadow: 0 0 0 10px rgba(0, 71, 184, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 71, 184, 0); }
        }
        .zoho-logo-tile {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          display: inline-block;
        }
      `}</style>

      {/* Top Header Banner */}
      <div style={{
        backgroundColor: '#f1f5f9',
        fontSize: '0.8rem',
        padding: '0.45rem 1rem',
        textAlign: 'center',
        fontWeight: 500,
        color: '#475569',
        borderBottom: '1px solid #e2e8f0'
      }}>
        🎉 Looking for complete Indian Tax compliance (PF, ESI, TDS)? Let us manage it for you. 
        <button onClick={() => setShowDemoModal(true)} style={{ background: 'none', border: 'none', color: themeBlue, fontWeight: 700, marginLeft: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}>
          Schedule free setup guidance
        </button>
      </div>

      {/* Main Navigation Header */}
      <header style={{
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 15px rgba(0, 0, 0, 0.04)',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Zoho-styled Logo with colors */}
          <div 
            onClick={() => setActiveTab('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', width: '18px' }}>
              <span className="zoho-logo-tile" style={{ backgroundColor: zohoRed }} />
              <span className="zoho-logo-tile" style={{ backgroundColor: zohoBlue }} />
              <span className="zoho-logo-tile" style={{ backgroundColor: zohoYellow }} />
              <span className="zoho-logo-tile" style={{ backgroundColor: zohoGreen }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2' + 'rem', fontFamily: "'Outfit', sans-serif", fontSize: '1.35rem', fontWeight: 800 }}>
              <span style={{ color: themeBlue }}>HR</span>
              <span style={{ color: themeDarkBlue }}>Allocate</span>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: themeBlue, padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.35rem', fontWeight: 600 }}>Payroll</span>
            </div>
          </div>

          {/* Clean Navigation Options */}
          <nav style={{ display: 'flex', gap: '1.75rem' }}>
            {['home', 'services', 'pricing', 'about', 'contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: activeTab === tab ? themeBlue : '#475569',
                  cursor: 'pointer',
                  padding: '0.5rem 0',
                  position: 'relative',
                  transition: 'color 0.2s ease'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: themeBlue,
                    borderRadius: '2px'
                  }} />
                )}
              </button>
            ))}
          </nav>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                const el = document.getElementById('gateways');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setActiveTab('home');
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#475569',
                border: '1.5px solid #cbd5e1',
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = themeBlue; e.currentTarget.style.color = themeBlue; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
            >
              Sign In Portals
            </button>
            
            <button
              onClick={() => setShowDemoModal(true)}
              style={{
                backgroundColor: zohoRed,
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.35rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c51d20'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = zohoRed}
            >
              Book a Free Demo
            </button>
          </div>
        </div>
      </header>

      {/* Main Section content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <>
            {/* Zoho Hero Layout: Split text and mockup */}
            <section style={{
              background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
              padding: '5.5rem 1.5rem 4rem 1.5rem',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '3.5rem',
                alignItems: 'center'
              }}>
                {/* Left text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  <span style={{
                    alignSelf: 'flex-start',
                    color: zohoBlue,
                    backgroundColor: '#e6f0ff',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}>
                    INDIAN PAYROLL SOFTWARE
                  </span>

                  <h1 style={{
                    fontSize: '2.8rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: themeDarkBlue,
                    margin: 0,
                    letterSpacing: '-0.01em'
                  }}>
                    Your search for the perfect <span style={{ color: themeBlue }}>payroll software</span> ends here.
                  </h1>

                  <p style={{
                    fontSize: '1.05rem',
                    color: '#475569',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    HR Allocate is a secure, comprehensive solution designed to automate payroll calculations, coordinate leave, track attendance with face verification, and manage tax compliances flawlessly.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#334155' }}>
                    {[
                      'Complete compliance coverage (EPF, ESI, Professional Tax, TDS)',
                      'GPS geofenced & AI Face Liveness check-in gates',
                      'Chartered Accountant & Finance partner audit portal integrations'
                    ].map((bullet, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <MdCheckCircle size={18} style={{ color: zohoGreen, flexShrink: 0 }} />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setShowDemoModal(true)}
                      style={{
                        backgroundColor: themeBlue,
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.85rem 1.8rem',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#003bab'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeBlue}
                    >
                      Schedule Setup Call
                    </button>

                    <button
                      onClick={() => setShowVideoModal(true)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: themeBlue,
                        border: '1.5px solid #cbd5e1',
                        padding: '0.85rem 1.8rem',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = themeBlue; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#e6f0ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulsePlay 2s infinite'
                      }}>
                        <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
                          <path d="M1 1L5 4L1 7V1Z" fill={themeBlue} />
                        </svg>
                      </div>
                      See How it Works
                    </button>
                  </div>
                </div>

                {/* Right Interactive Mockup Dashboard */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '480px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    fontFamily: 'inherit'
                  }}>
                    {/* Mock Browser Header */}
                    <div style={{
                      backgroundColor: '#f1f5f9',
                      padding: '0.65rem 1rem',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zohoRed }} />
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zohoYellow }} />
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zohoGreen }} />
                      <span style={{
                        marginLeft: '1rem',
                        fontSize: '0.7rem',
                        backgroundColor: '#ffffff',
                        padding: '0.1rem 2rem',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        color: '#94a3b8'
                      }}>
                        hrallocate.in/payroll/dashboard
                      </span>
                    </div>

                    {/* Mock Content */}
                    <div style={{ padding: '1.25rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ color: themeDarkBlue, fontSize: '0.9rem' }}>Apex Tech Solutions Ltd.</strong>
                          <span style={{ display: 'block', color: '#64748b', fontSize: '0.7rem' }}>Admin Dashboard</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: zohoGreen, fontWeight: 700, backgroundColor: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          ✓ Active Session
                        </span>
                      </div>

                      {/* Stat summary inside mockup */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.65rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>TOTAL EMPLOYEES</span>
                          <strong style={{ display: 'block', fontSize: '1.1rem', color: themeDarkBlue }}>256 Active</strong>
                        </div>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.65rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>MONTHLY PAYROLL</span>
                          <strong style={{ display: 'block', fontSize: '1.1rem', color: themeBlue }}>₹12,48,500</strong>
                        </div>
                      </div>

                      {/* Fake graphical list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        {[
                          { title: 'Tax Deductions (TDS)', stat: 'Ready to File', col: zohoBlue },
                          { title: 'Provident Fund (EPF)', stat: 'Accrued', col: zohoGreen },
                          { title: 'ESI Contribution', stat: 'Accrued', col: zohoYellow }
                        ].map((m, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                            <span style={{ fontWeight: 600, color: '#334155' }}>{m.title}</span>
                            <span style={{ fontSize: '0.7rem', color: m.col, fontWeight: 700 }}>● {m.stat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-15px',
                    left: '-20px',
                    backgroundColor: '#0b1d3a',
                    color: '#ffffff',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    fontSize: '0.8rem',
                    animation: 'float 5s ease-in-out infinite'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: zohoGreen }} />
                    <div>
                      <strong style={{ display: 'block' }}>100% Tax Compliant</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Auto-aligned to FY 2026-27</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Portal Selection Gateways: 3 Columns Grid */}
            <section id="gateways" style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '6rem 1.5rem 5rem 1.5rem'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <span style={{ color: themeBlue, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SECURE ACCESS GATEWAYS
                </span>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: themeDarkBlue, marginTop: '0.5rem' }}>
                  Log in to your respective portal to manage operations
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  Please select your role from the modules below to access the secure login gateway.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                {portals.map((portal, index) => {
                  const Icon = portal.icon;
                  const isHovered = hoveredCard === index;

                  return (
                    <div
                      key={portal.id}
                      onClick={() => navigate(portal.route)}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        backgroundColor: '#ffffff',
                        border: `1.5px solid ${isHovered ? themeBlue : '#e2e8f0'}`,
                        borderRadius: '8px',
                        padding: '2.5rem 2rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                        boxShadow: isHovered ? '0 12px 25px rgba(0, 71, 184, 0.06)' : '0 4px 6px rgba(0,0,0,0.01)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '220px',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Colorful header line */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          backgroundColor: portal.color,
                          borderRadius: '8px 8px 0 0'
                        }} />

                        {/* Icon Container */}
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '6px',
                          backgroundColor: isHovered ? portal.color : '#f8fafc',
                          color: isHovered ? '#ffffff' : themeBlue,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '1.5rem',
                          transition: 'all 0.2s'
                        }}>
                          <Icon size={24} />
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '0.65rem' }}>
                          {portal.title}
                        </h3>

                        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                          {portal.description}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        marginTop: '1.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.85rem',
                          color: themeBlue,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          Access Gate <MdArrowRightAlt size={18} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Interactive Feature Tab Section (Zoho-style showcase) */}
            <section style={{
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #f1f5f9',
              borderBottom: '1px solid #f1f5f9',
              padding: '6rem 1.5rem'
            }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                  <span style={{ color: themeBlue, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    PRODUCT HIGHLIGHTS
                  </span>
                  <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: themeDarkBlue, marginTop: '0.5rem' }}>
                    Feature-rich system tailored for modern enterprises
                  </h2>
                </div>

                {/* Tabs Selector */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginBottom: '3rem',
                  flexWrap: 'wrap'
                }}>
                  {[
                    { id: 'salary', label: 'Salary Calculation', accent: zohoRed },
                    { id: 'compliance', label: 'Compliance & PT', accent: zohoGreen },
                    { id: 'employee', label: 'Employee Portal', accent: zohoBlue },
                    { id: 'partner', label: 'Finance Partner Access', accent: zohoYellow }
                  ].map((ft) => (
                    <button
                      key={ft.id}
                      onClick={() => setActiveFeatureTab(ft.id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: '1.5px solid',
                        borderColor: activeFeatureTab === ft.id ? themeBlue : '#e2e8f0',
                        backgroundColor: activeFeatureTab === ft.id ? '#ffffff' : 'transparent',
                        color: activeFeatureTab === ft.id ? themeBlue : '#475569',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ft.accent }} />
                      {ft.label}
                    </button>
                  ))}
                </div>

                {/* Tab content showcase */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '3rem 2.5rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                }}>
                  {activeFeatureTab === 'salary' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '1rem' }}>
                          Flawless Automated Salary Calculations
                        </h3>
                        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                          Calculate gross pay, net deductions, allowances, bonuses, and tax deductions in one single click. Fully supports dynamic monthly shift overrides and leave status reconciliations.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: zohoRed, fontWeight: 'bold' }}>✓</span>
                            <span>Integrates directly with face scan attendance logs</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: zohoRed, fontWeight: 'bold' }}>✓</span>
                            <span>Handles allowance components and customized basic-to-gross percentages</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>SALARY ACCRUAL STRUCTURE</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            <span>Basic Salary (50%)</span>
                            <strong>₹45,000.00</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            <span>House Rent Allowance (HRA)</span>
                            <strong>₹22,500.00</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            <span>Professional Allowance</span>
                            <strong>₹12,500.00</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '0.5rem', color: zohoRed, fontWeight: 600 }}>
                            <span>Accrued TDS Deductions</span>
                            <strong>- ₹8,200.00</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeatureTab === 'compliance' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '1rem' }}>
                          Statutory Compliance: Pre-configured and updated
                        </h3>
                        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                          Automate Provident Fund (EPF), Employee State Insurance (ESI), Professional Tax (PT), and TDS returns according to regional Indian state boundaries.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: zohoGreen, fontWeight: 'bold' }}>✓</span>
                            <span>Generate ECR file format ready for immediate EPF portal uploading</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: zohoGreen, fontWeight: 'bold' }}>✓</span>
                            <span>Automatic updates reflecting latest PT slab tables across states</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '1rem' }}>COMPLIANCE SCORECARD</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: zohoGreen }}>100%</div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.85rem', color: themeDarkBlue }}>Fully Compliant</strong>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>EPF & PT returns finalized.</span>
                          </div>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: '100%', height: '100%', backgroundColor: zohoGreen }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeatureTab === 'employee' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '1rem' }}>
                          Empower your team with Self-Service Portals
                        </h3>
                        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                          Give employees direct portal access to view and download past payslips, register regularizations, check geofenced attendance logs, and file tax investment declarations.
                        </p>
                      </div>
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#ffffff' }}>
                        <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.75rem' }}>Download Payslip</strong>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '0.8rem' }}>
                          <span>Payslip_2026_APR.pdf</span>
                          <button style={{ backgroundColor: themeBlue, color: '#ffffff', border: 'none', padding: '0.3rem 0.85rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFeatureTab === 'partner' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '1rem' }}>
                           Chartered Accountant & Auditor Collaboration
                        </h3>
                        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                          Invite your external CA or consulting auditor firm directly into your HR Allocate environment. They receive independent restricted access to audit books, pull ledger reports, and verify TDS deposits.
                        </p>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ fontSize: '2.5rem' }}>🏢</span>
                        <strong style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.5rem' }}>Auditor Verification Portal</strong>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 1rem 0' }}>Invite your CA for direct verification access</p>
                        <button style={{ backgroundColor: '#0b1d3a', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                          Invite Advisor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <section style={{ maxWidth: '900px', margin: '0 auto', padding: '5rem 1.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '1.5rem', textAlign: 'center' }}>
              Our Payroll Platform Modules
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {[
                { icon: MdLocationOn, title: 'GPS Geofencing Tracking', desc: 'Restrict and track check-ins to exact client sites or branch geofenced coordinates to prevent attendance proxy operations.' },
                { icon: MdReceiptLong, title: 'Indian Statutory Compliances', desc: 'Accrue EPF contributions, ESI, Professional Tax slabs, and TDS deductions dynamically according to local state regulations.' },
                { icon: MdTimeline, title: 'Leave Management Flow', desc: 'Allows employees to submit leaves and managers to approve regularizations with direct balance accrual sync.' }
              ].map((service, i) => (
                <div key={i} style={{ display: 'flex', gap: '1.5rem', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                  <div style={{ color: themeBlue }}><service.icon size={32} /></div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: themeDarkBlue, marginBottom: '0.35rem' }}>{service.title}</h3>
                    <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>{service.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <section style={{ maxWidth: '900px', margin: '0 auto', padding: '5rem 1.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '1rem', textAlign: 'center' }}>
              Simple, transparent pricing plans
            </h2>
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '4rem', fontSize: '1.15rem' }}>
              No hidden setup costs or annual locking periods. Select the tier that works best.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
              {/* Plan 1 */}
              <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifycontent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Platform Self-Managed</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: themeDarkBlue, margin: '0.5rem 0' }}>SaaS Portal</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: themeDarkBlue }}>₹149</span>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/ employee / month</span>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#475569', lineHeight: '2.2', marginBottom: '2rem' }}>
                    <li>GPS Geofence Attendance tracking</li>
                    <li>Automatic PF / ESI / PT slabs calculation</li>
                    <li>Generate client tax invoices</li>
                    <li>Standard email & chat assistance support</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowDemoModal(true)}
                  style={{ width: '100%', padding: '0.75rem', border: `2.5px solid ${themeBlue}`, color: themeBlue, backgroundColor: 'transparent', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Start Free Trial
                </button>
              </div>

              {/* Plan 2 */}
              <div style={{ backgroundColor: '#0b1d3a', color: '#ffffff', borderRadius: '8px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifycontent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase' }}>Assisted Model</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0' }}>Complete CA Assisted</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#93c5fd' }}>₹499</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/ employee / month</span>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '2.2', marginBottom: '2rem' }}>
                    <li>All SaaS Platform tools included</li>
                    <li><strong>Assigned Chartered Accountant firm</strong></li>
                    <li>Filing TDS & quarterly returns processing</li>
                    <li>Priority SLA phone support</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowDemoModal(true)}
                  style={{ width: '100%', padding: '0.75rem', border: 'none', color: '#ffffff', backgroundColor: themeBlue, borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Hire CA Partner
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ABOUT US TAB */}
        {activeTab === 'about' && (
          <section style={{ maxWidth: '800px', margin: '0 auto', padding: '5rem 1.5rem', lineHeight: '1.7' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '1.5rem', textAlign: 'center' }}>
              About HR Allocate
            </h2>
            <p style={{ color: '#475569', fontSize: '1.05rem' }}>
              HR Allocate is engineered to simplify workforce operations and payroll compliance circles. Our mission is to take out the friction of manual attendance logs, professional tax filings, and payslip distribution, so you can spend time growing your business.
            </p>
            <div style={{ borderLeft: `4px solid ${themeBlue}`, padding: '1rem 1.5rem', backgroundColor: '#f1f5f9', borderRadius: '0 8px 8px 0', marginTop: '2rem' }}>
              <strong style={{ color: themeBlue, display: 'block', marginBottom: '0.25rem' }}>Our Core Principle</strong>
              <span style={{ color: '#334155' }}>Enterprise-level security, compliance updates, and transparent operations for businesses in India.</span>
            </div>
          </section>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <section style={{ maxWidth: '600px', margin: '0 auto', padding: '5rem 1.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: themeDarkBlue, marginBottom: '1.5rem', textAlign: 'center' }}>
              Contact Us
            </h2>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '2rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MdEmail size={24} style={{ color: themeBlue }} />
                <div>
                  <h4 style={{ margin: 0, color: themeDarkBlue }}>Email Support</h4>
                  <a href="mailto:support@hrallocate.in" style={{ color: themeBlue, textDecoration: 'none' }}>support@hrallocate.in</a>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MdPhone size={24} style={{ color: themeBlue }} />
                <div>
                  <h4 style={{ margin: 0, color: themeDarkBlue }}>Phone Helpline</h4>
                  <span style={{ color: '#475569' }}>+91 98765 43210</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Book a Demo Modal */}
      {showDemoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 29, 58, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: `1.5px solid ${themeBlue}`,
            width: '100%',
            maxWidth: '480px',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <button
              onClick={() => {
                setShowDemoModal(false);
                setSubmitSuccess(false);
                setSubmitError(null);
              }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <MdClose size={24} />
            </button>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: themeBlue, margin: '0 0 0.5rem 0' }}>
              Book a Setup Walkthrough
            </h3>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Fill in your details below to schedule an onboarding session with our team.
            </p>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <span style={{ fontSize: '3rem' }}>🎉</span>
                <h4 style={{ color: themeBlue, fontSize: '1.1rem', margin: '0.5rem 0' }}>Request Submitted Successfully!</h4>
                <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>
                  We will contact you shortly to schedule the session.
                </p>
                <button
                  onClick={() => setShowDemoModal(false)}
                  style={{
                    marginTop: '1.5rem',
                    backgroundColor: themeBlue,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {submitError && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', fontSize: '0.8rem' }}>
                    {submitError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: themeDarkBlue }}>Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name"
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    style={{ padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: themeDarkBlue }}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    style={{ padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: themeDarkBlue }}>Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Company name"
                    value={demoForm.company_name}
                    onChange={(e) => setDemoForm({ ...demoForm, company_name: e.target.value })}
                    style={{ padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{
                    backgroundColor: themeBlue,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  {submitLoading ? 'Submitting...' : 'Schedule Call'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Video Walkthrough Modal */}
      {showVideoModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: '12px',
            border: `2px solid ${themeBlue}`,
            width: '100%',
            maxWidth: '720px',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowVideoModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8'
              }}
            >
              <MdClose size={22} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ffffff' }}>
              Payroll Process Simulation Video 🎬
            </h3>

            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              height: '340px',
              border: '1px solid #334155',
              overflow: 'hidden'
            }}>
              <video
                src="/demo.mp4"
                controls
                autoPlay
                loop
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', width: '12px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '1px', backgroundColor: zohoRed }} />
              <span style={{ width: '5px', height: '5px', borderRadius: '1px', backgroundColor: zohoBlue }} />
              <span style={{ width: '5px', height: '5px', borderRadius: '1px', backgroundColor: zohoYellow }} />
              <span style={{ width: '5px', height: '5px', borderRadius: '1px', backgroundColor: zohoGreen }} />
            </div>
            <strong style={{ fontSize: '0.9rem', color: themeDarkBlue }}>HR Allocate</strong>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            &copy; {new Date().getFullYear()} HR Allocate. All rights reserved. Registered Indian Payroll Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
