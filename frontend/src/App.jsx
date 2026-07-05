import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PortalSelection from './pages/PortalSelection';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HRDashboard from './pages/HRDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Helper redirect to handle root entry based on role
  const getRoleDefaultPath = (role) => {
    switch (role) {
      case 'superadmin': return '/superadmin';
      case 'hr': return '/hr';
      case 'finance': return '/finance';
      case 'employee': return '/employee';
      default: return '/login';
    }
  };

  return (
    <ErrorBoundary>
      <Router>
        {!token ? (
          <Routes>
            <Route path="/login/superadmin" element={<Login onLoginSuccess={handleLoginSuccess} initialRole="superadmin" />} />
            <Route path="/login/hr" element={<Login onLoginSuccess={handleLoginSuccess} initialRole="hr" />} />
            <Route path="/login/finance" element={<Login onLoginSuccess={handleLoginSuccess} initialRole="finance" />} />
            <Route path="/login/ca" element={<Login onLoginSuccess={handleLoginSuccess} initialRole="finance" />} />
            <Route path="/login/employee" element={<Login onLoginSuccess={handleLoginSuccess} initialRole="employee" />} />
            <Route path="/login" element={<PortalSelection />} />
            <Route path="/register" element={<Login onLoginSuccess={handleLoginSuccess} initialRole="hr" initialTab="register" />} />
            {/* Catch-all for unauthenticated users redirects to Portal Selection Hub */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              {/* Redirect root '/' to correct portal */}
              <Route path="/" element={<Navigate to={getRoleDefaultPath(user.role)} replace />} />

              {/* Portal routes */}
              {user.role === 'superadmin' && (
                <>
                  <Route path="/superadmin/*" element={<SuperAdminDashboard token={token} />} />
                  <Route path="*" element={<Navigate to="/superadmin" replace />} />
                </>
              )}

              {user.role === 'hr' && (
                <>
                  <Route path="/hr/*" element={<HRDashboard token={token} />} />
                  <Route path="*" element={<Navigate to="/hr" replace />} />
                </>
              )}

              {user.role === 'finance' && (
                <>
                  <Route path="/finance/*" element={<FinanceDashboard token={token} />} />
                  <Route path="*" element={<Navigate to="/finance" replace />} />
                </>
              )}

              {user.role === 'employee' && (
                <>
                  <Route path="/employee/*" element={<EmployeeDashboard token={token} />} />
                  <Route path="*" element={<Navigate to="/employee" replace />} />
                </>
              )}
            </Routes>
          </Layout>
        )}
      </Router>
    </ErrorBoundary>
  );
}
