import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { MdBusiness, MdAttachMoney, MdPeople, MdCreditCard, MdCheckCircle, MdBlock, MdBugReport } from 'react-icons/md';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SuperAdminDashboard({ token }) {
  const location = useLocation();
  const [metrics, setMetrics] = useState({ total_companies: 0, total_employees: 0, total_plans: 0, total_revenue: 0 });
  const [companies, setCompanies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoRequests, setDemoRequests] = useState([]);

  // CA Module States
  const [cas, setCas] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [caSearch, setCaSearch] = useState('');
  const [caStatusFilter, setCaStatusFilter] = useState('All');
  const [showCreateCA, setShowCreateCA] = useState(false);
  const [caForm, setCaForm] = useState({
    email: '',
    password: '',
    name: '',
    firm_name: '',
    mobile_number: '',
    address: '',
    registration_number: '',
    gst_number: '',
    pan_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    digital_signature: ''
  });
  const [editingCa, setEditingCa] = useState(null);
  const [resetPasswordCa, setResetPasswordCa] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [activeAssignCompany, setActiveAssignCompany] = useState(null);
  const [selectedCaId, setSelectedCaId] = useState('');

  // New Company & HR creation states
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    code: '',
    hr_name: '',
    hr_email: '',
    hr_password: '',
    service_type: 'CompletePayroll'
  });
  const [createSuccess, setCreateSuccess] = useState(null);
  const [createError, setCreateError] = useState(null);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setCreateSuccess(null);
    setCreateError(null);
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/companies/create', newCompanyForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreateSuccess('Company and HR Administrator created successfully!');
      setNewCompanyForm({ name: '', code: '', hr_name: '', hr_email: '', hr_password: '', service_type: 'CompletePayroll' });
      fetchDashboardData();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create company and HR account.');
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/superadmin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(statsRes.data.metrics);
      
      // Parse chart revenue data
      const history = statsRes.data.revenue_history;
      setChartData({
        labels: history.map(h => h.month),
        datasets: [
          {
            label: 'Monthly SaaS Recurring Revenue (₹)',
            data: history.map(h => h.revenue),
            borderColor: '#0047B8',
            backgroundColor: 'rgba(0, 71, 184, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      });

      // 2. Fetch Companies List
      const compRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/superadmin/companies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(compRes.data.companies);

      // 3. Fetch Support Tickets
      const ticketRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/superadmin/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(ticketRes.data.tickets);

      // 4. Fetch CAs
      const casRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/superadmin/cas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCas(casRes.data.cas);

      // 5. Fetch Audit Logs
      const logsRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/superadmin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(logsRes.data.logs);

      // 6. Fetch Demo Requests
      const demoRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/superadmin/demo-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDemoRequests(demoRes.data.requests);

    } catch (err) {
      console.error("Error loading superadmin dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDemoRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this demo request?")) {
      return;
    }
    try {
      await axios.delete(window.API_BASE_URL + `/index.php?route=/api/superadmin/demo-requests&id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete demo request');
    }
  };

  const handleCreateCA = async (e) => {
    e.preventDefault();
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/cas/create', caForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateCA(false);
      setCaForm({
        email: '', password: '', name: '', firm_name: '', mobile_number: '',
        address: '', registration_number: '', gst_number: '', pan_number: '',
        bank_name: '', account_number: '', ifsc_code: '', upi_id: '', digital_signature: ''
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create CA');
    }
  };

  const handleUpdateCA = async (e) => {
    e.preventDefault();
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/cas/update', {
        ca_id: editingCa.id,
        name: editingCa.name,
        firm_name: editingCa.firm_name,
        mobile_number: editingCa.mobile_number,
        address: editingCa.address,
        registration_number: editingCa.registration_number,
        gst_number: editingCa.gst_number,
        pan_number: editingCa.pan_number,
        bank_name: editingCa.bank_name,
        account_number: editingCa.account_number,
        ifsc_code: editingCa.ifsc_code,
        upi_id: editingCa.upi_id,
        digital_signature: editingCa.digital_signature,
        status: editingCa.status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingCa(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update CA');
    }
  };

  const handleToggleCaStatus = async (caId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/cas/status', {
        ca_id: caId,
        status: nextStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/cas/reset-password', {
        ca_id: resetPasswordCa.id,
        password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResetPasswordCa(null);
      setNewPassword('');
      alert('Password reset successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleDeleteCa = async (caId) => {
    if (!window.confirm("Are you sure you want to delete this CA account? This will delete all assignments too.")) {
      return;
    }
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/cas/delete', {
        ca_id: caId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete CA');
    }
  };

  const handleAssignCA = async (e) => {
    e.preventDefault();
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/companies/assign-ca', {
        company_id: activeAssignCompany.id,
        ca_id: selectedCaId ? parseInt(selectedCaId) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveAssignCompany(null);
      setSelectedCaId('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign CA');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const toggleCompanyStatus = async (companyId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/companies', {
        company_id: companyId,
        status: nextStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Error toggling company status", err);
    }
  };

  const updateCompanyPlan = async (companyId, planName) => {
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/companies', {
        company_id: companyId,
        plan_name: planName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Error updating company subscription plan", err);
    }
  };

  const resolveTicket = async (ticketId) => {
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/superadmin/tickets', {
        ticket_id: ticketId,
        status: 'Resolved'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Error resolving support ticket", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="skeleton" style={{ height: '110px' }} />
        ))}
      </div>
    );
  }

  const pathParts = location.pathname.split('/');
  const subTab = pathParts[2] || 'dashboard';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      
      {/* 1. DASHBOARD VIEW */}
      {(subTab === 'dashboard' || subTab === '') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 600 }}>
              Super Admin Portal / Dashboard
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Platform Administration</h2>
          </div>

          {/* KPI Cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <StatCard title="Registered Companies" value={metrics.total_companies} icon={MdBusiness} description="Tenant databases active" trend="+12%" />
            <StatCard title="Total Platform Employees" value={metrics.total_employees} icon={MdPeople} description="Active portal logins" trend="+8%" />
            <StatCard title="Subscription Tiers" value={metrics.total_plans} icon={MdCreditCard} description="Active commercial plans" />
            <StatCard title="Total Recurring Income" value={`₹${metrics.total_revenue.toLocaleString()}`} icon={MdAttachMoney} description="Gross MRR billing" trend="+20%" trendColor="#E30613" />
          </div>

          {/* Revenue Graph */}
          {chartData && (
            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Platform Earnings Overview</h3>
              <div style={{ height: '240px', position: 'relative' }}>
                <Line 
                  data={chartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }} 
                />
              </div>
            </div>
          )}

          {/* Provision New Company & HR Form */}
          <div className="premium-card" style={{ borderLeft: '4px solid #475569' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Provision New Tenant Company & HR Administrator</h3>
            
            {createSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.25rem' }}>{createSuccess}</div>}
            {createError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', border: '1px solid rgba(227,6,19,0.2)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.25rem' }}>{createError}</div>}

            <form onSubmit={handleCreateCompany} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Acme Corporation" 
                  value={newCompanyForm.name} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, name: e.target.value})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company Code (Unique)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. ACME" 
                  value={newCompanyForm.code} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, code: e.target.value.toUpperCase()})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>HR Administrator Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. John Doe" 
                  value={newCompanyForm.hr_name} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, hr_name: e.target.value})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>HR Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="e.g. hr@acme.com" 
                  value={newCompanyForm.hr_email} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, hr_email: e.target.value})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>HR Password</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter temporary password" 
                  value={newCompanyForm.hr_password} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, hr_password: e.target.value})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  type="submit" 
                  style={{ 
                    width: '100%', 
                    padding: '0.65rem 1.25rem', 
                    backgroundColor: '#475569', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    fontSize: '0.85rem',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Provision Tenant Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. COMPANIES VIEW */}
      {subTab === 'companies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 600 }}>
              Super Admin Portal / Companies
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Registered Tenant Companies</h2>
          </div>

          {/* Provision New Company & HR Form */}
          <div className="premium-card" style={{ borderLeft: '4px solid #475569' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Provision New Tenant Company & HR Administrator</h3>
            
            {createSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.25rem' }}>{createSuccess}</div>}
            {createError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', border: '1px solid rgba(227,6,19,0.2)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.25rem' }}>{createError}</div>}

            <form onSubmit={handleCreateCompany} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Acme Corporation" 
                  value={newCompanyForm.name} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, name: e.target.value})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company Code (Unique)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. ACME" 
                  value={newCompanyForm.code} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, code: e.target.value.toUpperCase()})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>HR Administrator Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. John Doe" 
                  value={newCompanyForm.hr_name} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, hr_name: e.target.value})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>HR Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="e.g. hr@acme.com" 
                  value={newCompanyForm.hr_email} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, hr_email: e.target.value})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>HR Password</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter temporary password" 
                  value={newCompanyForm.hr_password} 
                  onChange={e => setNewCompanyForm({...newCompanyForm, hr_password: e.target.value})} 
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Service Model</label>
                <select
                  value={newCompanyForm.service_type}
                  onChange={e => setNewCompanyForm({...newCompanyForm, service_type: e.target.value})}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                >
                  <option value="CompletePayroll">Complete Payroll (Full CA & Invoices)</option>
                  <option value="PlatformServices">Platform Services Only (Self-Managed)</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  type="submit" 
                  style={{ 
                    width: '100%', 
                    padding: '0.65rem 1.25rem', 
                    backgroundColor: '#475569', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    fontSize: '0.85rem',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Provision Tenant Company
                </button>
              </div>
            </form>
          </div>

          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Registered Tenant Companies</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Company Code</th>
                    <th>Service Model</th>
                    <th>Subscribed Plan</th>
                    <th>Assigned CA / Finance</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id}>
                      <td style={{ fontWeight: 600 }}>{company.name}</td>
                      <td>{company.code}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: company.service_type === 'CompletePayroll' ? 'rgba(76, 29, 149, 0.08)' : 'rgba(71, 85, 105, 0.08)',
                          color: company.service_type === 'CompletePayroll' ? '#4c1d95' : '#475569'
                        }}>
                          {company.service_type === 'CompletePayroll' ? 'Complete Payroll' : 'Platform Only'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={company.plan_name}
                          onChange={(e) => updateCompanyPlan(company.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                            backgroundColor: '#ffffff',
                            fontWeight: 600,
                            color: '#1e293b',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                        >
                          <option value="Standard Trial">Standard Trial</option>
                          <option value="Premium Growth">Premium Growth</option>
                          <option value="Enterprise Suite">Enterprise Suite</option>
                        </select>
                      </td>
                      <td>
                        {company.assigned_ca_name ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: '#0047B8' }}>{company.assigned_ca_name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{company.assigned_ca_firm || 'No Firm'}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            {company.service_type === 'PlatformServices' ? 'N/A' : 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td>{company.subscription_end ? new Date(company.subscription_end).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: company.status === 'Active' ? 'rgba(0, 71, 184, 0.08)' : 'rgba(227, 6, 19, 0.08)',
                          color: company.status === 'Active' ? '#0047B8' : '#E30613'
                        }}>
                          {company.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          {company.status === 'Active' ? (
                            <button 
                              onClick={() => toggleCompanyStatus(company.id, company.status)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#E30613', cursor: 'pointer', fontWeight: 600 }}
                            >
                              <MdBlock /> Suspend
                            </button>
                          ) : (
                            <button 
                              onClick={() => toggleCompanyStatus(company.id, company.status)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 600 }}
                            >
                              <MdCheckCircle /> Activate
                            </button>
                          )}
                          {company.service_type === 'CompletePayroll' ? (
                            <button
                              onClick={() => {
                                setActiveAssignCompany(company);
                                setSelectedCaId(company.assigned_ca_id || '');
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 600 }}
                            >
                              <MdPeople /> Assign CA
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', fontWeight: 600 }}>Self-Managed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUBSCRIPTION PLANS VIEW */}
      {subTab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 600 }}>
              Super Admin Portal / Subscription Plans
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Subscription Plans & Tiers</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="premium-card" style={{ borderTop: '4px solid #94a3b8', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569', fontSize: '0.7rem', fontWeight: 700 }}>ACTIVE</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Standard Trial</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>For small companies starting out</p>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>₹0 <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>/ month</span></div>
              <ul style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                <li>✓ Max Employees: <strong>10</strong></li>
                <li>✓ Basic employee dashboard</li>
                <li>✓ Dynamic clock-in</li>
                <li>✓ Simple payroll features</li>
              </ul>
            </div>

            <div className="premium-card" style={{ borderTop: '4px solid #0047B8', position: 'relative', boxShadow: '0 10px 15px -3px rgba(0, 71, 184, 0.08)' }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#0047B8', fontSize: '0.7rem', fontWeight: 700 }}>MOST POPULAR</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Premium Growth</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>For mid-sized growing companies</p>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>₹149 <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>/ month</span></div>
              <ul style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                <li>✓ Max Employees: <strong>100</strong></li>
                <li>✓ Geofencing check-in</li>
                <li>✓ Indian Standard compliant payroll</li>
                <li>✓ Leave management workflows</li>
                <li>✓ Asset registry integration</li>
              </ul>
            </div>

            <div className="premium-card" style={{ borderTop: '4px solid #E30613', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#E30613', fontSize: '0.7rem', fontWeight: 700 }}>CUSTOM</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Enterprise Suite</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>For large enterprise organizations</p>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>₹499 <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>/ month</span></div>
              <ul style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                <li>✓ Max Employees: <strong>Unlimited</strong></li>
                <li>✓ Custom geofence verification</li>
                <li>✓ Unlimited document storage</li>
                <li>✓ Premium analytics board</li>
                <li>✓ Dedicated SLA support</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUPPORT TICKETS VIEW */}
      {subTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 600 }}>
              Super Admin Portal / Support Tickets
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Support & Helpdesk Tickets</h2>
          </div>

          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Active Support Tickets</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>User</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No tickets reported</td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.company_name}</td>
                        <td>{ticket.user_name}</td>
                        <td>{ticket.subject}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: ticket.status === 'Open' ? 'rgba(227, 6, 19, 0.08)' : 'rgba(0, 71, 184, 0.08)',
                            color: ticket.status === 'Open' ? '#E30613' : '#0047B8'
                          }}>
                            {ticket.status}
                          </span>
                        </td>
                        <td>
                          {ticket.status === 'Open' && (
                            <button
                              onClick={() => resolveTicket(ticket.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 600 }}
                            >
                              <MdCheckCircle /> Mark Resolved
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. CA MANAGEMENT VIEW */}
      {subTab === 'cas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 600 }}>
                Super Admin Portal / CA Management
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Chartered Accountant & Finance Partners</h2>
            </div>
            <button
              onClick={() => setShowCreateCA(true)}
              style={{
                backgroundColor: '#0047B8',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              + Create CA Profile
            </button>
          </div>

          {/* Search and Filters */}
          <div className="premium-card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search CAs by name, email, phone..."
                value={caSearch}
                onChange={e => setCaSearch(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <select
                value={caStatusFilter}
                onChange={e => setCaStatusFilter(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', minWidth: '130px' }}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* CAs Directory */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>CA/Finance Users List</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Partner Details</th>
                    <th>Firm Name</th>
                    <th>Registration & Tax Info</th>
                    <th>Assigned Companies</th>
                    <th>Billing Stats</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cas.filter(ca => {
                    const matchesSearch = ca.name.toLowerCase().includes(caSearch.toLowerCase()) || 
                                          ca.email.toLowerCase().includes(caSearch.toLowerCase()) ||
                                          (ca.mobile_number && ca.mobile_number.includes(caSearch)) ||
                                          (ca.firm_name && ca.firm_name.toLowerCase().includes(caSearch.toLowerCase()));
                    const matchesStatus = caStatusFilter === 'All' || ca.status === caStatusFilter;
                    return matchesSearch && matchesStatus;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>No CAs found. Click '+ Create CA Profile' to onboard one.</td>
                    </tr>
                  ) : (
                    cas.filter(ca => {
                      const matchesSearch = ca.name.toLowerCase().includes(caSearch.toLowerCase()) || 
                                            ca.email.toLowerCase().includes(caSearch.toLowerCase()) ||
                                            (ca.mobile_number && ca.mobile_number.includes(caSearch)) ||
                                            (ca.firm_name && ca.firm_name.toLowerCase().includes(caSearch.toLowerCase()));
                      const matchesStatus = caStatusFilter === 'All' || ca.status === caStatusFilter;
                      return matchesSearch && matchesStatus;
                    }).map((ca) => (
                      <tr key={ca.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{ca.name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{ca.email}</span>
                            {ca.mobile_number && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{ca.mobile_number}</span>}
                          </div>
                        </td>
                        <td>{ca.firm_name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not Configured</span>}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: '#475569' }}>
                            {ca.registration_number && <span>Reg: {ca.registration_number}</span>}
                            {ca.gst_number && <span>GSTIN: {ca.gst_number}</span>}
                            {ca.pan_number && <span>PAN: {ca.pan_number}</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: '#0047B8' }}>{ca.total_assigned_companies}</span>
                            {ca.assigned_companies.length > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                ({ca.assigned_companies.map(c => c.code).join(', ')})
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                            <span>Invoices: <strong>{ca.total_invoices_count}</strong></span>
                            <span style={{ color: '#E30613', fontWeight: 600 }}>₹{ca.total_invoice_revenue.toLocaleString()}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: ca.status === 'Active' ? 'rgba(0, 71, 184, 0.08)' : 'rgba(227, 6, 19, 0.08)',
                            color: ca.status === 'Active' ? '#0047B8' : '#E30613'
                          }}>
                            {ca.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setEditingCa(ca)}
                              style={{ border: 'none', backgroundColor: 'transparent', color: '#0047B8', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setResetPasswordCa(ca)}
                              style={{ border: 'none', backgroundColor: 'transparent', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                            >
                              Reset Pass
                            </button>
                            <button
                              onClick={() => handleToggleCaStatus(ca.id, ca.status)}
                              style={{ border: 'none', backgroundColor: 'transparent', color: ca.status === 'Active' ? '#E30613' : '#0047B8', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                            >
                              {ca.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteCa(ca.id)}
                              style={{ border: 'none', backgroundColor: 'transparent', color: '#E30613', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Sub-tab */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>CA Activity & Audit Logs</h3>
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No activities logged yet.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      let detailsObj = {};
                      try {
                        detailsObj = JSON.parse(log.details);
                      } catch(e) {}
                      return (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                          <td>{log.executor_name || detailsObj.user_name || 'System'}</td>
                          <td style={{ fontWeight: 600, color: '#0047B8' }}>{log.action}</td>
                          <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                            {detailsObj.message || log.details}
                            {detailsObj.ip_address && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>IP: {detailsObj.ip_address} | Device: {detailsObj.device?.substring(0, 50)}...</div>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create CA Profile Modal */}
      {showCreateCA && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Create CA Partner Profile</h3>
            <form onSubmit={handleCreateCA} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#0047B8', fontWeight: 700 }}>Credential Details</h4>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Partner Full Name</label>
                <input type="text" required value={caForm.name} onChange={e => setCaForm({...caForm, name: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Login Email</label>
                <input type="email" required value={caForm.email} onChange={e => setCaForm({...caForm, email: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Temporary Password</label>
                <input type="password" required value={caForm.password} onChange={e => setCaForm({...caForm, password: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#0047B8', fontWeight: 700 }}>Firm & Legal Information</h4>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Firm Name</label>
                <input type="text" value={caForm.firm_name} onChange={e => setCaForm({...caForm, firm_name: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Mobile Number</label>
                <input type="text" value={caForm.mobile_number} onChange={e => setCaForm({...caForm, mobile_number: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>GSTIN (Optional)</label>
                <input type="text" value={caForm.gst_number} onChange={e => setCaForm({...caForm, gst_number: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>PAN Number (Optional)</label>
                <input type="text" value={caForm.pan_number} onChange={e => setCaForm({...caForm, pan_number: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Firm Registration ID (Optional)</label>
                <input type="text" value={caForm.registration_number} onChange={e => setCaForm({...caForm, registration_number: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>UPI ID (Optional)</label>
                <input type="text" value={caForm.upi_id} onChange={e => setCaForm({...caForm, upi_id: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Firm Office Address</label>
                <textarea value={caForm.address} onChange={e => setCaForm({...caForm, address: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', height: '60px' }} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateCA(false)} style={{ padding: '0.55rem 1.25rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1.25rem', backgroundColor: '#0047B8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save Partner Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit CA Profile Modal */}
      {editingCa && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>Edit CA Partner Profile</h3>
            <form onSubmit={handleUpdateCA} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Partner Full Name</label>
                <input type="text" required value={editingCa.name} onChange={e => setEditingCa({...editingCa, name: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Firm Name</label>
                <input type="text" value={editingCa.firm_name || ''} onChange={e => setEditingCa({...editingCa, firm_name: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Mobile Number</label>
                <input type="text" value={editingCa.mobile_number || ''} onChange={e => setEditingCa({...editingCa, mobile_number: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>GSTIN (Optional)</label>
                <input type="text" value={editingCa.gst_number || ''} onChange={e => setEditingCa({...editingCa, gst_number: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>PAN Number (Optional)</label>
                <input type="text" value={editingCa.pan_number || ''} onChange={e => setEditingCa({...editingCa, pan_number: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Firm Registration ID</label>
                <input type="text" value={editingCa.registration_number || ''} onChange={e => setEditingCa({...editingCa, registration_number: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>UPI ID</label>
                <input type="text" value={editingCa.upi_id || ''} onChange={e => setEditingCa({...editingCa, upi_id: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Status</label>
                <select value={editingCa.status} onChange={e => setEditingCa({...editingCa, status: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Address</label>
                <textarea value={editingCa.address || ''} onChange={e => setEditingCa({...editingCa, address: e.target.value})} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', height: '60px' }} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingCa(null)} style={{ padding: '0.55rem 1.25rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1.25rem', backgroundColor: '#0047B8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordCa && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Reset Password for {resetPasswordCa.name}</h3>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>New Password</label>
                <input type="password" required placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => { setResetPasswordCa(null); setNewPassword(''); }} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#E30613', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign CA Modal */}
      {activeAssignCompany && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '450px', backgroundColor: '#fff', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Assign CA / Finance Executive</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Assign a professional CA to manage payroll, tax audits, and compliance details for <strong>{activeAssignCompany.name}</strong>.
            </p>
            <form onSubmit={handleAssignCA}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Select Professional</label>
                <select
                  value={selectedCaId}
                  onChange={e => setSelectedCaId(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                >
                  <option value="">-- Remove CA Assignment --</option>
                  {cas.map(ca => (
                    <option key={ca.id} value={ca.id}>{ca.name} ({ca.firm_name || 'No Firm'})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => { setActiveAssignCompany(null); setSelectedCaId(''); }} style={{ padding: '0.55rem 1rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1rem', backgroundColor: '#0047B8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DEMO REQUESTS VIEW */}
      {subTab === 'demo-requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 600 }}>
              Super Admin Portal / Demo Requests
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Booked Demo Sessions</h2>
          </div>

          <div className="premium-card">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Company</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Phone</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Message</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {demoRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      No demo requests have been booked yet.
                    </td>
                  </tr>
                ) : (
                  demoRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>{req.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{req.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{req.company_name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{req.phone || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', maxWidth: '240px', wordBreak: 'break-word' }}>{req.message || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{new Date(req.created_at).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteDemoRequest(req.id)}
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#ef4444',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
