import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { MdAttachMoney, MdReceipt, MdAssignmentTurnedIn, MdLockOpen, MdLock } from 'react-icons/md';

export default function FinanceDashboard({ token }) {
  const [activeSubTab, setActiveSubTab] = useState('payroll'); // payroll, history, expenses, settings
  const [metrics, setMetrics] = useState({ pending_expenses: 0, last_payroll_cost: 0 });
  const [latestCycle, setLatestCycle] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Run form
  const [runMonth, setRunMonth] = useState('7');
  const [runYear, setRunYear] = useState('2026');
  const [runSuccess, setRunSuccess] = useState(null);
  const [runError, setRunError] = useState(null);

  const fetchFinanceData = async () => {
    try {
      // 1. Dashboard summaries
      const dashRes = await axios.get('http://localhost:8000/index.php?route=/api/finance/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics({
        pending_expenses: dashRes.data.pending_expenses,
        last_payroll_cost: dashRes.data.last_payroll_cost
      });
      setLatestCycle(dashRes.data.latest_cycle);

      // 2. Cycles List
      const cycleRes = await axios.get('http://localhost:8000/index.php?route=/api/finance/cycles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCycles(cycleRes.data.cycles);

      // 3. Expenses List
      const expRes = await axios.get('http://localhost:8000/index.php?route=/api/finance/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(expRes.data.expenses);

    } catch (err) {
      console.error("Error loading Finance portal data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [token]);

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    setRunError(null);
    setRunSuccess(null);
    try {
      const response = await axios.post('http://localhost:8000/index.php?route=/api/finance/cycles', {
        month: runMonth,
        year: runYear
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRunSuccess(response.data.message);
      fetchFinanceData();
    } catch (err) {
      setRunError(err.response?.data?.error || 'Failed to trigger payroll cycle.');
    }
  };

  const handleLockCycle = async (cycleId) => {
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/finance/cycles/lock', {
        cycle_id: cycleId,
        status: 'Paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFinanceData();
      if (selectedCycle === cycleId) {
        handleViewPayslips(cycleId);
      }
    } catch (err) {
      console.error("Error locking payroll cycle", err);
    }
  };

  const handleViewPayslips = async (cycleId) => {
    try {
      setSelectedCycle(cycleId);
      const response = await axios.get(`http://localhost:8000/index.php?route=/api/finance/payslips&cycle_id=${cycleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayslips(response.data.payslips);
    } catch (err) {
      console.error("Error loading payslips preview", err);
    }
  };

  const handleExpenseAction = async (expenseId, status) => {
    try {
      await axios.post('http://localhost:8000/index.php?route=/api/finance/expenses', {
        expense_id: expenseId,
        status: status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFinanceData();
    } catch (err) {
      console.error("Error updating expense reimbursement claim", err);
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
          Finance & CA Operations Portal / Dashboard
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Payroll & Tax Compliance</h2>
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
          { id: 'payroll', label: 'Run Monthly Payroll' },
          { id: 'history', label: 'Historical Payroll Runs' },
          { id: 'expenses', label: 'Expense Reimbursements' },
          { id: 'settings', label: 'Compliance Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveSubTab(tab.id); setRunSuccess(null); setRunError(null); }}
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

      {/* SUB-TAB 1: RUN PAYROLL */}
      {activeSubTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <StatCard title="Active Cycle State" value={latestCycle ? `${latestCycle.month}/${latestCycle.year}` : 'None'} description={latestCycle ? `Status: ${latestCycle.status}` : 'No cycle run'} icon={MdAssignmentTurnedIn} />
            <StatCard title="Latest Payout Liability" value={`$${metrics.last_payroll_cost.toLocaleString()}`} description="Gross disbursements value" icon={MdAttachMoney} trendColor="#0047B8" />
            <StatCard title="Pending Reimbursements" value={metrics.pending_expenses} description="Requires review" icon={MdReceipt} trendColor="#E30613" />
          </div>

          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Trigger Monthly Payroll Run</h3>
            
            {runSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(0,71,184,0.05)', borderRadius: '6px', color: '#0047B8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{runSuccess}</div>}
            {runError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{runError}</div>}

            <form onSubmit={handleRunPayroll} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Processing Month</label>
                <select value={runMonth} onChange={e => setRunMonth(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Processing Year</label>
                <select value={runYear} onChange={e => setRunYear(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
              <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Run Payout Calculations
              </button>
            </form>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
              *Note: Running calculations compiles all active employee rosters, applies default earnings percentages, deducts PF/ESI contributions, and saves the logs as Draft.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HISTORICAL RUNS */}
      {activeSubTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Payroll Cycles Register</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Month/Year</th>
                    <th>Processed At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.month}/{c.year}</td>
                      <td>{c.processed_at ? new Date(c.processed_at).toLocaleString() : 'N/A'}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: c.status === 'Draft' ? 'rgba(227, 6, 19, 0.08)' : 'rgba(0, 71, 184, 0.08)',
                          color: c.status === 'Draft' ? '#E30613' : '#0047B8'
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={() => handleViewPayslips(c.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#0047B8', fontWeight: 700, cursor: 'pointer' }}>
                            View Payslips
                          </button>
                          {c.status === 'Draft' && (
                            <button 
                              onClick={() => handleLockCycle(c.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#E30613', fontWeight: 700, cursor: 'pointer' }}
                            >
                              <MdLockOpen /> Lock & Disburse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payslips Preview Table */}
          {selectedCycle && (
            <div className="premium-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
                Payslips Review for Cycle ID {selectedCycle}
              </h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Gross</th>
                      <th>Basic</th>
                      <th>HRA</th>
                      <th>PF Deduct</th>
                      <th>ESI Deduct</th>
                      <th>TDS Deduct</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.employee_name} ({p.employee_code})</td>
                        <td>${parseFloat(p.gross_salary).toFixed(2)}</td>
                        <td>${parseFloat(p.basic).toFixed(2)}</td>
                        <td>${parseFloat(p.hra).toFixed(2)}</td>
                        <td>-${parseFloat(p.pf).toFixed(2)}</td>
                        <td>-${parseFloat(p.esi).toFixed(2)}</td>
                        <td>-${parseFloat(p.tds).toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: '#0047B8' }}>${parseFloat(p.net_salary).toFixed(2)}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 3: EXPENSE CLAIMS */}
      {activeSubTab === 'expenses' && (
        <div className="premium-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Employee Expense Reimbursement Claims</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Claim Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>No expense claims recorded</td>
                  </tr>
                ) : (
                  expenses.map(e => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.employee_name} ({e.employee_code})</td>
                      <td>{e.title}</td>
                      <td>{e.category}</td>
                      <td style={{ fontWeight: 700 }}>${parseFloat(e.amount).toFixed(2)}</td>
                      <td>{new Date(e.created_at).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: e.status === 'Pending' ? 'rgba(0, 71, 184, 0.08)' : (e.status === 'Approved' ? 'rgba(0, 71, 184, 0.15)' : 'rgba(227, 6, 19, 0.08)'),
                          color: e.status === 'Pending' ? '#0047B8' : (e.status === 'Approved' ? '#0047B8' : '#E30613')
                        }}>
                          {e.status}
                        </span>
                      </td>
                      <td>
                        {e.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleExpenseAction(e.id, 'Approved')} style={{ backgroundColor: 'transparent', border: 'none', color: '#0047B8', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => handleExpenseAction(e.id, 'Rejected')} style={{ backgroundColor: 'transparent', border: 'none', color: '#E30613', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
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

      {/* SUB-TAB 4: COMPLIANCE */}
      {activeSubTab === 'settings' && (
        <div className="premium-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Corporate Tax & Compliance Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0047B8', marginBottom: '0.75rem' }}>Earning Component Metrics</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                  <span>Basic Allowance Allocation</span>
                  <strong>50.0% of Gross</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                  <span>HRA Allowance Allocation</span>
                  <strong>25.0% of Gross</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                  <span>Special Allowance Conveyance</span>
                  <strong>25.0% of Gross</strong>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#E30613', marginBottom: '0.75rem' }}>Deduction Component Metrics</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                  <span>Provident Fund (PF) Contribution</span>
                  <strong>12.0% of Basic Salary</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                  <span>ESI Medical Contribution</span>
                  <strong>0.75% of Gross (Salary &lt; $21k)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.25rem' }}>
                  <span>TDS Income Tax Bracket</span>
                  <strong>5.0% of Gross (Salary &gt; $50k)</strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
