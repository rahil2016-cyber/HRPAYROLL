import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { MdPeople, MdCheckCircle, MdEvent, MdBlock, MdAdd, MdSettings } from 'react-icons/md';

export default function HRDashboard({ token }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, directory, leaves, structure, noticeboard
  const [metrics, setMetrics] = useState({ total_employees: 0, present_today: 0, absent_today: 0, pending_leaves: 0 });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [branches, setBranches] = useState([]);
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

    </div>
  );
}
