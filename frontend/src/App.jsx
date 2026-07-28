import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import PortalSelection from './pages/PortalSelection';
import EmployeeLogin from './pages/EmployeeLogin';
import HRLogin from './pages/HRLogin';
import FinanceLogin from './pages/FinanceLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HRDashboard from './pages/HRDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CompanyOnboarding from './pages/CompanyOnboarding';
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

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);


  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Dashboard Portal Routes */}
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
                <Navigate to="/login/employee" replace />
              )
            } 
          />

          <Route 
            path="/hr/*" 
            element={
              token ? (
                user?.role === 'hr' ? (
                  parseInt(user?.onboarding_completed) === 0 ? (
                    <CompanyOnboarding token={token} user={user} onOnboardingSuccess={handleLoginSuccess} />
                  ) : (
                    <Layout user={user} onLogout={handleLogout}>
                      <HRDashboard token={token} />
                    </Layout>
                  )
                ) : (
                  <Navigate to={`/${user.role}`} replace />
                )
              ) : (
                <Navigate to="/login/hr" replace />
              )
            } 
          />

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
                <Navigate to="/login/finance" replace />
              )
            } 
          />

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
                <Navigate to="/login/superadmin" replace />
              )
            } 
          />

          {/* Secure Gateways for Separate Logins */}
          <Route 
            path="/login/employee" 
            element={
              token ? <Navigate to="/employee" replace /> : <EmployeeLogin onLoginSuccess={handleLoginSuccess} />
            } 
          />
          <Route 
            path="/login/hr" 
            element={
              token ? <Navigate to="/hr" replace /> : <HRLogin onLoginSuccess={handleLoginSuccess} />
            } 
          />
          <Route 
            path="/login/finance" 
            element={
              token ? <Navigate to="/finance" replace /> : <FinanceLogin onLoginSuccess={handleLoginSuccess} />
            } 
          />
          <Route 
            path="/login/superadmin" 
            element={
              token ? <Navigate to="/superadmin" replace /> : <SuperAdminLogin onLoginSuccess={handleLoginSuccess} />
            } 
          />

          {/* Fallbacks */}
          <Route path="/login/ca" element={<Navigate to="/login/finance" replace />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          
          <Route 
            path="/" 
            element={
              token && user ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <PortalSelection />
              )
            } 
          />
          
          <Route 
            path="*" 
            element={
              token && user ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
