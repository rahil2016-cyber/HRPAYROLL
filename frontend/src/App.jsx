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
        <Routes>
          {/* Employee Route */}
          <Route 
            path="/employee/*" 
            element={
              token ? (
                user?.role === 'employee' ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <EmployeeDashboard token={token} />
                  </Layout>
                ) : (
                  <Navigate to={`/${user.role}`} replace />
                )
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} initialRole="employee" />
              )
            } 
          />

          {/* HR Route */}
          <Route 
            path="/hr/*" 
            element={
              token ? (
                user?.role === 'hr' ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <HRDashboard token={token} />
                  </Layout>
                ) : (
                  <Navigate to={`/${user.role}`} replace />
                )
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} initialRole="hr" />
              )
            } 
          />

          {/* CA / Finance Route */}
          <Route 
            path="/finance/*" 
            element={
              token ? (
                user?.role === 'finance' ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <FinanceDashboard token={token} />
                  </Layout>
                ) : (
                  <Navigate to={`/${user.role}`} replace />
                )
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} initialRole="finance" />
              )
            } 
          />

          {/* Superadmin Route */}
          <Route 
            path="/superadmin/*" 
            element={
              token ? (
                user?.role === 'superadmin' ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <SuperAdminDashboard token={token} />
                  </Layout>
                ) : (
                  <Navigate to={`/${user.role}`} replace />
                )
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} initialRole="superadmin" />
              )
            } 
          />

          {/* Legacy / Helper Login Redirects */}
          <Route path="/login/superadmin" element={<Navigate to="/superadmin" replace />} />
          <Route path="/login/hr" element={<Navigate to="/hr" replace />} />
          <Route path="/login/finance" element={<Navigate to="/finance" replace />} />
          <Route path="/login/ca" element={<Navigate to="/finance" replace />} />
          <Route path="/login/employee" element={<Navigate to="/employee" replace />} />
          <Route path="/login" element={<Navigate to="/employee" replace />} />

          {/* Registration / Wizard Route */}
          <Route 
            path="/register" 
            element={
              <Login onLoginSuccess={handleLoginSuccess} initialRole="hr" initialTab="register" />
            } 
          />

          {/* Fallbacks */}
          <Route 
            path="/" 
            element={
              token && user ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <Navigate to="/employee" replace />
              )
            } 
          />
          
          <Route 
            path="*" 
            element={
              token && user ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <Navigate to="/employee" replace />
              )
            } 
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
