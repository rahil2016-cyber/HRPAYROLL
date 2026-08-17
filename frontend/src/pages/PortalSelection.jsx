import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  MdInfo
} from 'react-icons/md';

export default function PortalSelection() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isHoveredDashboard, setIsHoveredDashboard] = useState(false);
  const [insightRole, setInsightRole] = useState('Developer');
  const [insightCountry, setInsightCountry] = useState('India');
  
  // Navigation & Page Section state
  const [activeTab, setActiveTab] = useState('home'); // home, services, about, contact

  const [showVideoModal, setShowVideoModal] = useState(false);
  // Book a Demo Modal state
  const [showDemoModal, setShowDemoModal] = useState(false);
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

  const themeBlue = '#0047B8';
  const themeLightBlue = '#e0f2fe';
  const themeDarkBlue = '#0b1d3a';

  const portals = [
    {
      id: 'hr',
      title: 'Hire',
      subtitle: '01',
      description: 'Onboard employees quickly and effortlessly.',
      icon: MdBusiness,
      route: '/login/hr'
    },
    {
      id: 'finance',
      title: 'Pay',
      subtitle: '02',
      description: 'Automate payroll and payments with ease.',
      icon: MdAttachMoney,
      route: '/login/finance'
    },
    {
      id: 'employee',
      title: 'Manage',
      subtitle: '03',
      description: 'Track performance, leave, and compliance in one place.',
      icon: MdPeople,
      route: '/login/employee'
    }
  ];

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const apiBase = window.API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin);
      await axios.post(apiBase + '/index.php?route=/api/auth/book-demo', demoForm);
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
      backgroundColor: '#ffffff',
      color: '#0b1d3a',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Inject Keyframe Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes laptopFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulsePlay {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 71, 184, 0.4); }
          70% { transform: scale(1.08); box-shadow: 0 0 0 10px rgba(0, 71, 184, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 71, 184, 0); }
        }
        @keyframes demoScreenPlay {
          0% { opacity: 0.9; }
          50% { opacity: 1; }
          100% { opacity: 0.9; }
        }
        @keyframes floatCard1 {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        @keyframes floatCard2 {
          0% { transform: translateY(0px); }
          50% { transform: translateY(12px); }
          100% { transform: translateY(0px); }
        }
        @keyframes floatCard3 {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes floatCard4 {
          0% { transform: translateY(0px); }
          50% { transform: translateY(8px); }
          100% { transform: translateY(0px); }
        }
        .hero-dot-grid {
          background-color: #ffffff;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(0, 71, 184, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(0, 71, 184, 0.03) 0%, transparent 50%),
            radial-gradient(rgba(0, 71, 184, 0.08) 1.5px, transparent 1.5px);
          background-size: 100% 100%, 100% 100%, 24px 24px;
        }
      `}</style>

      {/* Top Banner & Header */}
      <header style={{
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800 }}>
              <span style={{ color: '#0047B8' }}>HR</span>
              <span style={{ color: '#0f172a' }}>Allocate</span>
            </div>
            
            <nav style={{ display: 'flex', gap: '2rem' }}>
              {['home', 'why_hrallocate', 'services', 'pricing', 'about', 'contact'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: activeTab === tab ? '#0047B8' : '#475569',
                    cursor: 'pointer',
                    textTransform: 'none',
                    padding: '0.5rem 0',
                    position: 'relative',
                    transition: 'color 0.2s ease'
                  }}
                >
                  {tab === 'why_hrallocate' ? 'Why HRAllocate' : 
                   tab === 'pricing' ? 'Pricing' : 
                   tab === 'about' ? 'About Us' : 
                   tab === 'contact' ? 'Contact' : 
                   tab === 'home' ? 'Home' : 'Services'}
                  {activeTab === tab && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: '#0047B8',
                      borderRadius: '2px'
                    }} />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowDemoModal(true)}
              style={{
                backgroundColor: '#0047B8',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00358a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0047B8'}
            >
              <span>Book a Demo</span>
              <MdArrowForward size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <>
            {/* Hero Section */}
            <section className="hero-dot-grid" style={{
              padding: '6rem 1.5rem 5rem 1.5rem',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Soft decorative light blur circles */}
              <div style={{
                position: 'absolute',
                top: '-10%',
                right: '10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(0, 71, 184, 0.06) 0%, transparent 70%)',
                filter: 'blur(50px)',
                zIndex: 1
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '5%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(0, 71, 184, 0.04) 0%, transparent 70%)',
                filter: 'blur(40px)',
                zIndex: 1
              }} />

              <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '4.5rem',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                {/* Left Column: Text Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', zIndex: 10 }}>
                  <div style={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#e6f0ff',
                    color: '#0047B8',
                    padding: '0.45rem 1.1rem',
                    borderRadius: '30px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    boxShadow: '0 2px 8px rgba(0, 71, 184, 0.05)'
                  }}>
                    SMART HR. SIMPLE PAYROLL.
                  </div>
                  
                  <h1 style={{
                    fontSize: '3.6rem',
                    fontWeight: 900,
                    lineHeight: 1.15,
                    margin: 0,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    Everything you need to manage{' '}
                    <span style={{ position: 'relative', display: 'inline-block', color: '#0047B8' }}>
                      your team
                      <svg style={{ position: 'absolute', bottom: '-8px', left: 0, width: '105%', height: '12px' }} viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0,5 Q50,9 100,5" stroke="#0047B8" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </span>
                  </h1>
                  
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#475569',
                    lineHeight: 1.65,
                    margin: 0,
                    maxWidth: '480px'
                  }}>
                    Hire, pay, and manage employees effortlessly. Automate payroll, ensure compliance, and focus on what matters most.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={() => setShowDemoModal(true)}
                      style={{
                        backgroundColor: '#0047B8',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.9rem 2.2rem',
                        borderRadius: '30px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 8px 25px rgba(0, 71, 184, 0.25)',
                        transition: 'transform 0.2s, background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.backgroundColor = '#003bab';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.backgroundColor = '#0047B8';
                      }}
                    >
                      <span>Book a Demo</span>
                      <MdArrowForward size={18} />
                    </button>
                    
                    <button
                      onClick={() => setShowVideoModal(true)}
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#0047B8',
                        border: '1.5px solid #cbd5e1',
                        padding: '0.85rem 1.8rem',
                        borderRadius: '30px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0047B8';
                        e.currentTarget.style.backgroundColor = '#f0f6ff';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#e6f0ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulsePlay 2s infinite'
                      }}>
                        <svg width="10" height="10" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.5 1.5L8.5 6L1.5 10.5V1.5Z" fill="#0047B8" stroke="#0047B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>See How It Works</span>
                    </button>
                  </div>

                  {/* Avatar stack "Trusted by..." */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {[
                          { name: 'US', bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
                          { name: 'AN', bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
                          { name: 'JD', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' }
                        ].map((av, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: av.bg,
                              border: '2px solid #ffffff',
                              marginLeft: idx === 0 ? 0 : '-10px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              color: '#1e293b',
                              zIndex: 3 - idx
                            }}
                          >
                            {av.name}
                          </div>
                        ))}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#0047B8',
                          color: '#ffffff',
                          border: '2px solid #ffffff',
                          marginLeft: '-10px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 800,
                          zIndex: 0
                        }}>
                          +2k
                        </div>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                        Trusted by 2,000+ HR teams worldwide
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: 3D Laptop Mockup & Glassmorphic Floating Badges */}
                <div style={{
                  position: 'relative',
                  minHeight: '480px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 5
                }}>
                  {/* Floating Glassy Sphere 1 */}
                  <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #93c5fd 0%, #3b82f6 70%, #1e3a8a 100%)',
                    boxShadow: 'inset -2px -2px 10px rgba(0,0,0,0.35), 0 12px 24px rgba(59,130,246,0.35)',
                    position: 'absolute',
                    top: '10px',
                    right: '12%',
                    zIndex: 12,
                    animation: 'float 6s ease-in-out infinite'
                  }} />

                  {/* Floating Glassy Sphere 2 */}
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, #e0f2fe 0%, #60a5fa 70%, #1d4ed8 100%)',
                    boxShadow: 'inset -1px -1px 5px rgba(0,0,0,0.3), 0 8px 16px rgba(59,130,246,0.2)',
                    position: 'absolute',
                    bottom: '80px',
                    left: '2%',
                    zIndex: 12,
                    animation: 'float 8s ease-in-out infinite 1.5s'
                  }} />

                  {/* Floating Card 1: Payroll Processed Success */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 12px 30px rgba(0, 71, 184, 0.1)',
                    borderRadius: '16px',
                    padding: '0.65rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    zIndex: 20,
                    position: 'absolute',
                    top: '20%',
                    left: '-8%',
                    animation: 'floatCard1 5.5s ease-in-out infinite'
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>✔</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a' }}>Payroll Processed</span>
                      <span style={{ fontSize: '7px', fontWeight: 600, color: '#16a34a' }}>Success</span>
                    </div>
                  </div>

                  {/* Floating Card 2: New Employee Onboarded */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 12px 30px rgba(0, 71, 184, 0.1)',
                    borderRadius: '16px',
                    padding: '0.65rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    zIndex: 20,
                    position: 'absolute',
                    bottom: '18%',
                    left: '-4%',
                    animation: 'floatCard2 6.5s ease-in-out infinite 0.75s'
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#e0f2fe',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px'
                    }}>👤</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a' }}>New Employee Onboarded</span>
                      <span style={{ fontSize: '7px', fontWeight: 600, color: '#64748b' }}>256 Total</span>
                    </div>
                  </div>

                  {/* Floating Card 3: Leave Approved */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 12px 30px rgba(0, 71, 184, 0.1)',
                    borderRadius: '16px',
                    padding: '0.65rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    zIndex: 20,
                    position: 'absolute',
                    top: '12%',
                    right: '-8%',
                    animation: 'floatCard3 7.5s ease-in-out infinite 1.25s'
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>✔</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a' }}>Leave Approved</span>
                      <span style={{ fontSize: '7px', fontWeight: 600, color: '#16a34a' }}>Done</span>
                    </div>
                  </div>

                  {/* Floating Card 4: 100% Compliance */}
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 12px 30px rgba(0, 71, 184, 0.1)',
                    borderRadius: '16px',
                    padding: '0.65rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    zIndex: 20,
                    position: 'absolute',
                    bottom: '22%',
                    right: '-6%',
                    animation: 'floatCard4 6s ease-in-out infinite 0.25s'
                  }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#e6f0ff',
                      color: '#0047B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px'
                    }}>🛡</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#0f172a' }}>100% Compliance</span>
                      <span style={{ fontSize: '7px', fontWeight: 600, color: '#0047B8' }}>All Good</span>
                    </div>
                  </div>

                  {/* Main Laptop 3D Body Wrapper */}
                  <div 
                    onMouseEnter={() => setIsHoveredDashboard(true)}
                    onMouseLeave={() => setIsHoveredDashboard(false)}
                    style={{
                      transform: isHoveredDashboard 
                        ? 'perspective(1200px) rotateY(-8deg) rotateX(6deg) rotateZ(-1deg) scale(1.02)' 
                        : 'perspective(1200px) rotateY(-16deg) rotateX(10deg) rotateZ(-2deg)',
                      transition: 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: 10,
                      position: 'relative'
                    }}
                  >
                    {/* Shadow floating underneath */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-35px',
                      left: '8%',
                      width: '84%',
                      height: '25px',
                      backgroundColor: 'rgba(0, 71, 184, 0.15)',
                      borderRadius: '50%',
                      filter: 'blur(12px)',
                      zIndex: -1,
                      transition: 'transform 0.5s ease',
                      transform: isHoveredDashboard ? 'scale(0.9) translateY(4px)' : 'scale(1)'
                    }} />

                    {/* Screen Bezel / Container */}
                    <div style={{
                      width: '450px',
                      height: '295px',
                      backgroundColor: '#1e293b',
                      borderRadius: '18px',
                      padding: '8px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.22)',
                      border: '2px solid #475569',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Inner Screen displaying Dashboard */}
                      <div style={{
                        flex: 1,
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '9px',
                        color: '#0f172a'
                      }}>
                        {/* Mock Dashboard Sidebar */}
                        <div style={{
                          width: '44px',
                          backgroundColor: '#0047B8',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '0.75rem 0',
                          gap: '0.85rem'
                        }}>
                          <div style={{ color: '#fff', fontWeight: 800, fontSize: '11px', marginBottom: '0.5rem' }}>HA</div>
                          {['🏠', '👥', '💰', '📅', '📄', '⚙️'].map((ico, idx) => (
                            <span key={idx} style={{ color: idx === 0 ? '#ffffff' : 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>{ico}</span>
                          ))}
                        </div>

                        {/* Mock Dashboard Main Content */}
                        <div style={{ flex: 1, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
                          {/* Top Bar */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ fontSize: '11px', display: 'block' }}>Welcome back, Admin 👋</strong>
                              <span style={{ fontSize: '7px', color: '#64748b' }}>Here's what's happening today.</span>
                            </div>
                            <span style={{ fontSize: '7px', padding: '0.2rem 0.5rem', backgroundColor: '#e2e8f0', borderRadius: '4px', color: '#334155', fontWeight: 600 }}>May 2025</span>
                          </div>

                          {/* Stat Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                            {[
                              { label: 'Total Employees', val: '256', col: '#10b981' },
                              { label: 'Payroll Processed', val: '₹12.5L', col: '#0047B8' },
                              { label: 'Pending Approvals', val: '18', col: '#ef4444' },
                              { label: 'Compliance Status', val: '100%', col: '#10b981' }
                            ].map((st, idx) => (
                              <div key={idx} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.4rem', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                <span style={{ fontSize: '6px', color: '#64748b', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{st.label}</span>
                                <strong style={{ fontSize: '10px', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>{st.val}</strong>
                                <span style={{ fontSize: '5px', color: st.col, display: 'block', marginTop: '0.15rem' }}>● Active</span>
                              </div>
                            ))}
                          </div>

                          {/* Chart & Recent Activity split */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', flex: 1, minHeight: 0 }}>
                            {/* Chart */}
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <strong style={{ fontSize: '7px', color: '#334155' }}>Payroll Overview</strong>
                              <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                {/* simulated line graph */}
                                <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
                                  <path d="M0,35 Q20,25 40,28 T80,10 T100,5" fill="none" stroke="#0047B8" strokeWidth="1.5" />
                                  <path d="M0,35 Q20,25 40,28 T80,10 T100,5 L100,40 L0,40 Z" fill="rgba(0, 71, 184, 0.05)" />
                                </svg>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '5px', color: '#94a3b8' }}>
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
                              </div>
                            </div>

                            {/* Recent Activity */}
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflow: 'hidden' }}>
                              <strong style={{ fontSize: '7px', color: '#334155' }}>Recent Activity</strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {[
                                  { text: 'Payroll for May 2025', desc: 'Completed', time: '2h ago' },
                                  { text: 'New Employee Onboarded', desc: 'Active', time: '5h ago' },
                                  { text: 'Leave Request Approved', desc: 'Success', time: '1d ago' }
                                ].map((act, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.15rem' }}>
                                    <div>
                                      <span style={{ fontSize: '6px', fontWeight: 600, display: 'block' }}>{act.text}</span>
                                      <span style={{ fontSize: '5px', color: '#10b981' }}>{act.desc}</span>
                                    </div>
                                    <span style={{ fontSize: '5px', color: '#94a3b8' }}>{act.time}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Keyboard Base */}
                    <div style={{
                      width: '490px',
                      height: '14px',
                      backgroundColor: '#cbd5e1',
                      borderRadius: '0 0 12px 12px',
                      borderBottom: '4px solid #94a3b8',
                      boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
                    }} />
                  </div>
                </div>
              </div>
            </section>

            {/* Statistics Bar Section */}
            <section style={{ padding: '0 1.5rem', position: 'relative', zIndex: 30 }}>
              <div style={{
                maxWidth: '1100px',
                margin: '-3rem auto 4rem auto',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0, 71, 184, 0.08)',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0, 71, 184, 0.05)',
                padding: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                alignItems: 'center'
              }}>
                {[
                  {
                    icon: '👥',
                    val: '256+',
                    lbl: 'Active Employees'
                  },
                  {
                    icon: '💰',
                    val: '₹12.5L+',
                    lbl: 'Payroll Processed'
                  },
                  {
                    icon: '🛡️',
                    val: '100%',
                    lbl: 'Compliance Rate'
                  },
                  {
                    icon: '🏢',
                    val: '50+',
                    lbl: 'Companies Trust Us'
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    borderRight: idx === 3 ? 'none' : '1px solid #f1f5f9',
                    paddingRight: '1rem'
                  }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: '#e6f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{item.val}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{item.lbl}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Middle Heading Section */}
            <section style={{
              maxWidth: '900px',
              margin: '3rem auto 1rem auto',
              textAlign: 'center',
              padding: '0 1.5rem'
            }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#0047B8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                — BUILT FOR MODERN TEAMS
              </span>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                margin: '0 0 1rem 0',
                fontFamily: "'Outfit', sans-serif"
              }}>
                Hire, pay, and support your{' '}
                <span style={{ position: 'relative', display: 'inline-block', color: '#0047B8' }}>
                  global team
                  <svg style={{ position: 'absolute', bottom: '-6px', left: 0, width: '105%', height: '8px' }} viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0,5 Q50,9 100,5" stroke="#0047B8" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                —ethically and compliantly
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: '#475569',
                maxWidth: '680px',
                margin: '0 auto',
                lineHeight: 1.6
              }}>
                All the tools you need to simplify HR, payroll, and compliance in one powerful platform.
              </p>
            </section>

            {/* 3 Portal Gateway Selection Section */}
            <section id="gateways" style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '2rem 1.5rem 6rem 1.5rem'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2.25rem'
              }}>
                {portals.map((portal, index) => {
                  const IconComponent = portal.icon;
                  const isHovered = hoveredCard === index;

                  return (
                    <div
                      key={portal.id}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        backgroundColor: '#ffffff',
                        border: `1.5px solid ${isHovered ? '#0047B8' : '#e2e8f0'}`,
                        borderRadius: '24px',
                        padding: '2.5rem 2rem',
                        cursor: 'default',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                        boxShadow: isHovered 
                          ? '0 20px 30px rgba(0, 71, 184, 0.08)' 
                          : '0 4px 6px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '260px',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Large background number overlay */}
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        right: '20px',
                        fontSize: '5rem',
                        fontWeight: 900,
                        color: 'rgba(0, 71, 184, 0.04)',
                        userSelect: 'none',
                        lineHeight: 1
                      }}>
                        {portal.subtitle}
                      </span>

                      <div>
                        {/* Icon Wrapper */}
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          backgroundColor: isHovered ? '#0047B8' : '#e6f0ff',
                          color: isHovered ? '#ffffff' : '#0047B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '1.75rem',
                          transition: 'all 0.3s'
                        }}>
                          <IconComponent size={24} />
                        </div>

                        <h4 style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          marginBottom: '0.75rem',
                          letterSpacing: '-0.01em'
                        }}>
                          {portal.title}
                        </h4>

                        <p style={{
                          color: '#475569',
                          fontSize: '0.95rem',
                          lineHeight: '1.6',
                          margin: 0,
                          maxWidth: '85%'
                        }}>
                          {portal.description}
                        </p>
                      </div>

                      <div style={{
                        marginTop: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#e6f0ff',
                          color: '#0047B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s'
                        }}>
                          <MdArrowForward size={20} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === 'why_hrallocate' && (
          <section style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '4rem 1.5rem',
            lineHeight: '1.7'
          }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>
              Why Choose HRAllocate?
            </h2>
            <p style={{ color: '#475569', textAlign: 'center', marginBottom: '3.5rem', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
              We bring enterprise-grade automation to your Indian payroll and compliance management cycle, reducing manual effort to zero.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}>
              {[
                {
                  title: 'GPS Geofenced Verification',
                  desc: 'Ensure team presence automatically. Check-ins are strictly restricted to office coordinates or designated site bounds, preventing proxy attendance.'
                },
                {
                  title: 'AI Face & Liveness Detection',
                  desc: 'Upgrade security using modern liveness scanning. Authenticate check-ins with single-photo facial recognition to eliminate fraud.'
                },
                {
                  title: 'Automated Indian Tax Compliance',
                  desc: 'State-customized Professional Tax (PT), PF deductions, ESI returns, and TDS brackets are mapped and updated dynamically to local guidelines.'
                },
                {
                  title: 'CA / Finance Partner Portal',
                  desc: 'Grant secure read/write or edit access to your Chartered Accountant or advisory firm to review books and generate tax invoices easily.'
                }
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: '2rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.01)'
                }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem 0' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'pricing' && (
          <section style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '4rem 1.5rem'
          }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>
              Transparent Subscription Pricing
            </h2>
            <p style={{ color: '#475569', textAlign: 'center', marginBottom: '4rem', fontSize: '1.15rem' }}>
              Select the pricing tier that matches your business model. No hidden setup costs.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2.5rem',
              alignItems: 'stretch'
            }}>
              {/* Plan 1 */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px rgba(0,0,0,0.01)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Self-Managed</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 1rem 0' }}>Platform Services</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>₹4,999</span>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/ month</span>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#475569', lineHeight: '2', marginBottom: '2rem' }}>
                    <li>Raise unlimited Client Tax Invoices</li>
                    <li>GPS Geofence + AI Facial Check-in</li>
                    <li>Self-managed Monthly Salary Cycles</li>
                    <li>Automated PF / ESI / TDS Calculation</li>
                    <li>Email & Chat Assistance Support</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowDemoModal(true)}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #0047B8', color: '#0047B8', backgroundColor: 'transparent', borderRadius: '30px', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f6ff'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Start Platform Free Trial
                </button>
              </div>

              {/* Plan 2 */}
              <div style={{
                backgroundColor: '#0b1d3a',
                color: '#ffffff',
                border: '1px solid #0b1d3a',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 25px -5px rgba(0, 71, 184, 0.1)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Assistance</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0.25rem 0 1rem 0' }}>Complete Payroll Service</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#93c5fd' }}>₹9,999</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/ month</span>
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '2', marginBottom: '2rem' }}>
                    <li>Everything in Platform Services</li>
                    <li><strong>Assigned Chartered Accountant Firm</strong></li>
                    <li>Direct TDS Filing & Return Processing</li>
                    <li>Books Ledger Syncing & Reconciliation</li>
                    <li>Priority Phone Support SLA (2 Hours)</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowDemoModal(true)}
                  style={{ width: '100%', padding: '0.75rem', border: 'none', color: '#ffffff', backgroundColor: '#0047B8', borderRadius: '30px', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Hire CA Partner Model
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'services' && (
          <section style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '4rem 1.5rem'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: themeBlue, marginBottom: '1.5rem', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
              Our Platform Services
            </h2>
            <p style={{ color: '#475569', textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem' }}>
              We provide enterprise modules supporting your complete company payroll cycle operations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {[
                {
                  icon: MdLocationOn,
                  title: 'GPS Geofencing Tracking',
                  desc: 'Restrict check-ins to exact geographical coordinates. Automatically calculates distances and detects work-from-home or on-premise status with details logged for review.'
                },
                {
                  icon: MdReceiptLong,
                  title: 'Automated Payroll & Compliances',
                  desc: 'Generate complete monthly salary drafts including basic, HRA, allowance structures, PF, ESI, and automatic TDS adjustments.'
                },
                {
                  icon: MdTimeline,
                  title: 'Leave & Attendance Regularization',
                  desc: 'Simple leaves approval workflow. Deducts balances instantly and keeps audit trails for transparency.'
                },
                {
                  icon: MdLayers,
                  title: 'Multi-Tenant Isolation',
                  desc: 'Host multiple businesses safely. Setup custom branches, organizational hierarchies, role management, and settings independently.'
                }
              ].map((service, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '2rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ color: themeBlue }}>
                    <service.icon size={36} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: themeDarkBlue, marginBottom: '0.5rem' }}>
                      {service.title}
                    </h3>
                    <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                      {service.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'about' && (
          <section style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '4rem 1.5rem',
            lineHeight: '1.7'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: themeBlue, marginBottom: '1.5rem', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
              About HR Allocate
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#475569' }}>
              <p>
                **HR Allocate** is designed to streamline corporate resource allocations, employee clock-in verify processes, and complete financial payroll processing. We serve modern businesses with simple, robust dashboards tailored for HR, Finance, Employees, and Super Admins.
              </p>
              <div style={{
                backgroundColor: themeLightBlue,
                borderLeft: `4px solid ${themeBlue}`,
                padding: '1.5rem',
                borderRadius: '0 8px 8px 0',
                marginTop: '1rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: themeBlue, fontWeight: 700 }}>Our Core Mission</h4>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  To remove compliance friction and geofence errors so companies can focus on operations and employee satisfaction.
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'contact' && (
          <section style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '4rem 1.5rem'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: themeBlue, marginBottom: '1.5rem', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
              Contact Us
            </h2>
            <p style={{ color: '#475569', textAlign: 'center', marginBottom: '2.5rem' }}>
              Have questions? Reach out directly or request a demo session with our support engineers.
            </p>

            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '2rem',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MdEmail size={24} style={{ color: themeBlue }} />
                <div>
                  <h4 style={{ margin: 0, color: themeDarkBlue, fontSize: '0.9rem' }}>Email Address</h4>
                  <a href="mailto:support@hrallocate.in" style={{ color: themeBlue, textDecoration: 'none', fontSize: '0.95rem' }}>
                    support@hrallocate.in
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MdPhone size={24} style={{ color: themeBlue }} />
                <div>
                  <h4 style={{ margin: 0, color: themeDarkBlue, fontSize: '0.9rem' }}>Phone Assistance</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>+91 98765 43210</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <MdInfo size={24} style={{ color: themeBlue }} />
                <div>
                  <h4 style={{ margin: 0, color: themeDarkBlue, fontSize: '0.9rem' }}>Headquarters</h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>
                    Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103, India
                  </p>
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
          backgroundColor: 'rgba(11, 29, 58, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: `2px solid ${themeBlue}`,
            width: '100%',
            maxWidth: '480px',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
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

            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: themeBlue,
              margin: '0 0 0.5rem 0'
            }}>
              Book a Custom Demo
            </h3>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
              Provide your details below to schedule an onboarding walkthrough of the HR Allocate platform.
            </p>

            {submitSuccess ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem 1rem'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: themeLightBlue,
                  color: themeBlue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  ✔
                </div>
                <h4 style={{ color: themeBlue, fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Request Submitted!</h4>
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
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {submitError && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}>
                    {submitError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: themeDarkBlue }}>Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    style={{
                      padding: '0.65rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: themeDarkBlue }}>Business Email</label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    style={{
                      padding: '0.65rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: themeDarkBlue }}>Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={demoForm.company_name}
                    onChange={(e) => setDemoForm({ ...demoForm, company_name: e.target.value })}
                    style={{
                      padding: '0.65rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: themeDarkBlue }}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={demoForm.phone}
                    onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                    style={{
                      padding: '0.65rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: themeDarkBlue }}>Message (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly tell us about your requirements"
                    value={demoForm.message}
                    onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })}
                    style={{
                      padding: '0.65rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{
                    backgroundColor: themeBlue,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: submitLoading ? 'not-allowed' : 'pointer',
                    marginTop: '0.5rem',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {submitLoading ? 'Submitting...' : 'Confirm Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* -------------------- VIDEO DEMO MODAL overlay -------------------- */}
      {showVideoModal && (() => {
        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1.5rem'
          }}>
            <div style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '24px',
              border: '2.5px solid #0047B8',
              width: '100%',
              maxWidth: '800px',
              padding: '2.25rem',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              {/* Close Button */}
              <button
                onClick={() => setShowVideoModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '0.25rem',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.05)'
                }}
              >
                <MdClose size={22} />
              </button>

              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#fff' }}>
                  See How HR Allocate Works 🎬
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                  An interactive walkthrough simulating geofenced attendance tracking and complete payroll processing.
                </p>
              </div>

              {/* HTML5 Video Player Screen Container */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '16px',
                height: '380px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <video
                  src="/demo.mp4"
                  controls
                  autoPlay
                  loop
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Bottom Video Action Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>Playback Controls Enabled</span>
                <span style={{ color: '#0047B8', fontWeight: 700 }}>HR Allocate Official Walkthrough Video</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Footer */}
      <footer style={{
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '2.5rem 1.5rem',
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
          <Logo width={130} height={32} />
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            &copy; {new Date().getFullYear()} HR Allocate. All rights reserved.
          </p>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '0.5rem'
          }}>
            <a href="#" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none' }}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
