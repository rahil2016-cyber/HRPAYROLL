import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { 
  MdDashboard, MdPeople, MdLayers, MdAttachMoney, MdReceipt, 
  MdMenu, MdClose, MdLogout, MdWork, MdDateRange, MdBusiness, 
  MdSettings, MdCampaign, MdCreditCard, MdConfirmationNumber, MdBugReport
} from 'react-icons/md';

export default function Layout({ user, children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Build role-based sidebar menus
  const getSidebarLinks = () => {
    switch (user.role) {
      case 'superadmin':
        return [
          { label: 'Dashboard', path: '/superadmin', icon: MdDashboard },
          { label: 'Companies', path: '/superadmin/companies', icon: MdBusiness },
          { label: 'CA Management', path: '/superadmin/cas', icon: MdPeople },
          { label: 'Subscription Plans', path: '/superadmin/plans', icon: MdCreditCard },
          { label: 'Support Tickets', path: '/superadmin/tickets', icon: MdBugReport },
          { label: 'Demo Requests', path: '/superadmin/demo-requests', icon: MdConfirmationNumber }
        ];
      case 'hr':
        return [
          { label: 'Dashboard', path: '/hr', icon: MdDashboard },
          { label: 'Employee Registry', path: '/hr/employees', icon: MdPeople },
          { label: 'Leave Applications', path: '/hr/leaves', icon: MdDateRange },
          { label: 'Departments', path: '/hr/departments', icon: MdLayers },
          { label: 'Designations', path: '/hr/designations', icon: MdWork },
          { label: 'Settings', path: '/hr/settings', icon: MdSettings }
        ];
      case 'finance':
        return [
          { label: 'Dashboard', path: '/finance', icon: MdDashboard },
          { label: 'Run Monthly Payroll', path: '/finance/payroll', icon: MdAttachMoney },
          { label: 'Tax Parameters', path: '/finance/compliance', icon: MdSettings },
          { label: 'Expense Reimbursements', path: '/finance/expenses', icon: MdReceipt }
        ];
      case 'employee':
        return [
          { label: 'Dashboard', path: '/employee', icon: MdDashboard },
          { label: 'Leave Center', path: '/employee/leaves', icon: MdDateRange },
          { label: 'Payslips Registry', path: '/employee/payslips', icon: MdReceipt },
          { label: 'Document Vault', path: '/employee/vault', icon: MdLayers },
          { label: 'My Profile', path: '/employee/profile', icon: MdPeople }
        ];
      default:
        return [];
    }
  };

  const menuItems = getSidebarLinks();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* 1. Sidebar Container (responsive overlays) */}
      <aside 
        style={{
          width: '260px',
          backgroundColor: '#0f172a',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-260px)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="sidebar-main"
      >
        <style>{`
          .content-area {
            width: 100%;
            max-width: 100%;
          }
          .main-content-wrapper {
            flex: 1;
            padding: 1.5rem 1.5rem 3rem 1.5rem;
            overflow-y: auto;
          }
          @media (min-width: 1025px) {
            .sidebar-main {
              transform: translateX(0) !important;
            }
            .content-area {
              width: calc(100% - 260px) !important;
              max-width: calc(100% - 260px) !important;
              margin-left: 260px !important;
            }
            .hamburger-btn {
              display: none !important;
            }
          }
          @media (max-width: 500px) {
            .main-content-wrapper {
              padding: 1rem 0.75rem 2rem 0.75rem !important;
            }
          }
        `}</style>

        {/* Sidebar Header */}
        <div style={{
          padding: '1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0c1322'
        }}>
          {/* Logo container using inverse style for dark background */}
          <div style={{ backgroundColor: '#fff', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
            <Logo width={120} height={30} />
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="hamburger-btn"
            style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path + '/')) || 
              (item.path === '/superadmin' && (location.pathname === '/superadmin' || location.pathname === '/superadmin/'));
            
            return (
              <button
                key={idx}
                onClick={() => handleNav(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: isActive ? '#fff' : '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <Icon size={20} style={{ color: isActive ? '#fff' : '#E30613' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Account block */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#0c1322',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#0047B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.6rem',
              backgroundColor: 'rgba(227, 6, 19, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: '#E30613',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              width: '100%',
              transition: 'background-color 0.2s'
            }}
          >
            <MdLogout /> Log Out
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div 
        className="content-area" 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // prevents flex item overflow
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Sticky Top Header */}
        <header style={{
          height: '64px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="hamburger-btn"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <MdMenu size={24} />
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0047B8' }}>
              {user.company_name || 'HR Payroll Portal'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'none', flexDirection: 'column', textAlign: 'right' }} className="header-meta">
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                System Status
              </span>
              <span style={{ fontSize: '0.7rem', color: '#0047B8', fontWeight: 700 }}>
                • Connected
              </span>
            </div>
            <style>{`
              @media (min-width: 640px) {
                .header-meta { display: flex !important; }
              }
            `}</style>
          </div>
        </header>

        {/* Main Routed Children views */}
        <main className="main-content-wrapper">
          {children}
        </main>
      </div>

    </div>
  );
}
