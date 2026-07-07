import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import LeafletMap from '../components/LeafletMap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { MdPeople, MdCheckCircle, MdEvent, MdBlock, MdAdd, MdSettings, MdMyLocation, MdCameraAlt, MdDevices, MdInfo, MdTrendingUp, MdOutlineNetworkCell } from 'react-icons/md';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function HRDashboard({ token }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, attendance, directory, leaves, structure, noticeboard
  const [metrics, setMetrics] = useState({ total_employees: 0, present_today: 0, absent_today: 0, pending_leaves: 0 });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // Upgraded Attendance Module states
  const [attendanceMetrics, setAttendanceMetrics] = useState(null);
  const [hrAttendanceRecords, setHrAttendanceRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);

  // Form states
  const [empForm, setEmpForm] = useState({ name: '', email: '', password: 'emp123', employee_code: '', department_id: '', designation_id: '', branch_id: '', monthly_salary: '50000', phone: '' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [desForm, setDesForm] = useState({ name: '' });
  const [annForm, setAnnForm] = useState({ title: '', content: '', target_role: 'All' });
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const fetchHRData = async () => {
    try {
      // 1. Dashboard Stats
      const dashRes = await axios.get('http://localhost:8000/index.php?route=/api/hr/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(dashRes.data.metrics);
      setRecentAttendance(dashRes.data.recent_attendance);

      // 2. Employees List
      const empRes = await axios.get('http://localhost:8000/index.php?route=/api/hr/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(empRes.data.employees);

      // 3. Leave Applications
      const leaveRes = await axios.get('http://localhost:8000/index.php?route=/api/hr/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(leaveRes.data.leaves);

      // 4. Structural metadata
      const deptRes = await axios.get('http://localhost:8000/index.php?route=/api/hr/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(deptRes.data.departments);

      const desRes = await axios.get('http://localhost:8000/index.php?route=/api/hr/designations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDesignations(desRes.data.designations);

      const branchRes = await axios.get('http://localhost:8000/index.php?route=/api/hr/branches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(branchRes.data.branches);

      // 5. Fetch Upgraded Attendance Stats & Logs
      const attStatsRes = await axios.get('http://localhost:8000/index.php?route=/api/hr/attendance/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceMetrics(attStatsRes.data);

      const attLogsRes = await axios.get('http://localhost:8000/index.php?route=/api/hr/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHrAttendanceRecords(attLogsRes.data.attendance || []);

    } catch (err) {
      console.error("Error loading HR dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [token]);

  const handleEmpOnboard = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/hr/employees', empForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormSuccess('Employee onboarded and login credentials generated successfully!');
      setEmpForm({ name: '', email: '', password: 'emp123', employee_code: '', department_id: '', designation_id: '', branch_id: '', monthly_salary: '50000', phone: '' });
      fetchHRData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to onboard employee.');
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/hr/leaves', {
        leave_id: leaveId,
        status: status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHRData();
    } catch (err) {
      console.error("Error updating leave request", err);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/hr/departments', deptForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeptForm({ name: '', code: '' });
      fetchHRData();
    } catch (err) {
      console.error("Error creating department", err);
    }
  };

  const handleAddDesignation = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/hr/designations', desForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDesForm({ name: '' });
      fetchHRData();
    } catch (err) {
      console.error("Error creating designation", err);
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/hr/announcements', annForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormSuccess('Announcement published to targeted notices.');
      setAnnForm({ title: '', content: '', target_role: 'All' });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to post announcement.');
    }
  };

  const handleViewDetails = async (attId) => {
    setModalLoading(true);
    setShowModal(true);
    setSelectedRecord(null);
    try {
      const res = await axios.get(`http://localhost:8000/index.php?route=/api/hr/attendance/${attId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRecord(res.data);
    } catch (err) {
      console.error("Failed to load attendance details", err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: '300px', width: '100%', marginTop: '1rem' }} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      
      {/* Title */}
      <div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 600 }}>
          HR Operations Portal / Dashboard
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Human Resource Management</h2>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        gap: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        {[
          { id: 'overview', label: 'Company Overview' },
          { id: 'attendance', label: 'Attendance Tracking' },
          { id: 'directory', label: 'Employee Registry' },
          { id: 'leaves', label: 'Leave Requests' },
          { id: 'structure', label: 'Org Structures' },
          { id: 'noticeboard', label: 'Noticeboard Manager' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveSubTab(tab.id); setFormSuccess(null); setFormError(null); }}
            style={{
              padding: '0.5rem 0.25rem',
              border: 'none',
              borderBottom: activeSubTab === tab.id ? '2px solid #E30613' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeSubTab === tab.id ? '#0047B8' : '#64748b',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: COMPANY OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <StatCard title="Active Employees" value={metrics.total_employees} icon={MdPeople} description="Registered in catalog" />
            <span style={{ display: 'none' }}>Spacer</span>
            <StatCard title="Present Today" value={metrics.present_today} icon={MdCheckCircle} description="Clocked in geofence" trendColor="#0047B8" />
            <StatCard title="Out of Office" value={metrics.absent_today} icon={MdBlock} description="Absent or on leave" />
            <StatCard title="Pending Leave Approvals" value={metrics.pending_leaves} icon={MdEvent} description="Requires immediate response" trendColor="#E30613" />
          </div>

          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Recent Daily Clock-In Actions</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>WFH Mode</th>
                    <th>Daily Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>No recent clock-in logs found</td>
                    </tr>
                  ) : (
                    recentAttendance.map(att => (
                      <tr key={att.id}>
                        <td>{att.employee_code}</td>
                        <td style={{ fontWeight: 600 }}>{att.employee_name}</td>
                        <td>{att.date}</td>
                        <td>{att.clock_in || '--:--'}</td>
                        <td>{att.clock_out || '--:--'}</td>
                        <td>{att.is_wfh === 1 ? 'Yes' : 'No'}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: att.status === 'Present' ? 'rgba(0, 71, 184, 0.08)' : 'rgba(227, 6, 19, 0.08)',
                            color: att.status === 'Present' ? '#0047B8' : '#E30613'
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
      )}

      {/* SUB-TAB: ATTENDANCE TRACKING */}
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

        const trendLabels = attendanceMetrics?.trends?.map(t => t.date) || [];
        const trendPresentData = attendanceMetrics?.trends?.map(t => t.present) || [];
        const trendWfhData = attendanceMetrics?.trends?.map(t => t.wfh) || [];
        const trendLateData = attendanceMetrics?.trends?.map(t => t.late) || [];

        const chartData = {
          labels: trendLabels,
          datasets: [
            {
              label: 'Present Today',
              data: trendPresentData,
              backgroundColor: 'rgba(16, 185, 129, 0.65)',
              borderColor: '#10b981',
              borderWidth: 1
            },
            {
              label: 'WFH',
              data: trendWfhData,
              backgroundColor: 'rgba(59, 130, 246, 0.65)',
              borderColor: '#3b82f6',
              borderWidth: 1
            },
            {
              label: 'Late Check-in',
              data: trendLateData,
              backgroundColor: 'rgba(245, 158, 11, 0.65)',
              borderColor: '#f59e0b',
              borderWidth: 1
            }
          ]
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <StatCard title="Present Today" value={attendanceMetrics?.metrics?.present_today ?? 0} icon={MdCheckCircle} description="Clocked in staff" trendColor="#10b981" />
              <StatCard title="Absent Today" value={attendanceMetrics?.metrics?.absent_today ?? 0} icon={MdBlock} description="Unreported shifts" trendColor="#ef4444" />
              <StatCard title="Late Clock-ins" value={attendanceMetrics?.metrics?.late_today ?? 0} icon={MdTrendingUp} description="Arrived after 09:15" trendColor="#f59e0b" />
              <StatCard title="Work from Home" value={attendanceMetrics?.metrics?.wfh_today ?? 0} icon={MdPeople} description="WFH bypass logged" trendColor="#3b82f6" />
              <StatCard title="Average Shifts" value={`${attendanceMetrics?.metrics?.avg_working_hours ?? 0.0}h`} icon={MdInfo} description="Working duration today" trendColor="#14b8a6" />
            </div>

            {/* Trends Chart */}
            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>Attendance & WFH Trends (Past 7 Days)</h3>
              <div style={{ height: '260px', position: 'relative' }}>
                {attendanceMetrics?.trends ? (
                  <Bar 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                      }
                    }} 
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                    Generating chart metrics...
                  </div>
                )}
              </div>
            </div>

            {/* Table list */}
            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>Daily Attendance Roster</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Shift Duration</th>
                      <th>Verification Checks</th>
                      <th>Distance</th>
                      <th>Shift Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hrAttendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', color: '#64748b' }}>No check-in logs recorded today.</td>
                      </tr>
                    ) : (
                      hrAttendanceRecords.map((att, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img 
                                src={att.avatar ? `http://localhost:8000/${att.avatar}` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                                alt={att.employee_name} 
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                              />
                              <div>
                                <strong style={{ color: '#0f172a', display: 'block' }}>{att.employee_name}</strong>
                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{att.employee_code}</span>
                              </div>
                            </div>
                          </td>
                          <td>{att.department_name || 'General'}</td>
                          <td>{att.clock_in || '--:--'}</td>
                          <td>{att.clock_out || '--:--'}</td>
                          <td>{getWorkingHours(att)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <span title="GPS Geofence Status" style={{ padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, backgroundColor: att.clock_in_gps_verified ? '#d1fae5' : '#fee2e2', color: att.clock_in_gps_verified ? '#065f46' : '#991b1b' }}>GPS</span>
                              <span title="AI Face Verified" style={{ padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, backgroundColor: att.clock_in_face_verified ? '#d1fae5' : '#fee2e2', color: att.clock_in_face_verified ? '#065f46' : '#991b1b' }}>Face</span>
                              <span title="AI Liveness Verified" style={{ padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, backgroundColor: att.clock_in_liveness_verified ? '#d1fae5' : '#fee2e2', color: att.clock_in_liveness_verified ? '#065f46' : '#991b1b' }}>Live</span>
                            </div>
                          </td>
                          <td>
                            {att.is_wfh === 1 ? (
                              <span style={{ fontStyle: 'italic', color: '#3b82f6' }}>WFH Mode</span>
                            ) : (
                              `${Math.round(att.clock_in_distance)}m`
                            )}
                          </td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: att.status === 'Present' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: att.status === 'Present' ? '#059669' : '#d97706'
                            }}>
                              {att.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              type="button" 
                              onClick={() => handleViewDetails(att.id)}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: 'none', borderRadius: '4px', backgroundColor: '#0047B8', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                            >
                              View Details
                            </button>
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
      })()}

      {/* SUB-TAB 2: EMPLOYEE REGISTRY */}
      {activeSubTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Onboarding Form */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Onboard New Employee</h3>
            
            {formSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(0,71,184,0.05)', borderRadius: '6px', color: '#0047B8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{formSuccess}</div>}
            {formError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{formError}</div>}

            <form onSubmit={handleEmpOnboard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                  <input type="text" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} required placeholder="Alex Smith" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Login Email</label>
                  <input type="email" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} required placeholder="alex@company.com" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Employee ID Code</label>
                  <input type="text" value={empForm.employee_code} onChange={e => setEmpForm({...empForm, employee_code: e.target.value})} required placeholder="EMP004" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Office Branch</label>
                  <select value={empForm.branch_id} onChange={e => setEmpForm({...empForm, branch_id: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Department</label>
                  <select value={empForm.department_id} onChange={e => setEmpForm({...empForm, department_id: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Designation</label>
                  <select value={empForm.designation_id} onChange={e => setEmpForm({...empForm, designation_id: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select Designation</option>
                    {designations.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Monthly Gross Salary ($)</label>
                  <input type="number" value={empForm.monthly_salary} onChange={e => setEmpForm({...empForm, monthly_salary: e.target.value})} required placeholder="65000" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Phone</label>
                  <input type="text" value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})} placeholder="+1555888" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Initial Portal Password</label>
                  <input type="text" value={empForm.password} onChange={e => setEmpForm({...empForm, password: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <button type="submit" style={{ alignSelf: 'flex-end', backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MdAdd /> Register & Onboard
              </button>
            </form>
          </div>

          {/* Directory list */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Employee Registry</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Branch</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Gross Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 700 }}>{emp.employee_code}</td>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.branch_name || '--'}</td>
                      <td>{emp.department_name || '--'}</td>
                      <td>{emp.designation_name || '--'}</td>
                      <td>${parseFloat(emp.monthly_salary).toLocaleString()}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: LEAVE REQUESTS */}
      {activeSubTab === 'leaves' && (
        <div className="premium-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Pending Leave Applications</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>No leave applications recorded</td>
                  </tr>
                ) : (
                  leaves.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.employee_name} ({l.employee_code})</td>
                      <td>{l.leave_type_name}</td>
                      <td>{l.start_date}</td>
                      <td>{l.end_date}</td>
                      <td>{l.reason}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: l.status === 'Pending' ? 'rgba(0, 71, 184, 0.08)' : (l.status === 'Approved' ? 'rgba(0, 71, 184, 0.15)' : 'rgba(227, 6, 19, 0.08)'),
                          color: l.status === 'Pending' ? '#0047B8' : (l.status === 'Approved' ? '#0047B8' : '#E30613')
                        }}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        {l.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleLeaveAction(l.id, 'Approved')} style={{ backgroundColor: 'transparent', border: 'none', color: '#0047B8', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => handleLeaveAction(l.id, 'Rejected')} style={{ backgroundColor: 'transparent', border: 'none', color: '#E30613', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ORG STRUCTURES */}
      {activeSubTab === 'structure' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Departments */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Department Hierarchy</h3>
            <form onSubmit={handleAddDept} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" placeholder="Dept Name" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} required style={{ flex: 2, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Code" value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </form>
            <div className="table-container" style={{ marginTop: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td>{d.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Designations */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Corporate Designations</h3>
            <form onSubmit={handleAddDesignation} style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" placeholder="Designation Title" value={desForm.name} onChange={e => setDesForm({...desForm, name: e.target.value})} required style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </form>
            <div className="table-container" style={{ marginTop: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.map(ds => (
                    <tr key={ds.id}>
                      <td style={{ fontWeight: 600 }}>{ds.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 5: NOTICEBOARD */}
      {activeSubTab === 'noticeboard' && (
        <div className="premium-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Publish New Announcement</h3>
          {formSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(0,71,184,0.05)', borderRadius: '6px', color: '#0047B8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{formSuccess}</div>}
          <form onSubmit={handleAddAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Announcement Title</label>
                <input type="text" value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} required placeholder="Quarterly All-Hands Meeting" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Target Audience</label>
                <select value={annForm.target_role} onChange={e => setAnnForm({...annForm, target_role: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="All">All Portal Users</option>
                  <option value="Employee">Employees Only</option>
                  <option value="Finance">Finance Only</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Content Body</label>
              <textarea value={annForm.content} onChange={e => setAnnForm({...annForm, content: e.target.value})} required rows="5" placeholder="Write notice details..." style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
            </div>

            <button type="submit" style={{ alignSelf: 'flex-end', backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Publish Announcement
            </button>
          </form>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="premium-card" style={{
            width: '100%',
            maxWidth: '900px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Attendance Session Details
                </h3>
                {selectedRecord && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Employee: <strong>{selectedRecord.record.employee_name} ({selectedRecord.record.employee_code})</strong> | Date: {selectedRecord.record.date}
                  </span>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {modalLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: '#64748b' }}>
                  Loading clock-in biometrics and geofencing telemetry...
                </div>
              )}

              {!modalLoading && selectedRecord && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Left Side: Photo logs and Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Selfie Logs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MdCameraAlt /> Check-In Selfie
                        </span>
                        <div style={{ width: '100%', height: '140px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          {selectedRecord.record.clock_in_photo ? (
                            <img 
                              src={`http://localhost:8000/${selectedRecord.record.clock_in_photo}`} 
                              alt="Check-in selfie" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>No photo recorded</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MdCameraAlt /> Check-Out Selfie
                        </span>
                        <div style={{ width: '100%', height: '140px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          {selectedRecord.record.clock_out_photo ? (
                            <img 
                              src={`http://localhost:8000/${selectedRecord.record.clock_out_photo}`} 
                              alt="Check-out selfie" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>Not checked out yet</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Audit Logs */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
                        Attendance Verification Timeline
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {selectedRecord.timeline && selectedRecord.timeline.map((log, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0047B8', marginTop: '4px' }} />
                              {idx < selectedRecord.timeline.length - 1 && (
                                <div style={{ width: '1px', flex: 1, backgroundColor: '#cbd5e1', margin: '4px 0' }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#334155' }}>
                                {log.action} - <span style={{ fontWeight: 500, color: '#64748b' }}>{log.timestamp}</span>
                              </div>
                              <p style={{ color: '#64748b', margin: '0.15rem 0 0 0' }}>{log.remarks}</p>
                              <div style={{ display: 'flex', gap: '0.5rem', color: '#94a3b8', fontSize: '0.65rem', marginTop: '0.15rem' }}>
                                <span>IP: {log.ip_address}</span>
                                <span>|</span>
                                <span>Browser: {log.browser}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Leaflet Map and Technical Metadata */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Leaflet Map */}
                    <div style={{ height: '220px', position: 'relative' }}>
                      <LeafletMap 
                        officeLat={parseFloat(selectedRecord.record.office_lat || '12.9716')}
                        officeLng={parseFloat(selectedRecord.record.office_lng || '77.5946')}
                        employeeLat={parseFloat(selectedRecord.record.clock_in_lat || '12.9716')}
                        employeeLng={parseFloat(selectedRecord.record.clock_in_lng || '77.5946')}
                        radiusMeters={parseInt(selectedRecord.record.office_radius || '150')}
                      />
                    </div>

                    {/* Metadata Specs Grid */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MdDevices /> Client Device Telemetry
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', color: '#475569' }}>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Operating System</span>
                          <strong>{selectedRecord.record.clock_in_os || 'Unknown OS'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Browser Engine</span>
                          <strong>{selectedRecord.record.clock_in_browser || 'Unknown'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Device Category</span>
                          <strong>{selectedRecord.record.clock_in_device || 'Desktop/Laptop'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Network connection</span>
                          <strong>{selectedRecord.record.clock_in_network || 'WiFi/Cellular'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Check-in Distance</span>
                          <strong>{selectedRecord.record.is_wfh === 1 ? 'WFH (Bypassed)' : `${Math.round(selectedRecord.record.clock_in_distance)} meters`}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>GPS Accuracy</span>
                          <strong>&plusmn; {Math.round(selectedRecord.record.clock_in_gps_accuracy || 0)} meters</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0.85rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
