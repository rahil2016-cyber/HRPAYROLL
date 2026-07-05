import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { MdPeople, MdBusiness, MdAttachMoney, MdSecurity } from 'react-icons/md';

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
      accentColor: '#0047B8',
      bgGradient: 'linear-gradient(135deg, rgba(0, 71, 184, 0.03) 0%, rgba(0, 71, 184, 0.08) 100%)',
      iconBg: 'rgba(0, 71, 184, 0.1)',
      borderAccent: 'rgba(0, 71, 184, 0.2)'
    },
    {
      id: 'hr',
      title: 'HR Administrator',
      subtitle: 'Company Operations',
      description: 'Onboard employees, configure office branches, track GPS check-ins, approve leaves, and establish rules.',
      icon: MdBusiness,
      route: '/login/hr',
      accentColor: '#E30613',
      bgGradient: 'linear-gradient(135deg, rgba(227, 6, 19, 0.03) 0%, rgba(227, 6, 19, 0.08) 100%)',
      iconBg: 'rgba(227, 6, 19, 0.1)',
      borderAccent: 'rgba(227, 6, 19, 0.2)'
    },
    {
      id: 'finance',
      title: 'Finance & CA Portal',
      subtitle: 'Payroll & Compliance',
      description: 'Review monthly payroll logs, configure salary details, approve expense claims, and adjust tax brackets.',
      icon: MdAttachMoney,
      route: '/login/finance',
      accentColor: '#0d9488',
      bgGradient: 'linear-gradient(135deg, rgba(13, 148, 136, 0.03) 0%, rgba(13, 148, 136, 0.08) 100%)',
      iconBg: 'rgba(13, 148, 136, 0.1)',
      borderAccent: 'rgba(13, 148, 136, 0.2)'
    },
    {
      id: 'superadmin',
      title: 'Super Admin Console',
      subtitle: 'Global Operations',
      description: 'Register and manage client companies, assign structural permissions, and view database diagnostics.',
      icon: MdSecurity,
      route: '/login/superadmin',
      accentColor: '#475569',
      bgGradient: 'linear-gradient(135deg, rgba(71, 85, 105, 0.03) 0%, rgba(71, 85, 105, 0.08) 100%)',
      iconBg: 'rgba(71, 85, 105, 0.1)',
      borderAccent: 'rgba(71, 85, 105, 0.2)'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '2rem 1.5rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', animation: 'fadeIn 0.5s ease-out' }}>
        <Logo width={220} height={55} />
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#0f172a',
          marginTop: '1.25rem',
          letterSpacing: '-0.02em'
        }}>
          Select Your Workspace Gateway
        </h2>
        <p style={{
          color: '#64748b',
          fontSize: '0.95rem',
          marginTop: '0.5rem',
          maxWidth: '500px',
          lineHeight: '1.5'
        }}>
          Choose a role portal to continue. You will be redirected to the corresponding secure authentication gateway.
        </p>
      </div>

      {/* Portals Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '1200px',
        animation: 'fadeIn 0.6s ease-out',
        marginBottom: '3rem'
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
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: isHovered ? portal.accentColor : '#e2e8f0',
                padding: '2rem 1.75rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: isHovered 
                  ? `0 20px 25px -5px ${portal.accentColor}15, 0 10px 10px -5px ${portal.accentColor}08` 
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '260px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Glow on Hover */}
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

              {/* Card Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Icon Wrapper */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: portal.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  color: portal.accentColor,
                  transition: 'transform 0.3s ease',
                  transform: isHovered ? 'scale(1.1) rotate(3deg)' : 'scale(1)'
                }}>
                  <IconComponent size={24} />
                </div>

                {/* Subtitle / Portal Type Tag */}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: portal.accentColor,
                  display: 'block',
                  marginBottom: '0.25rem'
                }}>
                  {portal.subtitle}
                </span>

                {/* Title */}
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  marginBottom: '0.75rem'
                }}>
                  {portal.title}
                </h3>

                {/* Description */}
                <p style={{
                  color: '#64748b',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {portal.description}
                </p>
              </div>

              {/* Action Link Footer */}
              <div style={{
                position: 'relative',
                zIndex: 1,
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: portal.accentColor,
                fontWeight: 600,
                fontSize: '0.875rem'
              }}>
                <span>Go to Secure Gateway</span>
                <span style={{
                  transition: 'transform 0.2s ease',
                  transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
                }}>→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wizard Promotion / Setup Section */}
      <div style={{
        textAlign: 'center',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: '500px',
        animation: 'fadeIn 0.7s ease-out'
      }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Setting up a new organization?{' '}
          <button 
            onClick={() => navigate('/register')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0047B8',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            Launch Setup Wizard
          </button>
        </p>
      </div>
    </div>
  );
}
