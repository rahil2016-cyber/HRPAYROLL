import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

const getCleanFileName = (path) => {
  if (!path) return '';
  const parts = path.split('/');
  const base = parts[parts.length - 1];
  const match = base.match(/^doc_\d+_\d+_[a-f0-9]+_(.+)$/);
  return match ? match[1] : base;
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
  const location = useLocation();

  const getActiveTabFromPath = (pathname) => {
    if (pathname.includes('/employee/leaves')) return 'leaves';
    if (pathname.includes('/employee/payslips')) return 'payslips';
    if (pathname.includes('/employee/vault')) return 'vault';
    if (pathname.includes('/employee/profile')) return 'profile';
    return 'attendance';
  };

  const activeSubTab = getActiveTabFromPath(location.pathname);
  const [dashboardData, setDashboardData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [profile, setProfile] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ doc_type: 'PAN Card', doc_number: '', file_name: '', file_data: '' });
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Forms
  const [leaveForm, setLeaveForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [expenseForm, setExpenseForm] = useState({ title: '', category: 'Travel', amount: '', bill_path: 'receipt_demo.jpg' });
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  // Selected items for modal detail view
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(window.API_BASE_URL + '/index.php?route=/api/employee/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data.documents || []);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const dashRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/employee/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(dashRes.data);

      const leaveRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/employee/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(leaveRes.data.leaves);

      const payRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/employee/payslips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayslips(payRes.data.payslips);

      const profRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/employee/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profRes.data);

      // Fetch upgraded attendance states
      const attTodayRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayAttendance(attTodayRes.data.attendance);

      const attHistRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/attendance/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceHistory(attHistRes.data.history || []);

      // Fetch employee documents
      await fetchDocuments();

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
      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/employee/clockin', locationData, {
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
      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/employee/leaves', leaveForm, {
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
      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/employee/expenses', expenseForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormSuccess(response.data.message);
      setExpenseForm({ title: '', category: 'Travel', amount: '', bill_path: 'receipt_demo.jpg' });
      fetchEmployeeData();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to submit expense reimbursement.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadForm(prev => ({
        ...prev,
        file_name: file.name,
        file_data: reader.result
      }));
      setUploadError(null);
    };
    reader.onerror = () => {
      setUploadError("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadForm.doc_type || !uploadForm.file_name || !uploadForm.file_data) {
      setUploadError("Please select a document type and upload a file.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/employee/documents', {
        doc_type: uploadForm.doc_type,
        doc_number: uploadForm.doc_number,
        file_name: uploadForm.file_name,
        file_data: uploadForm.file_data
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUploadForm({ doc_type: 'PAN Card', doc_number: '', file_name: '', file_data: '' });
      setShowUploadModal(false);
      await fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
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

  const { today_attendance = null, leave_balances = [], announcements = [], settings = {} } = dashboardData || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Tab Navigation header */}
      <div className="resp-nav-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Employee Workspace</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Welcome back, {profile?.employee?.name}</p>
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
      {activeSubTab === 'attendance' && (() => {
        // Local helper for working hours calculation
        const getWorkingHours = (record) => {
          if (!record || !record.clock_in) return '--';
          if (!record.clock_out) return 'In Progress';
          try {
            const partsIn = record.clock_in.split(':');
            const partsOut = record.clock_out.split(':');
            const minutes = (parseInt(partsOut[0]) * 60 + parseInt(partsOut[1])) - (parseInt(partsIn[0]) * 60 + parseInt(partsIn[1]));
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
          } catch (e) {
            return '--';
          }
        };

        // Monthly calendar render logic
        const renderCalendarGrid = () => {
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();

          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          const attendanceMap = {};
          attendanceHistory.forEach(att => {
            if (att.date) {
              const dateStr = att.date.split(' ')[0];
              attendanceMap[dateStr] = att;
            }
          });

          const leaveDaysMap = {};
          leaves.forEach(l => {
            if (l.status === 'Approved' && l.start_date && l.end_date) {
              const start = new Date(l.start_date.split(' ')[0]);
              const end = new Date(l.end_date.split(' ')[0]);
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                leaveDaysMap[dateStr] = l.leave_name;
              }
            }
          });

          const calendarCells = [];
          const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Start from Monday
          
          for (let i = 0; i < adjustedFirstDay; i++) {
            calendarCells.push(<div key={`empty-${i}`} style={{ opacity: 0.1 }} />);
          }

          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isPast = date < today && dateStr !== today.toISOString().split('T')[0];
            const isToday = dateStr === today.toISOString().split('T')[0];

            let cellStyle = {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              position: 'relative',
              cursor: 'default',
              transition: 'all 0.2s',
            };

            let bg = '#f8fafc';
            let color = '#475569';
            let border = '1px solid #e2e8f0';
            let statusTooltip = '';

            const attRecord = attendanceMap[dateStr];
            const onLeave = leaveDaysMap[dateStr];

            if (attRecord) {
              if (attRecord.status === 'Late') {
                bg = 'rgba(245, 158, 11, 0.12)';
                color = '#d97706';
                border = '1px solid rgba(245, 158, 11, 0.3)';
                statusTooltip = `Late (${attRecord.clock_in})`;
              } else {
                bg = attRecord.is_wfh === 1 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)';
                color = attRecord.is_wfh === 1 ? '#2563eb' : '#059669';
                border = attRecord.is_wfh === 1 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)';
                statusTooltip = attRecord.is_wfh === 1 ? 'WFH' : 'Present';
              }
            } else if (onLeave) {
              bg = 'rgba(139, 92, 246, 0.12)';
              color = '#7c3aed';
              border = '1px solid rgba(139, 92, 246, 0.3)';
              statusTooltip = `Leave: ${onLeave}`;
            } else if (isPast && !isWeekend) {
              bg = 'rgba(239, 68, 68, 0.08)';
              color = '#dc2626';
              border = '1px solid rgba(239, 68, 68, 0.2)';
              statusTooltip = 'Absent';
            } else if (isWeekend) {
              bg = '#f1f5f9';
              color = '#94a3b8';
              statusTooltip = 'Off';
            } else if (isToday) {
              border = '2px solid #0047B8';
              statusTooltip = 'Today';
            }

            calendarCells.push(
              <div 
                key={`day-${day}`} 
                style={{ ...cellStyle, backgroundColor: bg, color: color, border: border }}
                title={statusTooltip}
              >
                {day}
                {statusTooltip && (
                  <span className="calendar-cell-status">{statusTooltip.split(' ')[0]}</span>
                )}
              </div>
            );
          }

          return calendarCells;
        };

        return (
          <div className="resp-grid-1-2">
            {/* Geofence Clock In Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <GPSCheckIn 
                token={token}
                branchName={profile?.employee?.branch_name}
                officeLat={parseFloat(profile?.employee?.latitude || '12.9716')}
                officeLng={parseFloat(profile?.employee?.longitude || '77.5946')}
                radiusMeters={parseInt(profile?.employee?.radius_meters || '150')}
                onClockIn={fetchEmployeeData}
                lastLog={todayAttendance}
              />
              
              {/* leave balances snippet */}
              <div className="premium-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>My Leave Balances</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {leave_balances.map((b, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: 600, color: '#475569' }}>{b.leave_name}</span>
                      <strong style={{ color: '#0047B8' }}>{b.allocated - b.used} / {b.allocated} Left</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shift Tracker, Calendar and History Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Premium Shift Status Card */}
              <div className="premium-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0047B8 0%, #1e40af 100%)', color: '#fff' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Today's Shift Record</h3>
                
                <div className="resp-shift-grid">
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>SHIFT STATUS</span>
                    <strong style={{ fontSize: '1rem' }}>
                      {todayAttendance ? (todayAttendance.clock_out ? 'Shift Completed' : 'Shift Active') : 'Not Checked In'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>CHECK IN TIME</span>
                    <strong style={{ fontSize: '1rem' }}>{todayAttendance?.clock_in || '--:--'}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>CHECK OUT TIME</span>
                    <strong style={{ fontSize: '1rem' }}>{todayAttendance?.clock_out || '--:--'}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>WORKING HOURS</span>
                    <strong style={{ fontSize: '1rem' }}>{getWorkingHours(todayAttendance)}</strong>
                  </div>
                </div>

                {todayAttendance && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.75rem', opacity: 0.9 }}>
                    <div>
                      <span>GPS STATUS: </span>
                      <strong style={{ color: todayAttendance.clock_in_gps_verified ? '#10b981' : '#f87171' }}>
                        {todayAttendance.clock_in_gps_verified ? 'Verified (Office Geofence)' : 'WFH/Unverified'}
                      </strong>
                    </div>
                    <div>
                      <span>FACE BIOMETRICS: </span>
                      <strong style={{ color: todayAttendance.clock_in_face_verified ? '#10b981' : '#f87171' }}>
                        {todayAttendance.clock_in_face_verified ? `Verified (${todayAttendance.clock_in_face_score}%)` : 'Not Checked'}
                      </strong>
                    </div>
                    <div>
                      <span>LIVENESS STATUS: </span>
                      <strong style={{ color: todayAttendance.clock_in_liveness_verified ? '#10b981' : '#f87171' }}>
                        {todayAttendance.clock_in_liveness_verified ? `Verified (${todayAttendance.clock_in_liveness_score}%)` : 'Not Checked'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Attendance Calendar */}
              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                  Monthly Attendance Calendar - {new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </h3>
                
                {/* Weekdays headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
                </div>

                {/* Calendar Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                  {renderCalendarGrid()}
                </div>

                {/* Calendar Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)' }} />
                    <span>Present</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' }} />
                    <span>Late Check-in</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)' }} />
                    <span>WFH</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)' }} />
                    <span>Approved Leave</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }} />
                    <span>Absent</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }} />
                    <span>Weekend Off</span>
                  </div>
                </div>
              </div>

              {/* Attendance history logs list */}
              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Recent Attendance History (Past 30 Days)</h3>
                <div className="table-container">
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Clock In</th>
                        <th>Clock Out</th>
                        <th>Working Hours</th>
                        <th>Distance</th>
                        <th>Verification</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>No recent attendance logs.</td>
                        </tr>
                      ) : (
                        attendanceHistory.map((att, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{att.date}</td>
                            <td>{att.clock_in || '--:--'}</td>
                            <td>{att.clock_out || '--:--'}</td>
                            <td>{getWorkingHours(att)}</td>
                            <td>
                              {att.is_wfh === 1 ? 'WFH' : (
                                att.clock_in_distance > 1000 ? `${(att.clock_in_distance/1000).toFixed(1)}km` : `${Math.round(att.clock_in_distance)}m`
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <span title="GPS Status" style={{ padding: '0.1rem 0.25rem', borderRadius: '3px', fontSize: '0.65rem', backgroundColor: att.clock_in_gps_verified ? '#d1fae5' : '#fee2e2', color: att.clock_in_gps_verified ? '#065f46' : '#991b1b' }}>GPS</span>
                                <span title="Face Verification" style={{ padding: '0.1rem 0.25rem', borderRadius: '3px', fontSize: '0.65rem', backgroundColor: att.clock_in_face_verified ? '#d1fae5' : '#fee2e2', color: att.clock_in_face_verified ? '#065f46' : '#991b1b' }}>Face</span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                padding: '0.2rem 0.4rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                backgroundColor: att.status === 'Present' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: att.status === 'Present' ? '#059669' : '#d97706'
                              }}>
                                {att.status}
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
          </div>
        );
      })()}

      {/* SUB-TAB 2: LEAVE REQUESTS */}
      {activeSubTab === 'leaves' && (
        <div className="resp-grid-1-2">
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

              <div className="resp-date-grid">
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
            <div className="premium-card resp-payslip-modal">
              
              {/* Modal Control Header (Non-Printable in print out window, but structured nicely here) */}
              <div className="resp-payslip-header">
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
              <div className="payslip-scroll-wrapper">
                <div id="payslip-to-print" style={{ color: '#0f172a', fontFamily: "'Inter', sans-serif", minWidth: '700px' }}>
                
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=75x75&data=${window.location.origin}/login`} 
                      alt="QR Code" 
                      style={{ width: '75px', height: '75px', border: '1px solid #e2e8f0', padding: '2px', marginBottom: '3px' }} 
                    />
                    <span style={{ fontSize: '7px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Scan QR to download app</span>
                  </div>
                </div>

              </div> {/* payslip-to-print */}
              </div> {/* payslip-scroll-wrapper */}

            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 4: VAULT */}
      {activeSubTab === 'vault' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Employee Document Center</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>My Document Vault</h3>
            </div>
            <button
              onClick={() => {
                setUploadForm({ doc_type: 'PAN Card', doc_number: '', file_name: '', file_data: '' });
                setUploadError(null);
                setShowUploadModal(true);
              }}
              style={{
                backgroundColor: '#0047B8',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0, 71, 184, 0.15)'
              }}
            >
              + Add New Document
            </button>
          </div>

          <div className="premium-card">
            {documents.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                <MdFolder size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h4 style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.25rem' }}>No documents uploaded yet</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Upload your official documents (PAN, Aadhaar, Passport, etc.) to keep them secure in your vault.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {documents.map((doc) => (
                  <div key={doc.id} style={{ 
                    padding: '1.25rem', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <MdFolder size={36} color="#0047B8" />
                      <span style={{
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(0, 71, 184, 0.06)',
                        color: '#0047B8'
                      }}>
                        {doc.doc_type}
                      </span>
                    </div>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: '0.9rem', 
                      color: '#0f172a', 
                      textOverflow: 'ellipsis', 
                      overflow: 'hidden', 
                      whiteSpace: 'nowrap',
                      marginTop: '0.25rem'
                    }}>
                      {doc.doc_number || 'No Reference ID'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', wordBreak: 'break-all' }} title={getCleanFileName(doc.file_path)}>
                      {getCleanFileName(doc.file_path)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 'auto' }}>
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                    <a
                      href={`${window.API_BASE_URL}/${doc.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-block',
                        textDecoration: 'none',
                        color: '#0047B8', 
                        cursor: 'pointer', 
                        fontWeight: 700, 
                        fontSize: '0.8rem', 
                        paddingTop: '0.5rem',
                        borderTop: '1px solid #f1f5f9',
                        marginTop: '0.25rem'
                      }}
                    >
                      Download / View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Document Modal */}
          {showUploadModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem'
            }}>
              <div className="premium-card" style={{ 
                maxWidth: '450px', 
                width: '100%', 
                backgroundColor: '#ffffff', 
                borderRadius: '12px', 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '1.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Upload New Document</h3>
                  <button 
                    onClick={() => setShowUploadModal(false)} 
                    style={{ border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ×
                  </button>
                </div>

                {uploadError && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.8rem', marginBottom: '1rem' }}>
                    {uploadError}
                  </div>
                )}

                <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>
                      Document Type
                    </label>
                    <select
                      value={uploadForm.doc_type}
                      onChange={e => setUploadForm(prev => ({ ...prev, doc_type: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                      <option value="PAN Card">PAN Card</option>
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Offer Letter">Offer Letter</option>
                      <option value="Resume">Resume</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>
                      Reference / Document Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABCD1234E or UAN"
                      value={uploadForm.doc_number}
                      onChange={e => setUploadForm(prev => ({ ...prev, doc_number: e.target.value }))}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>
                      Select File (PDF, JPG, PNG up to 5MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileChange}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', cursor: 'pointer' }}
                    />
                    {uploadForm.file_name && (
                      <div style={{ fontSize: '0.75rem', color: '#0047B8', marginTop: '0.25rem', fontWeight: 600 }}>
                        Selected: {uploadForm.file_name}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      style={{
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      style={{
                        backgroundColor: '#0047B8',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        opacity: uploading ? 0.7 : 1
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )
}

      {/* SUB-TAB 5: PROFILE */}
      {activeSubTab === 'profile' && profile && (
        <div className="resp-grid-1-2">
          
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
                <div className="resp-bank-grid">
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
