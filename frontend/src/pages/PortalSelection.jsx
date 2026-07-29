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
  
  // Navigation & Page Section state
  const [activeTab, setActiveTab] = useState('home'); // home, services, about, contact

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
      id: 'employee',
      title: 'Employee Portal',
      subtitle: 'Employee Self Service',
      description: 'Clock-in using GPS geofencing, view payroll payslips, check active holidays, and apply for leaves.',
      icon: MdPeople,
      route: '/login/employee'
    },
    {
      id: 'hr',
      title: 'HR Administrator',
      subtitle: 'Company Operations',
      description: 'Onboard employees, configure office branches, track GPS check-ins, approve leaves, and establish rules.',
      icon: MdBusiness,
      route: '/login/hr'
    },
    {
      id: 'finance',
      title: 'Finance & CA Portal',
      subtitle: 'Payroll & Compliance',
      description: 'Review monthly payroll logs, configure salary details, approve expense claims, and adjust tax brackets.',
      icon: MdAttachMoney,
      route: '/login/finance'
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
      {/* Top Banner & Header */}
      <header style={{
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            <Logo width={160} height={40} />
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              {['home', 'services', 'about', 'contact'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: activeTab === tab ? '700' : '500',
                    color: activeTab === tab ? themeBlue : '#64748b',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    padding: '0.25rem 0',
                    borderBottom: activeTab === tab ? `2px solid ${themeBlue}` : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab === 'about' ? 'About Us' : tab === 'contact' ? 'Contact' : tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowDemoModal(true)}
              style={{
                backgroundColor: themeBlue,
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.3rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00358a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeBlue}
            >
              Book a Demo
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <>
            {/* Hero Section */}
            <section style={{
              backgroundImage: `linear-gradient(180deg, ${themeLightBlue} 0%, #ffffff 100%)`,
              padding: '5rem 1.5rem 4rem 1.5rem',
              textAlign: 'center'
            }}>
              <h1 style={{
                fontSize: '2.8rem',
                fontWeight: 800,
                color: themeBlue,
                margin: '0 0 1.25rem 0',
                letterSpacing: '-0.02em'
              }}>
                HR & Payroll Made Simple
              </h1>
              <p style={{
                fontSize: '1.2rem',
                color: '#475569',
                maxWidth: '680px',
                margin: '0 auto 2.5rem auto',
                lineHeight: '1.6'
              }}>
                A powerful, multi-tenant portal for payroll generation, geographic GPS geofence clock-in, leaves management, and corporate expense reimbursement claims.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowDemoModal(true)}
                  style={{
                    backgroundColor: themeBlue,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.8rem 1.8rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0, 71, 184, 0.2)'
                  }}
                >
                  Get Started Now
                </button>
              </div>
            </section>

            {/* Gateway Selection Section */}
            <section style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '3rem 1.5rem 5rem 1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: '2.5rem',
                color: themeBlue
              }}>
                Select Your Workspace Gateway
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem'
              }}>
                {portals.map((portal, index) => {
                  const IconComponent = portal.icon;
                  const isHovered = hoveredCard === index;

                  return (
                    <div
                      key={portal.id}
                      onClick={() => navigate(portal.route)}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        backgroundColor: isHovered ? themeLightBlue : '#ffffff',
                        border: `2px solid ${isHovered ? themeBlue : '#e2e8f0'}`,
                        borderRadius: '16px',
                        padding: '2rem 1.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                        boxShadow: isHovered ? '0 12px 20px rgba(0, 71, 184, 0.08)' : '0 4px 6px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '260px'
                      }}
                    >
                      <div>
                        {/* Icon Wrapper */}
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '10px',
                          backgroundColor: isHovered ? '#ffffff' : themeLightBlue,
                          color: themeBlue,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '1.25rem'
                        }}>
                          <IconComponent size={24} />
                        </div>

                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: themeBlue,
                          display: 'block',
                          marginBottom: '0.25rem'
                        }}>
                          {portal.subtitle}
                        </span>

                        <h3 style={{
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          color: themeDarkBlue,
                          marginBottom: '0.5rem'
                        }}>
                          {portal.title}
                        </h3>

                        <p style={{
                          color: '#475569',
                          fontSize: '0.85rem',
                          lineHeight: '1.5',
                          margin: 0
                        }}>
                          {portal.description}
                        </p>
                      </div>

                      <div style={{
                        marginTop: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: themeBlue,
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}>
                        <span>Go to Gateway</span>
                        <MdArrowForward size={16} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === 'services' && (
          <section style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '4rem 1.5rem'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: themeBlue, marginBottom: '1.5rem', textAlign: 'center' }}>
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
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: themeBlue, marginBottom: '1.5rem', textAlign: 'center' }}>
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
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: themeBlue, marginBottom: '1.5rem', textAlign: 'center' }}>
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
