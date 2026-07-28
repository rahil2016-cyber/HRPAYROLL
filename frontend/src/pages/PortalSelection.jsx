import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MdStar,
  MdCheckCircle
} from 'react-icons/md';

export default function PortalSelection() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const portals = [
    {
      id: 'employee',
      title: 'Employee Portal',
      subtitle: 'Employee Self Service',
      description: 'Clock-in using GPS geofencing, view payroll payslips, check active holidays, and apply for leaves.',
      icon: MdPeople,
      route: '/login/employee',
      accentColor: '#6366f1',
      bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.03) 100%)',
      iconBg: 'rgba(99, 102, 241, 0.1)',
      borderAccent: 'rgba(99, 102, 241, 0.4)'
    },
    {
      id: 'hr',
      title: 'HR Administrator',
      subtitle: 'Company Operations',
      description: 'Onboard employees, configure office branches, track GPS check-ins, approve leaves, and establish rules.',
      icon: MdBusiness,
      route: '/login/hr',
      accentColor: '#ef4444',
      bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.03) 100%)',
      iconBg: 'rgba(239, 68, 68, 0.1)',
      borderAccent: 'rgba(239, 68, 68, 0.4)'
    },
    {
      id: 'finance',
      title: 'Finance & CA Portal',
      subtitle: 'Payroll & Compliance',
      description: 'Review monthly payroll logs, configure salary details, approve expense claims, and adjust tax brackets.',
      icon: MdAttachMoney,
      route: '/login/finance',
      accentColor: '#10b981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%)',
      iconBg: 'rgba(16, 185, 129, 0.1)',
      borderAccent: 'rgba(16, 185, 129, 0.4)'
    },
    {
      id: 'superadmin',
      title: 'Super Admin Console',
      subtitle: 'Global Operations',
      description: 'Register and manage client companies, assign structural permissions, and view database diagnostics.',
      icon: MdSecurity,
      route: '/login/superadmin',
      accentColor: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)',
      iconBg: 'rgba(245, 158, 11, 0.1)',
      borderAccent: 'rgba(245, 158, 11, 0.4)'
    }
  ];

  const features = [
    {
      icon: MdLocationOn,
      title: 'GPS Geofencing Check-In',
      description: 'Allows secure, geolocation-tracked clock-in and clock-out verified instantly by physical distance limits.'
    },
    {
      icon: MdTimeline,
      title: 'Automated Leave Workflows',
      description: 'Enables seamless employee applications, balance tracking, and instant role-based approval logs.'
    },
    {
      icon: MdReceiptLong,
      title: 'Dynamic Payslip Engine',
      description: 'Generates detailed monthly payslips including PF/ESI calculations, allowances, and automatic TDS adjustments.'
    },
    {
      icon: MdLayers,
      title: 'Multi-Tenant Structure',
      description: 'Supports isolated company operations under unique branch configurations, payroll setups, and custom hierarchies.'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0f19',
      backgroundImage: 'radial-gradient(ellipse at 50% -20%, #1e1b4b 0%, #0b0f19 80%)',
      color: '#f8fafc',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      overflowX: 'hidden'
    }}>
      {/* Decorative Glow Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '600px',
        backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'linear-gradient(to bottom, black, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Navbar */}
      <nav style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Logo width={160} height={40} />
        </div>
        <button 
          onClick={() => navigate('/register')}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            padding: '0.6rem 1.2rem',
            borderRadius: '99px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          Setup New Tenant
        </button>
      </nav>

      {/* Hero Section */}
      <header style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '5rem 1.5rem 3rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#818cf8',
          padding: '0.4rem 1rem',
          borderRadius: '99px',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '2rem'
        }}>
          <MdStar size={16} /> Enterprise HR & Payroll Automation
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          margin: '0 0 1.5rem 0',
          background: 'linear-gradient(to bottom right, #ffffff 40%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Modernize Your HR &<br />Payroll Operations
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#94a3b8',
          maxWidth: '640px',
          margin: '0 auto 3rem auto',
          lineHeight: '1.6'
        }}>
          A robust, secure, and multi-tenant solution crafted for fast-growing companies. Manage GPS check-ins, automated leave rules, dynamic salary structures, and complete tax compliances.
        </p>
      </header>

      {/* Gateway Grid */}
      <section style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem 6rem 1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '2.5rem',
          color: '#e2e8f0'
        }}>
          Select Your Workspace Gateway
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
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
                  background: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: isHovered ? portal.accentColor : 'rgba(255, 255, 255, 0.08)',
                  padding: '2rem 1.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: isHovered 
                    ? `0 20px 40px -15px ${portal.accentColor}50` 
                    : '0 10px 30px -15px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '280px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background Glow Effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: portal.bgGradient,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Icon */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: portal.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    color: portal.accentColor,
                    transition: 'transform 0.3s ease',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    <IconComponent size={26} />
                  </div>

                  {/* Subtitle */}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: portal.accentColor,
                    display: 'block',
                    marginBottom: '0.35rem'
                  }}>
                    {portal.subtitle}
                  </span>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '0.75rem'
                  }}>
                    {portal.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {portal.description}
                  </p>
                </div>

                {/* Footer Action */}
                <div style={{
                  position: 'relative',
                  zIndex: 1,
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: isHovered ? '#ffffff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'color 0.2s ease'
                }}>
                  <span>Go to Gateway</span>
                  <MdArrowForward style={{
                    transition: 'transform 0.2s ease',
                    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    color: portal.accentColor
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem 8rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          textAlign: 'center',
          marginTop: '6rem',
          marginBottom: '4rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem'
          }}>
            Fully Featured Enterprise Suite
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '1rem',
            maxWidth: '560px',
            margin: '0 auto'
          }}>
            Designed to scale seamlessly from tiny startups to complex multi-branch corporations with distinct roles.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2.5rem'
        }}>
          {features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <div key={index} style={{
                display: 'flex',
                gap: '1rem'
              }}>
                <div style={{
                  color: '#6366f1',
                  flexShrink: 0
                }}>
                  <FeatureIcon size={28} />
                </div>
                <div>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '0.5rem'
                  }}>
                    {feature.title}
                  </h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#080b13',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
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
          <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>
            &copy; {new Date().getFullYear()} HR Allocate. All rights reserved.
          </p>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '0.5rem'
          }}>
            <a href="#" style={{ color: '#475569', fontSize: '0.85rem', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#475569', fontSize: '0.85rem', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: '#475569', fontSize: '0.85rem', textDecoration: 'none' }}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
