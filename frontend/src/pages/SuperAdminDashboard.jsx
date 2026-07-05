import React, { useState, useEffect } from 'react';
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
  const [metrics, setMetrics] = useState({ total_companies: 0, total_employees: 0, total_plans: 0, total_revenue: 0 });
  const [companies, setCompanies] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await axios.get('http://localhost:8000/index.php?route=/api/superadmin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(statsRes.data.metrics);
      
      // Parse chart revenue data
      const history = statsRes.data.revenue_history;
      setChartData({
        labels: history.map(h => h.month),
        datasets: [
          {
            label: 'Monthly SaaS Recurring Revenue ($)',
            data: history.map(h => h.revenue),
            borderColor: '#0047B8',
            backgroundColor: 'rgba(0, 71, 184, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      });

      // 2. Fetch Companies List
      const compRes = await axios.get('http://localhost:8000/index.php?route=/api/superadmin/companies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(compRes.data.companies);

      // 3. Fetch Support Tickets
      const ticketRes = await axios.get('http://localhost:8000/index.php?route=/api/superadmin/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(ticketRes.data.tickets);

    } catch (err) {
      console.error("Error loading superadmin dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const toggleCompanyStatus = async (companyId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/superadmin/companies', {
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

  const resolveTicket = async (ticketId) => {
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/superadmin/tickets', {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      
      {/* Page Title & Breadcrumbs */}
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
        <StatCard title="Total Recurring Income" value={`$${metrics.total_revenue.toLocaleString()}`} icon={MdAttachMoney} description="Gross MRR billing" trend="+20%" trendColor="#E30613" />
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

      {/* Company Registrations Table */}
      <div className="premium-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Registered Tenant Companies</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Company Code</th>
                <th>Subscribed Plan</th>
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
                  <td>{company.plan_name}</td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Tickets */}
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
  );
}
