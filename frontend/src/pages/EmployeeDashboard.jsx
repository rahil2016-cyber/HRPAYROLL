import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GPSCheckIn from '../components/GPSCheckIn';
import StatCard from '../components/StatCard';
import { MdMyLocation, MdDateRange, MdReceipt, MdFolder, MdPerson, MdCheckCircle, MdCampaign, MdPrint } from 'react-icons/md';

// Helpers for Payslip Generation & Display
const getMonthName = (monthNumber) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthNumber - 1] || "Month";
};

const formatDOJ = (dojString) => {
  if (!dojString) return '16 Feb 2026';
  try {
    const d = new Date(dojString);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dojString;
  }
};

const generatePFNo = (companyCode, id) => {
  const code = (companyCode || 'DEMO').toUpperCase();
  return `BG/BNG/0035224/000/${(1000000 + parseInt(id || 1)).toString().substring(1)}`;
};

const generatePANNo = (companyCode, id) => {
  const code = (companyCode || 'DEMO').padEnd(5, 'X').substring(0, 5).toUpperCase();
  return `${code}${1000 + parseInt(id || 1)}L`;
};

const generateUAN = (employeeCode) => {
  const cleanCode = (employeeCode || 'EMP003').replace(/\D/g, '');
  return `101229722${cleanCode.padEnd(3, '0')}`;
};

function numberToWords(num) {
  if (num === 0) return 'Zero Rupees';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function g(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }
  
  function h(n) {
    if (n < 100) return g(n);
    const remainder = n % 100;
    return a[Math.floor(n / 100)] + ' Hundred' + (remainder ? ' and ' + g(remainder) : '');
  }
  
  function convert(n) {
    if (n < 1000) return h(n);
    if (n < 100000) {
      const remainder = n % 1000;
      return h(Math.floor(n / 1000)) + ' Thousand ' + (remainder ? h(remainder) : '');
    }
    if (n < 10000000) {
      const remainder = n % 100000;
      return h(Math.floor(n / 100000)) + ' Lakh ' + (remainder ? convert(remainder) : '');
    }
    return num.toLocaleString() + ' Rupees';
  }
  
  const integerPart = Math.floor(num);
  const words = convert(integerPart);
  return words + ' Rupees Only';
}

export default function EmployeeDashboard({ token }) {
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // attendance, leaves, payslips, vault, profile
  const [dashboardData, setDashboardData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [leaveForm, setLeaveForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [expenseForm, setExpenseForm] = useState({ title: '', category: 'Travel', amount: '', bill_path: 'receipt_demo.jpg' });
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  // Selected items for modal detail view
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchEmployeeData = async () => {
    try {
      const dashRes = await axios.get('http://localhost:8000/index.php?route=/api/employee/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(dashRes.data);

      const leaveRes = await axios.get('http://localhost:8000/index.php?route=/api/employee/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(leaveRes.data.leaves);

      const payRes = await axios.get('http://localhost:8000/index.php?route=/api/employee/payslips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayslips(payRes.data.payslips);

      const profRes = await axios.get('http://localhost:8000/index.php?route=/api/employee/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profRes.data);
    } catch (err) {
      console.error("Error loading employee dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [token]);

  const handleClockIn = async (locationData) => {
    try {
      const response = await axios.post('http://localhost:8000/index.php?route=/api/employee/clockin', locationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchEmployeeData();
    } catch (err) {
      alert(err.response?.data?.error || "Clock-in failed. Are you within the branch geofence?");
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const response = await axios.post('http://localhost:8000/index.php?route=/api/employee/leaves', leaveForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormSuccess(response.data.message);
      setLeaveForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      fetchEmployeeData();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to submit leave request.");
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const response = await axios.post('http://localhost:8000/index.php?route=/api/employee/expenses', expenseForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormSuccess(response.data.message);
      setExpenseForm({ title: '', category: 'Travel', amount: '', bill_path: 'receipt_demo.jpg' });
      fetchEmployeeData();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to submit expense reimbursement.");
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("payslip-to-print").innerHTML;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    
    const printWindow = window.open(windowUrl, windowName, 'left=500,top=100,width=850,height=850');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Pay Slip - ${getMonthName(selectedPayslip.month)}_${selectedPayslip.year}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #ffffff;
              color: #0f172a;
              padding: 25px;
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .payslip-container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .company-title {
              font-size: 20px;
              font-weight: 800;
              color: #4c1d95;
              text-transform: uppercase;
              margin: 0;
            }
            .company-address {
              font-size: 11px;
              color: #475569;
              margin: 4px 0 0 0;
              line-height: 1.4;
            }
            .payslip-title {
              font-size: 14px;
              font-weight: 700;
              color: #4c1d95;
              margin-top: 15px;
              margin-bottom: 15px;
              text-align: center;
            }
            .divider {
              width: 100%;
              height: 1px;
              background-color: #cbd5e1;
              margin: 12px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 7px 10px;
              font-size: 11px;
              text-align: left;
            }
            .details-table td {
              padding: 6px 8px;
            }
            .bg-grey {
              background-color: #f8fafc;
            }
            .purple-header {
              background-color: #f3e8ff;
              color: #4c1d95;
              font-weight: 700;
            }
            .footer-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 20px;
              gap: 20px;
            }
            .footer-notes {
              flex: 1;
              font-size: 9px;
              color: #475569;
              line-height: 1.4;
            }
            .qr-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100px;
              text-align: center;
            }
            .qr-code {
              width: 75px;
              height: 75px;
              border: 1px solid #e2e8f0;
              padding: 2px;
              margin-bottom: 4px;
            }
            .qr-label {
              font-size: 8px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="payslip-container">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748b' }}>
        Loading employee portal data...
      </div>
    );
  }

  const { today_attendance, leave_balances, announcements, settings } = dashboardData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Tab Navigation header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Employee Workspace</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Welcome back, {profile?.employee?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          {[
            { id: 'attendance', label: 'Attendance & Check-in' },
            { id: 'leaves', label: 'Leave Requests' },
            { id: 'payslips', label: 'My Payslips' },
            { id: 'vault', label: 'My Vault' },
            { id: 'profile', label: 'My Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id); setFormSuccess(null); setFormError(null); }}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: activeSubTab === tab.id ? '#ffffff' : 'transparent',
                color: activeSubTab === tab.id ? '#0047B8' : '#475569',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: activeSubTab === tab.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {formSuccess && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(0, 71, 184, 0.05)', border: '1px solid rgba(0, 71, 184, 0.2)', borderRadius: '6px', color: '#0047B8', fontSize: '0.85rem', fontWeight: 600 }}>
          {formSuccess}
        </div>
      )}

      {formError && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227, 6, 19, 0.05)', border: '1px solid rgba(227, 6, 19, 0.2)', borderRadius: '6px', color: '#E30613', fontSize: '0.85rem', fontWeight: 600 }}>
          {formError}
        </div>
      )}

      {/* SUB-TAB 1: ATTENDANCE & CHECK-IN */}
      {activeSubTab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Geofence Check In Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <GPSCheckIn 
              branchName={profile?.employee?.branch_name}
              officeLat={parseFloat(profile?.employee?.latitude || '12.9716')}
              officeLng={parseFloat(profile?.employee?.longitude || '77.5946')}
              radiusMeters={parseInt(profile?.employee?.radius_meters || '150')}
              onClockIn={handleClockIn}
              lastLog={today_attendance}
            />
          </div>

          {/* Announcements & Summary Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Announcements Panel */}
            <div className="premium-card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MdCampaign size={18} color="#0047B8" /> Corporate Announcements
              </h3>
              {announcements.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>No announcements today.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {announcements.map((a, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderLeft: '3px solid #0047B8', borderRadius: '4px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{a.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave balances */}
            <div className="premium-card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Allocated Annual Leave Balances</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {leave_balances.map((b, idx) => (
                  <StatCard 
                    key={idx}
                    title={b.leave_name}
                    value={`${b.allocated - b.used} / ${b.allocated}`}
                    desc={`Used: ${b.used} | Pending: ${b.pending}`}
                    color="#0047B8"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LEAVE REQUESTS */}
      {activeSubTab === 'leaves' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Submit Request Form */}
          <div className="premium-card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Apply for Leave</h3>
            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Leave Category</label>
                <select 
                  value={leaveForm.leave_type_id} 
                  onChange={e => setLeaveForm(prev => ({ ...prev, leave_type_id: e.target.value }))}
                  required
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                >
                  <option value="">Select Leave Type</option>
                  {leave_balances.map((b, idx) => (
                    <option key={idx} value={b.leave_type_id}>{b.leave_name} ({b.allocated - b.used} Available)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Start Date</label>
                  <input 
                    type="date" 
                    value={leaveForm.start_date} 
                    onChange={e => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>End Date</label>
                  <input 
                    type="date" 
                    value={leaveForm.end_date} 
                    onChange={e => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Reason / Remarks</label>
                <textarea 
                  value={leaveForm.reason} 
                  onChange={e => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  placeholder="Provide supporting statement for validation..."
                  rows={3}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', resize: 'none' }}
                />
              </div>

              <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                Submit Request
              </button>
            </form>
          </div>

          {/* History / Status Table */}
          <div className="premium-card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>My Leave Application History</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No leave requests submitted.</td>
                    </tr>
                  ) : (
                    leaves.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600 }}>{l.leave_name}</td>
                        <td>{l.start_date.split(' ')[0]} to {l.end_date.split(' ')[0]}</td>
                        <td>{l.reason}</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: l.status === 'Approved' ? 'rgba(0, 71, 184, 0.08)' : (l.status === 'Rejected' ? 'rgba(227, 6, 19, 0.08)' : 'rgba(245, 158, 11, 0.08)'),
                            color: l.status === 'Approved' ? '#0047B8' : (l.status === 'Rejected' ? '#E30613' : '#d97706')
                          }}>
                            {l.status}
                          </span>
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

      {/* SUB-TAB 3: PAYSLIPS */}
      {activeSubTab === 'payslips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Generated Monthly Payslips</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Period (Month/Year)</th>
                    <th>Gross Salary</th>
                    <th>Total Deductions</th>
                    <th>Net Pay Value</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No payslips generated for this fiscal year yet.</td>
                    </tr>
                  ) : (
                    payslips.map(p => {
                      const deductions = parseFloat(p.pf) + parseFloat(p.esi) + parseFloat(p.tds) + parseFloat(p.other_deductions || 0);
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 700 }}>{getMonthName(p.month)} / {p.year}</td>
                          <td>Rs. {parseFloat(p.gross_salary).toLocaleString()}</td>
                          <td style={{ color: '#E30613' }}>-Rs. {deductions.toLocaleString()}</td>
                          <td style={{ fontWeight: 700, color: '#0047B8' }}>Rs. {parseFloat(p.net_salary).toLocaleString()}</td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: p.status === 'Paid' ? 'rgba(0, 71, 184, 0.08)' : 'rgba(227, 6, 19, 0.08)',
                              color: p.status === 'Paid' ? '#0047B8' : '#E30613'
                            }}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedPayslip(p)}
                              style={{ backgroundColor: 'transparent', border: 'none', color: '#0047B8', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Show Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Payslip Detail Modal Sim - Formatted as Payslip PDF */}
          {selectedPayslip && (
            <div className="premium-card" style={{ border: '2px solid #cbd5e1', borderTop: '6px solid #4c1d95', backgroundColor: '#ffffff', padding: '2rem', animation: 'fadeIn 0.3s' }}>
              
              {/* Modal Control Header (Non-Printable in print out window, but structured nicely here) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Payslip Viewer</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={handlePrint}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      backgroundColor: '#4c1d95',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <MdPrint size={16} /> Print Payslip
                  </button>
                  <button onClick={() => setSelectedPayslip(null)} style={{ border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}>
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Area Container */}
              <div id="payslip-to-print" style={{ color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
                
                {/* 1. Header Details */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4c1d95', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                    {selectedPayslip.company_name || 'TeamLease Services Limited'}
                  </h2>
                  <p style={{ fontSize: '10px', color: '#475569', margin: '4px 0 0 0', maxWidth: '650px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.4' }}>
                    {selectedPayslip.branch_address || 'Ascent Building , # 77,Koramangala Industrial Layout, Jyothi Nivas College Road, Koramangala , Bangalore- 560095'}
                  </p>
                  <div style={{ width: '100%', height: '1px', backgroundColor: '#cbd5e1', marginTop: '10px' }} />
                  <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#4c1d95', marginTop: '10px', marginBottom: '10px', textTransform: 'none' }}>
                    Pay Slip for the month of {getMonthName(selectedPayslip.month)} {selectedPayslip.year}
                  </h3>
                </div>

                {/* 2. Employee Metadata Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px', width: '18%' }}>Emp No</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px', width: '32%' }}>: {selectedPayslip.employee_code}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px', width: '18%' }}>DOB</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px', width: '32%' }}>: 23 Jun 1995</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>Name</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {selectedPayslip.employee_name}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>DOJ</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {formatDOJ(selectedPayslip.date_of_joining)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>PF No</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {generatePFNo(selectedPayslip.company_code, selectedPayslip.employee_id)}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>PAN NO</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {generatePANNo(selectedPayslip.company_code, selectedPayslip.employee_id)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>Bank Acc No</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {selectedPayslip.bank_account || '50100326469985'}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>Bank/Pay Mode</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {selectedPayslip.bank_name || 'HDFC Bank'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>UAN Number</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {generateUAN(selectedPayslip.employee_code)}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>IFSC Code</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {selectedPayslip.ifsc_code || 'HDFC0000041'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>Location</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {selectedPayslip.branch_name || 'Bangalore'}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>Designation</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {selectedPayslip.designation_name || 'Associate'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>LOP</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: 0</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>Department</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: {selectedPayslip.department_name || 'Operations'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>WORKDAYS</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: 30</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>DaysInMonth</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: 30</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>ESIC No.</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: 31000{selectedPayslip.id}123</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>Health Card No</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: -</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>ARREAR DAYS</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: 0</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 'bold', color: '#4c1d95', fontSize: '10px' }}>-</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>: -</td>
                    </tr>
                  </tbody>
                </table>

                {/* 3. Earnings & Deductions Tables (Side by Side structure) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontSize: '11px', color: '#4c1d95', fontWeight: 'bold', textAlign: 'left', width: '35%' }}>Earnings</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontSize: '11px', color: '#4c1d95', fontWeight: 'bold', textAlign: 'right', width: '15%' }}>Rs.</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontSize: '11px', color: '#4c1d95', fontWeight: 'bold', textAlign: 'left', width: '35%' }}>Deduction</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontSize: '11px', color: '#4c1d95', fontWeight: 'bold', textAlign: 'right', width: '15%' }}>Rs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Arrear Basic</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>0.00</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Employee PF Contribution</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>{parseFloat(selectedPayslip.pf).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Arrear House Rent Allowance</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>0.00</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Voluntary Deduction</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>0.00</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Arrear Special Allowance</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>0.00</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Employee ESI Med</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>{parseFloat(selectedPayslip.esi).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Basic</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>{parseFloat(selectedPayslip.basic).toFixed(2)}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>TDS Withholding Tax</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>{parseFloat(selectedPayslip.tds).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>House Rent Allowance</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>{parseFloat(selectedPayslip.hra).toFixed(2)}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Other Deductions</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>{parseFloat(selectedPayslip.other_deductions || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Special Allowance</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>{parseFloat(selectedPayslip.allowances).toFixed(2)}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>-</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>-</td>
                    </tr>

                    {/* Sub Totals */}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontSize: '10px' }}>Total Earnings</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', fontSize: '10px' }}>{parseFloat(selectedPayslip.gross_salary).toFixed(2)}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontSize: '10px' }}>Total Deduction</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', fontSize: '10px' }}>{(parseFloat(selectedPayslip.pf) + parseFloat(selectedPayslip.esi) + parseFloat(selectedPayslip.tds) + parseFloat(selectedPayslip.other_deductions || 0)).toFixed(2)}</td>
                    </tr>

                    {/* Reimbursements & NPS */}
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>Reimbursement :</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>0.00</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>-</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>NPS Employer Contribution :</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'right', fontSize: '10px' }}>0.00</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '5px 8px', fontSize: '10px' }}>-</td>
                    </tr>

                    {/* Net Take home */}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px 8px', fontSize: '11px', color: '#4c1d95' }}>Net Pay :</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px 8px', textAlign: 'right', fontSize: '12px', color: '#4c1d95' }}>Rs. {parseFloat(selectedPayslip.net_salary).toFixed(2)}</td>
                    </tr>

                    {/* Words Representation */}
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px 8px', fontWeight: 'bold', fontSize: '10px', color: '#4c1d95' }}>In Words :</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px 8px', fontSize: '10px', fontWeight: 'bold' }}>
                        {numberToWords(parseFloat(selectedPayslip.net_salary))}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 4. Footer Disclaimers & QR Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '15px', gap: '20px' }}>
                  <div style={{ flex: 1, textAlign: 'left', fontSize: '9px', color: '#475569', lineHeight: '1.4' }}>
                    <p style={{ margin: '0 0 5px 0' }}>Dear Associate, We thank you for being part of {selectedPayslip.company_name || 'TeamLease'} family! Now you can help others looking for job - Ask your friends & family members to visit our corporate website to submit their profiles. So Hurry!</p>
                    <p style={{ margin: '0 0 5px 0' }}>Mail your queries to <strong style={{ color: '#4c1d95' }}>info@{selectedPayslip.company_code ? selectedPayslip.company_code.toLowerCase() : 'company'}.com</strong> with Name & Employee ID.</p>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Important: Please ensure your latest Mobile number and Email ID are verified to avoid missing out on corporate communications.</p>
                    <p style={{ margin: '0 0 5px 0', fontStyle: 'italic', fontWeight: 600 }}>This is a computer generated pay slip, No signature is required.</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px', textAlign: 'center' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=75x75&data=http://localhost:5173/login`} 
                      alt="QR Code" 
                      style={{ width: '75px', height: '75px', border: '1px solid #e2e8f0', padding: '2px', marginBottom: '3px' }} 
                    />
                    <span style={{ fontSize: '7px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Scan QR to download app</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 4: VAULT */}
      {activeSubTab === 'vault' && (
        <div className="premium-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>My Document Vault</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { name: 'Offer Letter.pdf', size: '142 KB' },
              { name: 'Appointment Letter.pdf', size: '185 KB' },
              { name: 'PAN Card Copy.jpg', size: '1.2 MB' },
              { name: 'Aadhaar Card Copy.jpg', size: '950 KB' }
            ].map((doc, idx) => (
              <div key={idx} style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f8fafc' }}>
                <MdFolder size={32} color="#0047B8" />
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{doc.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.size}</div>
                <button style={{ backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', textAlign: 'left', padding: 0 }}>
                  Download Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PROFILE */}
      {activeSubTab === 'profile' && profile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          
          {/* File summary */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#0047B8',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '2rem'
            }}>
              {profile.employee.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{profile.employee.name}</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Code: {profile.employee.employee_code}</p>
            </div>
            <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', textAlign: 'left' }}>
              <div><strong>Email:</strong> {profile.employee.email}</div>
              <div><strong>Branch:</strong> {profile.employee.branch_name}</div>
              <div><strong>Dept:</strong> {profile.employee.department_name}</div>
              <div><strong>Title:</strong> {profile.employee.designation_name}</div>
              <div><strong>Phone:</strong> {profile.employee.phone}</div>
            </div>
          </div>

          {/* Banking / Emergency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="premium-card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Banking Account Allocation</h3>
              {profile.bank ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Bank Name</span>
                    <strong>{profile.bank.bank_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Account Number</span>
                    <strong>{profile.bank.account_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>IFSC Code</span>
                    <strong>{profile.bank.ifsc_code}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No bank account linked. Please contact Finance/CA.</div>
              )}
            </div>

            <div className="premium-card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Emergency Contacts</h3>
              {profile.emergency.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No contact file.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  {profile.emergency.map((contact, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                      <span>{contact.name} ({contact.relationship})</span>
                      <strong>{contact.phone}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
