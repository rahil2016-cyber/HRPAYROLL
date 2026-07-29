import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { 
  MdAttachMoney, 
  MdReceipt, 
  MdAssignmentTurnedIn, 
  MdLockOpen, 
  MdLock, 
  MdArrowBack, 
  MdPeople, 
  MdBusiness, 
  MdFileDownload, 
  MdPrint, 
  MdCheckCircle, 
  MdEdit, 
  MdSettings, 
  MdHistory 
} from 'react-icons/md';

export default function FinanceDashboard({ token }) {
  // Navigation & context states
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [selectedCompanyCode, setSelectedCompanyCode] = useState('');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('overview'); // overview, employees, payroll, statutory, invoices
  const [activeMainTab, setActiveMainTab] = useState('portfolio'); // portfolio, profile, history
  const [loading, setLoading] = useState(true);

  // CA Multi-company metrics & list
  const [assignedCompanies, setAssignedCompanies] = useState([]);
  const [multiMetrics, setMultiMetrics] = useState({
    total_assigned_companies: 0,
    total_employees: 0,
    payroll_pending_count: 0,
    compliance_pending_count: 0,
    monthly_revenue: 0,
    recent_invoices: []
  });

  // Firm Profile details
  const [caProfile, setCaProfile] = useState({
    name: '',
    email: '',
    firm_name: '',
    registration_number: '',
    gst_number: '',
    pan_number: '',
    mobile_number: '',
    address: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    digital_signature: ''
  });

  // Single Company Workspace state
  const [companyDetails, setCompanyDetails] = useState({
    company: {},
    employees: [],
    total_employees: 0,
    payroll: [],
    statutory: {},
    documents: []
  });

  // Single Company Payroll context
  const [metrics, setMetrics] = useState({ pending_expenses: 0, last_payroll_cost: 0 });
  const [latestCycle, setLatestCycle] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [payslips, setPayslips] = useState([]);

  // Invoicing states
  const initialInvoiceForm = {
    client_name: 'NDP ADVISORY SERVICES (OPC) PRIVATE LIMITED',
    client_address: '494/A, 1st floor Ram and Co Circle PJ Extension, Davanagere - 577002',
    client_gstin: '29AAECN9920B2ZF',
    basic_da_rate: '293',
    basic_da_mandays: '140',
    basic_da_amount: 41000,
    allowances_rate: '293',
    allowances_mandays: '140',
    allowances_amount: 41000,
    epf_rate: '13',
    epf_amount: 5330,
    esic_rate: '3.25',
    esic_amount: 2665,
    service_charge_rate: '5',
    service_charge_amount: 4499.75,
    cgst_rate: '9',
    cgst_amount: 8504.53,
    sgst_rate: '9',
    sgst_amount: 8504.53,
    tds_rate: '2',
    tds_amount: 1889.90,
    net_payment: 109613.91,
    bank_name: 'KARNATAKA BANK LTD',
    bank_account_number: '0190202500001101',
    bank_account_type: 'CURRENT ACCOUNT',
    bank_branch: 'K B EXTENSION DAVANGERE',
    bank_ifsc: 'KARB0000190',
    company_gstin: '29ABCCA0730F1Z3',
    company_pan: 'ABCCA0730F',
    company_esi: '58005233150000999',
    company_epf: 'KNSHG3481108000',
    invoice_number: '01/' + new Date().getFullYear() + '-' + String(new Date().getFullYear() + 1 - 2000),
    invoice_date: new Date().toISOString().substring(0, 10),
    payment_details: 'Pay via Bank Transfer or UPI QR code',
    digital_signature: 'DIRECTOR'
  };

  const [invoicesList, setInvoicesList] = useState([]);
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceFilterMonth, setInvoiceFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [invoiceFilterYear, setInvoiceFilterYear] = useState(String(new Date().getFullYear()));
  const [previewInvoice, setPreviewInvoice] = useState(null);

  // Form runs
  const [runMonth, setRunMonth] = useState('7');
  const [runYear, setRunYear] = useState('2026');
  const [runSuccess, setRunSuccess] = useState(null);
  const [runError, setRunError] = useState(null);

  const fetchFinanceData = async () => {
    try {
      if (selectedCompanyId === null) {
        // Multi-company dashboard
        const dashRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/finance/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMultiMetrics({
          total_assigned_companies: dashRes.data.total_assigned_companies || 0,
          total_employees: dashRes.data.total_employees || 0,
          payroll_pending_count: dashRes.data.payroll_pending_count || 0,
          compliance_pending_count: dashRes.data.compliance_pending_count || 0,
          monthly_revenue: dashRes.data.monthly_revenue || 0,
          recent_invoices: dashRes.data.recent_invoices || []
        });
        const companies = dashRes.data.companies || [];
        setAssignedCompanies(companies);
        if (companies.length === 1) {
          setSelectedCompanyId(companies[0].id);
          setSelectedCompanyName(companies[0].name);
          setSelectedCompanyCode(companies[0].code);
          return;
        }

        const profileRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/finance/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.data.profile) {
          setCaProfile(profileRes.data.profile);
        }

        const invRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/finance/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoicesList(invRes.data.invoices || []);
      } else {
        // Single company context
        const dashRes = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/finance/dashboard&company_id=${selectedCompanyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMetrics({
          pending_expenses: dashRes.data.pending_expenses || 0,
          last_payroll_cost: dashRes.data.last_payroll_cost || 0
        });
        setLatestCycle(dashRes.data.latest_cycle);

        const cycleRes = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/finance/cycles&company_id=${selectedCompanyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCycles(cycleRes.data.cycles || []);

        const expRes = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/finance/expenses&company_id=${selectedCompanyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExpenses(expRes.data.expenses || []);

        const detailsRes = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/finance/company-details&company_id=${selectedCompanyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompanyDetails(detailsRes.data);

        const invRes = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/finance/invoices&filter_company=${selectedCompanyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoicesList(invRes.data.invoices || []);
      }
    } catch (err) {
      console.error("Error loading Finance portal data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const rate1 = parseFloat(invoiceForm.basic_da_rate) || 0;
    const days1 = parseFloat(invoiceForm.basic_da_mandays) || 0;
    const basic_da_amount = rate1 * days1;

    const rate2 = parseFloat(invoiceForm.allowances_rate) || 0;
    const days2 = parseFloat(invoiceForm.allowances_mandays) || 0;
    const allowances_amount = rate2 * days2;

    const subTotalA = basic_da_amount + allowances_amount;

    const epfRate = parseFloat(invoiceForm.epf_rate) || 0;
    const epf_amount = subTotalA * (epfRate / 100);

    const esicRate = parseFloat(invoiceForm.esic_rate) || 0;
    const esic_amount = subTotalA * (esicRate / 100);

    const scRate = parseFloat(invoiceForm.service_charge_rate) || 0;
    const service_charge_amount = (subTotalA + epf_amount + esic_amount) * (scRate / 100);

    const subTotalB = epf_amount + esic_amount + service_charge_amount;

    const cgstRate = parseFloat(invoiceForm.cgst_rate) || 0;
    const cgst_amount = (subTotalA + subTotalB) * (cgstRate / 100);

    const sgstRate = parseFloat(invoiceForm.sgst_rate) || 0;
    const sgst_amount = (subTotalA + subTotalB) * (sgstRate / 100);

    const subTotalC = cgst_amount + sgst_amount;

    const grandTotal = subTotalA + subTotalB + subTotalC;

    const tdsRate = parseFloat(invoiceForm.tds_rate) || 0;
    const tds_amount = (subTotalA + subTotalB) * (tdsRate / 100);

    const net_payment = grandTotal - tds_amount;

    // Check if values have actually changed to avoid infinite loop
    if (
      Math.abs(invoiceForm.basic_da_amount - basic_da_amount) > 0.01 ||
      Math.abs(invoiceForm.allowances_amount - allowances_amount) > 0.01 ||
      Math.abs(invoiceForm.epf_amount - epf_amount) > 0.01 ||
      Math.abs(invoiceForm.esic_amount - esic_amount) > 0.01 ||
      Math.abs(invoiceForm.service_charge_amount - service_charge_amount) > 0.01 ||
      Math.abs(invoiceForm.cgst_amount - cgst_amount) > 0.01 ||
      Math.abs(invoiceForm.sgst_amount - sgst_amount) > 0.01 ||
      Math.abs(invoiceForm.tds_amount - tds_amount) > 0.01 ||
      Math.abs(invoiceForm.net_payment - net_payment) > 0.01
    ) {
      setInvoiceForm(prev => ({
        ...prev,
        basic_da_amount: Number(basic_da_amount.toFixed(2)),
        allowances_amount: Number(allowances_amount.toFixed(2)),
        epf_amount: Number(epf_amount.toFixed(2)),
        esic_amount: Number(esic_amount.toFixed(2)),
        service_charge_amount: Number(service_charge_amount.toFixed(2)),
        cgst_amount: Number(cgst_amount.toFixed(2)),
        sgst_amount: Number(sgst_amount.toFixed(2)),
        tds_amount: Number(tds_amount.toFixed(2)),
        net_payment: Number(net_payment.toFixed(2))
      }));
    }
  }, [
    invoiceForm.basic_da_rate,
    invoiceForm.basic_da_mandays,
    invoiceForm.allowances_rate,
    invoiceForm.allowances_mandays,
    invoiceForm.epf_rate,
    invoiceForm.esic_rate,
    invoiceForm.service_charge_rate,
    invoiceForm.cgst_rate,
    invoiceForm.sgst_rate,
    invoiceForm.tds_rate
  ]);

  useEffect(() => {
    fetchFinanceData();
  }, [token, selectedCompanyId]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/finance/profile', caProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Firm Profile updated successfully!');
      fetchFinanceData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (isEditingInvoice) {
        response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/finance/invoices/update', {
          ...invoiceForm,
          id: editingInvoiceId,
          company_id: selectedCompanyId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/finance/invoices/create', {
          ...invoiceForm,
          company_id: selectedCompanyId,
          billing_month: parseInt(invoiceFilterMonth || (new Date().getMonth() + 1)),
          billing_year: parseInt(invoiceFilterYear || new Date().getFullYear())
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setInvoiceForm(initialInvoiceForm);
      setIsEditingInvoice(false);
      setEditingInvoiceId(null);
      alert(response.data.message || (isEditingInvoice ? 'Invoice updated successfully!' : 'Invoice generated successfully!'));
      fetchFinanceData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process invoice');
    }
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    setRunError(null);
    setRunSuccess(null);
    try {
      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/finance/cycles', {
        month: runMonth,
        year: runYear,
        company_id: selectedCompanyId
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
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/finance/cycles/lock', {
        cycle_id: cycleId,
        status: 'Paid',
        company_id: selectedCompanyId
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
      const response = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/finance/payslips&cycle_id=${cycleId}&company_id=${selectedCompanyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayslips(response.data.payslips || []);
    } catch (err) {
      console.error("Error loading payslips preview", err);
    }
  };

  const handleExpenseAction = async (expenseId, status) => {
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/finance/expenses', {
        expense_id: expenseId,
        status: status,
        company_id: selectedCompanyId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFinanceData();
    } catch (err) {
      console.error("Error updating expense reimbursement claim", err);
    }
  };

  const downloadSecureDocument = (filePath) => {
    const url = `${window.API_BASE_URL}/index.php?route=/api/documents/download&file_path=${encodeURIComponent(filePath)}`;
    
    // Create an authenticated trigger using window.open or fetch download
    axios({
      url: url,
      method: 'GET',
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` }
    }).then((response) => {
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filePath.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
    }).catch((err) => {
      alert("Error downloading document: " + (err.response?.data?.error || "Access Denied"));
    });
  };

  if (loading) {
    return <div className="skeleton" style={{ height: '300px', width: '100%', marginTop: '1rem' }} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }} className="fade-in">
      
      {/* -------------------- MULTI-COMPANY CA DASHBOARD -------------------- */}
      {selectedCompanyId === null && (
        <>
          {/* Header */}
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 600 }}>
              Finance Portal / Client Portfolio
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Chartered Accountant Workspace</h2>
          </div>

          {/* CA Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '1.5rem' }}>
            <button 
              onClick={() => setActiveMainTab('portfolio')} 
              style={{ padding: '0.5rem 0.25rem', border: 'none', borderBottom: activeMainTab === 'portfolio' ? '2px solid #0047B8' : '2px solid transparent', color: activeMainTab === 'portfolio' ? '#0047B8' : '#64748b', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              Client Companies List
            </button>
            <button 
              onClick={() => setActiveMainTab('profile')} 
              style={{ padding: '0.5rem 0.25rem', border: 'none', borderBottom: activeMainTab === 'profile' ? '2px solid #0047B8' : '2px solid transparent', color: activeMainTab === 'profile' ? '#0047B8' : '#64748b', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              My Firm Profile
            </button>
            <button 
              onClick={() => setActiveMainTab('invoices')} 
              style={{ padding: '0.5rem 0.25rem', border: 'none', borderBottom: activeMainTab === 'invoices' ? '2px solid #0047B8' : '2px solid transparent', color: activeMainTab === 'invoices' ? '#0047B8' : '#64748b', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              Invoice Billing Registry
            </button>
          </div>

          {/* PORTFOLIO TAB */}
          {activeMainTab === 'portfolio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <StatCard title="Assigned Client Companies" value={multiMetrics.total_assigned_companies} description="Configured active mappings" icon={MdBusiness} />
                <StatCard title="Managed Employees Rosters" value={multiMetrics.total_employees} description="Total registered salaries active" icon={MdPeople} trendColor="#0047B8" />
                <StatCard title="Payroll Runs Pending" value={multiMetrics.payroll_pending_count} description="Companies without finalized run" icon={MdAssignmentTurnedIn} trendColor="#E30613" />
                <StatCard title="Current Month Billing Revenue" value={`₹${multiMetrics.monthly_revenue.toLocaleString()}`} description="CA Professional invoice total" icon={MdAttachMoney} trendColor="#10b981" />
              </div>

              {/* Companies Grid List */}
              <div className="premium-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Assigned Companies Directory</h3>
                {assignedCompanies.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No companies assigned. Please contact the Super Administrator.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {assignedCompanies.map(comp => (
                      <div key={comp.id} className="premium-card" style={{ borderLeft: '4px solid #0047B8', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => { setSelectedCompanyId(comp.id); setSelectedCompanyName(comp.name); setSelectedCompanyCode(comp.code); setActiveWorkspaceTab('overview'); }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <h4 style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{comp.name}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(0,71,184,0.08)', color: '#0047B8', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{comp.code}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                          <span>Employees: <strong>{comp.employees_count}</strong> active</span>
                          <span>Payroll Status: <strong style={{ color: comp.payroll_status === 'Paid' ? '#10b981' : '#E30613' }}>{comp.payroll_status}</strong></span>
                          <span>Compliance Sync: <strong>Active</strong></span>
                          {comp.last_invoice_number && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Last Invoice: {comp.last_invoice_number} ({comp.last_invoice_date})</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedCompanyId(comp.id); setSelectedCompanyName(comp.name); setSelectedCompanyCode(comp.code); setActiveWorkspaceTab('overview'); }} style={{ flex: 1, backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.45rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Manage Workspace</button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedCompanyId(comp.id); setSelectedCompanyName(comp.name); setSelectedCompanyCode(comp.code); setActiveWorkspaceTab('invoices'); }} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.45rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Generate Invoice</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeMainTab === 'profile' && (
            <div className="premium-card" style={{ maxWidth: '750px', margin: '0 auto', width: '100%' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Self-Service CA Firm Profile Management</h3>
              <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>CA/Finance User Full Name</label>
                  <input type="text" readOnly value={caProfile.name} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Primary Email (Read-only)</label>
                  <input type="email" readOnly value={caProfile.email} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>CA/Finance Firm Name</label>
                  <input type="text" required value={caProfile.firm_name} onChange={e => setCaProfile({...caProfile, firm_name: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Mobile Number</label>
                  <input type="text" required value={caProfile.mobile_number} onChange={e => setCaProfile({...caProfile, mobile_number: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Registration Certificate Number</label>
                  <input type="text" value={caProfile.registration_number || ''} onChange={e => setCaProfile({...caProfile, registration_number: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>GSTIN Number</label>
                  <input type="text" value={caProfile.gst_number || ''} onChange={e => setCaProfile({...caProfile, gst_number: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>PAN Card Number</label>
                  <input type="text" value={caProfile.pan_number || ''} onChange={e => setCaProfile({...caProfile, pan_number: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>UPI ID for Payments</label>
                  <input type="text" placeholder="e.g. firm@upi" value={caProfile.upi_id || ''} onChange={e => setCaProfile({...caProfile, upi_id: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Firm Address</label>
                  <textarea required value={caProfile.address} onChange={e => setCaProfile({...caProfile, address: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', height: '60px' }} />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#0047B8', fontWeight: 700 }}>Bank Account Details (Invoice Remittance)</h4>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Bank Name</label>
                  <input type="text" placeholder="e.g. HDFC Bank" value={caProfile.bank_name || ''} onChange={e => setCaProfile({...caProfile, bank_name: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Account Number</label>
                  <input type="text" placeholder="e.g. 501002938491" value={caProfile.account_number || ''} onChange={e => setCaProfile({...caProfile, account_number: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Bank IFSC Code</label>
                  <input type="text" placeholder="e.g. HDFC0000123" value={caProfile.ifsc_code || ''} onChange={e => setCaProfile({...caProfile, ifsc_code: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Digital Signature (Text/Initials for Invoices)</label>
                  <input type="text" placeholder="e.g. For Firm Name, Partner" value={caProfile.digital_signature || ''} onChange={e => setCaProfile({...caProfile, digital_signature: e.target.value})} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.75rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Update Firm Profile</button>
                </div>
              </form>
            </div>
          )}

          {/* INVOICES TAB */}
          {activeMainTab === 'invoices' && (
            <div className="premium-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Invoice Billing Registry</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <input 
                  type="text" 
                  placeholder="Search invoice number..." 
                  value={invoiceSearchQuery} 
                  onChange={e => setInvoiceSearchQuery(e.target.value)} 
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, minWidth: '180px' }} 
                />
                <select value={invoiceFilterMonth} onChange={e => setInvoiceFilterMonth(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('default', { month: 'short' })}</option>
                  ))}
                </select>
                <select value={invoiceFilterYear} onChange={e => setInvoiceFilterYear(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Client Company</th>
                      <th>Billing Month</th>
                      <th>Total Amount</th>
                      <th>Date Generated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesList.filter(inv => {
                      const matchesSearch = inv.invoice_number.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
                      const matchesMonth = !invoiceFilterMonth || inv.billing_month == invoiceFilterMonth;
                      const matchesYear = !invoiceFilterYear || inv.billing_year == invoiceFilterYear;
                      return matchesSearch && matchesMonth && matchesYear;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No invoices found.</td>
                      </tr>
                    ) : (
                      invoicesList.filter(inv => {
                        const matchesSearch = inv.invoice_number.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
                        const matchesMonth = !invoiceFilterMonth || inv.billing_month == invoiceFilterMonth;
                        const matchesYear = !invoiceFilterYear || inv.billing_year == invoiceFilterYear;
                        return matchesSearch && matchesMonth && matchesYear;
                      }).map(inv => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 700, color: '#0047B8' }}>{inv.invoice_number}</td>
                          <td style={{ fontWeight: 600 }}>{inv.company_name}</td>
                          <td>{new Date(inv.billing_year, inv.billing_month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                          <td style={{ fontWeight: 700, color: '#10b981' }}>₹{inv.grand_total.toLocaleString()}</td>
                          <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                          <td>
                            <button onClick={() => setPreviewInvoice(inv)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 600 }}>
                              <MdPrint /> View & Print
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
        </>
      )}

      {/* -------------------- SINGLE COMPANY WORKSPACE CONTEXT -------------------- */}
      {selectedCompanyId !== null && (
        <>
          {/* Workspace Switcher Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '1rem 1.5rem', borderRadius: '8px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {assignedCompanies.length > 1 && (
                <button 
                  onClick={() => setSelectedCompanyId(null)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: '1px solid #475569', color: '#fff', cursor: 'pointer', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <MdArrowBack /> Portfolio
                </button>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Client Context Switcher</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedCompanyName} ({selectedCompanyCode})</span>
              </div>
            </div>
            
            {/* Workspace tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'employees', label: 'Employee Directory' },
                { id: 'payroll', label: 'Payroll Operations' },
                { id: 'statutory', label: 'Compliance & Tax' },
                { id: 'invoices', label: 'Billing Invoices' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveWorkspaceTab(tab.id)}
                  style={{
                    backgroundColor: activeWorkspaceTab === tab.id ? '#0047B8' : 'transparent',
                    border: 'none',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '4px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* OVERVIEW WORKSPACE TAB */}
          {activeWorkspaceTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Company Legal Information (Read-only)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>Full Legal Name</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{companyDetails.company.name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>Unique Code Identifier</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{companyDetails.company.code}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>GSTIN Number</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{companyDetails.company.gst_number || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>PAN Card Number</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{companyDetails.company.pan_number || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              <div className="premium-card" style={{ borderLeft: '4px solid #475569' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Client Authorized Contact Representative</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>Authorized HR Director</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{companyDetails.company.contact_person}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>Corporate Email</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{companyDetails.company.contact_email}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.15rem' }}>Direct Office Phone</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{companyDetails.company.contact_phone}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEES WORKSPACE TAB */}
          {activeWorkspaceTab === 'employees' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Employee Salaries & Tax Rosters</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Gross Month</th>
                        <th>Basic</th>
                        <th>HRA</th>
                        <th>Allowances</th>
                        <th>Estimated Net Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyDetails.employees.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', color: '#64748b' }}>No employees registered under this company yet.</td>
                        </tr>
                      ) : (
                        companyDetails.employees.map(emp => (
                          <tr key={emp.id}>
                            <td style={{ fontWeight: 700 }}>{emp.employee_code}</td>
                            <td style={{ fontWeight: 600 }}>{emp.name}</td>
                            <td>{emp.department_name} - {emp.designation_name}</td>
                            <td style={{ fontWeight: 700 }}>₹{parseFloat(emp.gross_salary).toLocaleString()}</td>
                            <td>₹{parseFloat(emp.basic / 12).toLocaleString()}</td>
                            <td>₹{parseFloat(emp.hra / 12).toLocaleString()}</td>
                            <td>₹{parseFloat(emp.allowances).toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: '#0047B8' }}>₹{parseFloat(emp.net_salary).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Secure Document Vault */}
              <div className="premium-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Secure Document Vault</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>Secure download of employee ID cards (Aadhaar, PAN, Passport, DL, Voter ID) via authenticated tokens.</p>
                
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Document Type</th>
                        <th>ID Number</th>
                        <th>Stored Location File</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!companyDetails.documents || companyDetails.documents.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No documents uploaded.</td>
                        </tr>
                      ) : (
                        companyDetails.documents.map(doc => (
                          <tr key={doc.id}>
                            <td style={{ fontWeight: 600 }}>{doc.employee_name}</td>
                            <td style={{ fontWeight: 700, color: '#0047B8' }}>{doc.doc_type}</td>
                            <td>{doc.doc_number || 'N/A'}</td>
                            <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{doc.file_path}</td>
                            <td>
                              <button onClick={() => downloadSecureDocument(doc.file_path)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                <MdFileDownload /> Secure Download
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
          )}

          {/* PAYROLL OPERATIONS WORKSPACE TAB */}
          {activeWorkspaceTab === 'payroll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <StatCard title="Active Cycle State" value={latestCycle ? `${latestCycle.month}/${latestCycle.year}` : 'None'} description={latestCycle ? `Status: ${latestCycle.status}` : 'No cycle run'} icon={MdAssignmentTurnedIn} />
                <StatCard title="Latest Payout Liability" value={`₹${metrics.last_payroll_cost.toLocaleString()}`} description="Gross disbursements value" icon={MdAttachMoney} trendColor="#0047B8" />
                <StatCard title="Pending Reimbursements" value={metrics.pending_expenses} description="Requires review" icon={MdReceipt} trendColor="#E30613" />
              </div>

              {/* Run Form */}
              <div className="premium-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Trigger Monthly Payroll Run</h3>
                
                {runSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(0,71,184,0.05)', borderRadius: '6px', color: '#0047B8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{runSuccess}</div>}
                {runError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{runError}</div>}

                <form onSubmit={handleRunPayroll} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Processing Month</label>
                    <select value={runMonth} onChange={e => setRunMonth(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
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
              </div>

              {/* History & Lockdown */}
              <div className="premium-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Monthly Payroll History Logs</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Cycle Period</th>
                        <th>Disbursement Status</th>
                        <th>Created Date</th>
                        <th>Locked/Paid Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cycles.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No historical cycles.</td>
                        </tr>
                      ) : (
                        cycles.map(cycle => (
                          <tr key={cycle.id}>
                            <td style={{ fontWeight: 600 }}>{new Date(cycle.year, cycle.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                            <td>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: cycle.status === 'Paid' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                color: cycle.status === 'Paid' ? '#10b981' : '#f59e0b'
                              }}>
                                {cycle.status}
                              </span>
                            </td>
                            <td>{new Date(cycle.created_at).toLocaleDateString()}</td>
                            <td>{cycle.completed_at ? new Date(cycle.completed_at).toLocaleDateString() : '--'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={() => handleViewPayslips(cycle.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 600 }}>
                                  Preview Payslips
                                </button>
                                {cycle.status === 'Draft' && (
                                  <button onClick={() => handleLockCycle(cycle.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 600 }}>
                                    Lock & release payout
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Payslips Preview */}
              {selectedCycle && (
                <div className="premium-card" style={{ borderTop: '4px solid #0047B8' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Employee Payslips Breakdown</h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Gross Salary</th>
                          <th>PF Deductions</th>
                          <th>ESI Deductions</th>
                          <th>Professional Tax</th>
                          <th>TDS Deducted</th>
                          <th>Final Net Pay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payslips.map(ps => (
                          <tr key={ps.id}>
                            <td style={{ fontWeight: 600 }}>{ps.employee_name}</td>
                            <td>₹{parseFloat(ps.gross_salary).toLocaleString()}</td>
                            <td>₹{parseFloat(ps.pf_deduction).toLocaleString()}</td>
                            <td>₹{parseFloat(ps.esi_deduction).toLocaleString()}</td>
                            <td>₹{parseFloat(ps.professional_tax || 0).toLocaleString()}</td>
                            <td>₹{parseFloat(ps.tds_deduction || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: '#0047B8' }}>₹{parseFloat(ps.net_salary).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPLIANCE & STATUTORY TAB */}
          {activeWorkspaceTab === 'statutory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Statutory Audits Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <h4 style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Provident Fund (PF)</h4>
                    <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Status: <strong style={{ color: companyDetails.statutory.pf_enabled === 'true' ? '#10b981' : '#f59e0b' }}>{companyDetails.statutory.pf_enabled === 'true' ? 'Active' : 'Disabled'}</strong><br />
                      Deduction Rate: 12% of basic salary.<br />
                      PF remittance filed monthly via Electronic Challan cum Return (ECR).
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <h4 style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Employee State Insurance (ESI)</h4>
                    <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Status: <strong style={{ color: companyDetails.statutory.esi_enabled === 'true' ? '#10b981' : '#f59e0b' }}>{companyDetails.statutory.esi_enabled === 'true' ? 'Active' : 'Disabled'}</strong><br />
                      Deduction Rate: 0.75% of gross wages (employees earning &lt; ₹21,000/month).<br />
                      ESI contributions filed by 15th of the succeeding month.
                    </p>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <h4 style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Tax Deducted at Source (TDS)</h4>
                    <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                      TDS slab rate: {companyDetails.statutory.tds_rate}<br />
                      Filing Schedule: Form 24Q quarterly returns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* BILLING INVOICES WORKSPACE TAB */}
          {activeWorkspaceTab === 'invoices' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Billing invoice creation form */}
              <div className="premium-card" style={{ borderLeft: '4px solid #0047B8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.10rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {isEditingInvoice ? `Edit Tax Invoice (${invoiceForm.invoice_number})` : 'Tax Invoice & Billing Generator'}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Configure client details, rates, statutory percentages, and banking details before generating.
                    </p>
                  </div>
                  {isEditingInvoice && (
                    <button
                      onClick={() => {
                        setIsEditingInvoice(false);
                        setEditingInvoiceId(null);
                        setInvoiceForm(initialInvoiceForm);
                      }}
                      style={{ padding: '0.4rem 0.8rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                      Cancel Edit Mode
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleCreateInvoice} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  
                  {/* SECTION 1: INVOICE DETAILS */}
                  <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginTop: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#0047B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>1. Invoice & Billing Period</h4>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Invoice Number</label>
                    <input type="text" required placeholder="e.g. 01/2026-27" value={invoiceForm.invoice_number} onChange={e => setInvoiceForm({...invoiceForm, invoice_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Invoice Date</label>
                    <input type="date" required value={invoiceForm.invoice_date} onChange={e => setInvoiceForm({...invoiceForm, invoice_date: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Month</label>
                      <select value={invoiceForm.billing_month} onChange={e => setInvoiceForm({...invoiceForm, billing_month: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Year</label>
                      <select value={invoiceForm.billing_year} onChange={e => setInvoiceForm({...invoiceForm, billing_year: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                  </div>

                  {/* SECTION 2: CLIENT DETAILS */}
                  <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginTop: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#0047B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>2. Bill To (Client Details)</h4>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Client Company Name</label>
                    <input type="text" required placeholder="e.g. NDP ADVISORY SERVICES" value={invoiceForm.client_name} onChange={e => setInvoiceForm({...invoiceForm, client_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Client GSTIN</label>
                    <input type="text" required placeholder="e.g. 29AAECN9920B2ZF" value={invoiceForm.client_gstin} onChange={e => setInvoiceForm({...invoiceForm, client_gstin: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Client Address</label>
                    <input type="text" required placeholder="e.g. Davanagere" value={invoiceForm.client_address} onChange={e => setInvoiceForm({...invoiceForm, client_address: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  {/* SECTION 3: BILLING ITEMS */}
                  <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginTop: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#0047B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>3. Supply of Labour / Core Earnings</h4>
                  </div>
                  <div style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Description</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Daily Rate (₹)</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Man Days</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Total (₹)</span>
                    
                    {/* Basic and DA */}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Basic and DA</span>
                    <input type="number" required value={invoiceForm.basic_da_rate} onChange={e => setInvoiceForm({...invoiceForm, basic_da_rate: e.target.value})} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <input type="number" required value={invoiceForm.basic_da_mandays} onChange={e => setInvoiceForm({...invoiceForm, basic_da_mandays: e.target.value})} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <strong style={{ fontSize: '0.85rem', textAlign: 'right', color: '#0047B8' }}>₹{invoiceForm.basic_da_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>

                    {/* Allowances */}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Other Allowances</span>
                    <input type="number" required value={invoiceForm.allowances_rate} onChange={e => setInvoiceForm({...invoiceForm, allowances_rate: e.target.value})} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <input type="number" required value={invoiceForm.allowances_mandays} onChange={e => setInvoiceForm({...invoiceForm, allowances_mandays: e.target.value})} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <strong style={{ fontSize: '0.85rem', textAlign: 'right', color: '#0047B8' }}>₹{invoiceForm.allowances_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                  </div>

                  {/* SECTION 4: TAX & COMPLIANCE RATES */}
                  <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginTop: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#0047B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>4. Compliance & Tax Rates</h4>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>EPF Rate (%)</label>
                    <input type="number" step="0.01" required value={invoiceForm.epf_rate} onChange={e => setInvoiceForm({...invoiceForm, epf_rate: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>Amount: ₹{invoiceForm.epf_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>ESIC Rate (%)</label>
                    <input type="number" step="0.01" required value={invoiceForm.esic_rate} onChange={e => setInvoiceForm({...invoiceForm, esic_rate: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>Amount: ₹{invoiceForm.esic_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Service Charge Rate (%)</label>
                    <input type="number" step="0.01" required value={invoiceForm.service_charge_rate} onChange={e => setInvoiceForm({...invoiceForm, service_charge_rate: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>Amount: ₹{invoiceForm.service_charge_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>CGST Rate (%)</label>
                    <input type="number" step="0.01" required value={invoiceForm.cgst_rate} onChange={e => setInvoiceForm({...invoiceForm, cgst_rate: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>Amount: ₹{invoiceForm.cgst_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>SGST Rate (%)</label>
                    <input type="number" step="0.01" required value={invoiceForm.sgst_rate} onChange={e => setInvoiceForm({...invoiceForm, sgst_rate: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>Amount: ₹{invoiceForm.sgst_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>TDS Rate (%)</label>
                    <input type="number" step="0.01" required value={invoiceForm.tds_rate} onChange={e => setInvoiceForm({...invoiceForm, tds_rate: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>Amount: ₹{invoiceForm.tds_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>

                  {/* SECTION 5: BANK REMITTANCE */}
                  <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginTop: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#0047B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>5. Bank Details (Remittance Instructions)</h4>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Bank Name</label>
                    <input type="text" required value={invoiceForm.bank_name} onChange={e => setInvoiceForm({...invoiceForm, bank_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Account Number</label>
                    <input type="text" required value={invoiceForm.bank_account_number} onChange={e => setInvoiceForm({...invoiceForm, bank_account_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Account Type</label>
                    <input type="text" required value={invoiceForm.bank_account_type} onChange={e => setInvoiceForm({...invoiceForm, bank_account_type: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Branch Name</label>
                    <input type="text" required value={invoiceForm.bank_branch} onChange={e => setInvoiceForm({...invoiceForm, bank_branch: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>IFSC Code</label>
                    <input type="text" required value={invoiceForm.bank_ifsc} onChange={e => setInvoiceForm({...invoiceForm, bank_ifsc: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  {/* SECTION 6: SENDER DETAILS */}
                  <div style={{ gridColumn: 'span 3', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem', marginTop: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#0047B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>6. Company (Sender) Document Identifiers & Sign</h4>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company GSTIN</label>
                    <input type="text" required value={invoiceForm.company_gstin} onChange={e => setInvoiceForm({...invoiceForm, company_gstin: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company PAN</label>
                    <input type="text" required value={invoiceForm.company_pan} onChange={e => setInvoiceForm({...invoiceForm, company_pan: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company ESI Code</label>
                    <input type="text" required value={invoiceForm.company_esi} onChange={e => setInvoiceForm({...invoiceForm, company_esi: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company EPF Code</label>
                    <input type="text" required value={invoiceForm.company_epf} onChange={e => setInvoiceForm({...invoiceForm, company_epf: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Digital Signature (Text)</label>
                    <input type="text" required value={invoiceForm.digital_signature} onChange={e => setInvoiceForm({...invoiceForm, digital_signature: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  
                  {/* Summary row */}
                  <div style={{ gridColumn: 'span 3', padding: '1rem', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Net Payable Amount (Calculated Liability):</span>
                    <strong style={{ fontSize: '1.25rem', color: '#0047B8' }}>₹{invoiceForm.net_payment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
                  </div>

                  <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                      {isEditingInvoice ? 'Update Tax Invoice' : 'Generate Tax Invoice'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Company invoices registry history list */}
              <div className="premium-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Billing Invoices Ledger</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Client</th>
                        <th>Net Payable Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicesList.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No invoices raised yet.</td>
                        </tr>
                      ) : (
                        invoicesList.map(inv => (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: 700, color: '#0047B8' }}>{inv.invoice_number}</td>
                            <td style={{ fontWeight: 600 }}>{inv.client_name || 'N/A'}</td>
                            <td style={{ fontWeight: 700, color: '#10b981' }}>₹{parseFloat(inv.net_payment || inv.grand_total).toLocaleString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button onClick={() => setPreviewInvoice(inv)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 600 }}>
                                  <MdPrint /> View & Print
                                </button>
                                <button onClick={() => {
                                  setIsEditingInvoice(true);
                                  setEditingInvoiceId(inv.id);
                                  setInvoiceForm({
                                    ...inv,
                                    billing_month: String(inv.billing_month),
                                    billing_year: String(inv.billing_year)
                                  });
                                }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#0047B8', cursor: 'pointer', fontWeight: 600 }}>
                                  Edit Invoice
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
            </div>
          )}
        </>
      )}

      {/* -------------------- INVOICE PREVIEW MODAL overlay -------------------- */}
      {previewInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '850px', maxHeight: '95vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '12px', padding: '2.5rem' }}>
            
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <button 
                onClick={() => window.print()} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <MdPrint /> Print / Save PDF
              </button>
              <button 
                onClick={() => setPreviewInvoice(null)} 
                style={{ padding: '0.5rem 1.25rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Close Preview
              </button>
            </div>

            {/* Invoice Layout */}
            <div id="printable-area" style={{ color: '#000000', fontFamily: 'Inter, sans-serif', padding: '10px', fontSize: '11px', border: '1px solid #000000', backgroundColor: '#ffffff' }}>
              
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid #000000', paddingBottom: '5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                TAX INVOICE
              </div>

              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ maxWidth: '60%' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#000000', textTransform: 'uppercase' }}>
                    {selectedCompanyId ? (companyDetails.company?.name || 'A1 JOB ALLOCATE INDIA PRIVATE LIMITED') : 'A1 JOB ALLOCATE INDIA PRIVATE LIMITED'}
                  </div>
                  <div style={{ marginTop: '2px', color: '#333' }}>
                    {companyDetails.company?.logo ? 'Registered Corporate Office' : '10, Mallanayakanahalli Guladahalli, Harihara, 577530'}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>GST No:</strong> {previewInvoice.company_gstin || '29ABCCA0730F1Z3'}
                  </div>
                </div>

                <div style={{ border: '1px solid #000000', padding: '5px', minWidth: '220px' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '3px' }}>
                    <span style={{ width: '90px', fontWeight: 'bold' }}>Invoice Dated :</span>
                    <span>{new Date(previewInvoice.invoice_date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <span style={{ width: '90px', fontWeight: 'bold' }}>Invoice No :</span>
                    <span>{previewInvoice.invoice_number}</span>
                  </div>
                </div>
              </div>

              {/* To Client Info */}
              <div style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000', padding: '5px 0', marginBottom: '10px' }}>
                <strong>To.</strong><br />
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{previewInvoice.client_name}</div>
                <div>{previewInvoice.client_address}</div>
                <div><strong>GST No:</strong> {previewInvoice.client_gstin}</div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '10px', textTransform: 'none' }}>
                Supply of Un-Skilled Labour for the Month of {new Date(previewInvoice.billing_year, previewInvoice.billing_month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>

              {/* Itemized Grid Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                <thead>
                  <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000' }}>
                    <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'left', width: '45%' }}>Description</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', width: '15%' }}>Rate</th>
                    <th style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', width: '15%' }}>Man days</th>
                    <th style={{ padding: '5px', textAlign: 'right', width: '25%' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px dashed #cbd5e1' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px' }}>Basic and DA</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.basic_da_rate).toFixed(2)}</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.basic_da_mandays).toFixed(0)}</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.basic_da_amount).toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px' }}>Other Allowences</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.allowances_rate).toFixed(2)}</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.allowances_mandays).toFixed(0)}</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.allowances_amount).toFixed(2)}</td>
                  </tr>
                  
                  {/* SUB TOTAL A */}
                  <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #000000' }}>
                    <td colSpan="3" style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>Sub Total-A</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.professional_fee).toFixed(2)}</td>
                  </tr>

                  {/* STATUTORY BREAKDOWN */}
                  <tr style={{ borderBottom: '1px dashed #cbd5e1' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px' }}>EPF on Basic + DA ({parseFloat(previewInvoice.epf_rate)}%)</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.epf_amount).toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px dashed #cbd5e1' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px' }}>ESIC ({parseFloat(previewInvoice.esic_rate)}%)</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.esic_amount).toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px' }}>Service Charge ({parseFloat(previewInvoice.service_charge_rate)}%)</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.service_charge_amount).toFixed(2)}</td>
                  </tr>

                  {/* SUB TOTAL B */}
                  <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #000000' }}>
                    <td colSpan="3" style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>Sub Total-B</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>
                      {(parseFloat(previewInvoice.epf_amount) + parseFloat(previewInvoice.esic_amount) + parseFloat(previewInvoice.service_charge_amount)).toFixed(2)}
                    </td>
                  </tr>

                  {/* GST */}
                  <tr style={{ borderBottom: '1px dashed #cbd5e1' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px' }}>Goods & Service Tax @18%</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>
                      {(parseFloat(previewInvoice.professional_fee) + parseFloat(previewInvoice.epf_amount) + parseFloat(previewInvoice.esic_amount) + parseFloat(previewInvoice.service_charge_amount)).toFixed(2)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px dashed #cbd5e1' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', paddingLeft: '15px' }}>CGST ({parseFloat(previewInvoice.cgst_rate)}%)</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.cgst_amount).toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #000000' }}>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', paddingLeft: '15px' }}>SGST ({parseFloat(previewInvoice.sgst_rate)}%)</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>{parseFloat(previewInvoice.sgst_amount).toFixed(2)}</td>
                  </tr>

                  {/* SUB TOTAL C */}
                  <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #000000' }}>
                    <td colSpan="3" style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right' }}>Sub Total-C</td>
                    <td style={{ padding: '5px', textAlign: 'right' }}>
                      {(parseFloat(previewInvoice.cgst_amount) + parseFloat(previewInvoice.sgst_amount)).toFixed(2)}
                    </td>
                  </tr>

                  {/* GRAND TOTAL */}
                  <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #000000', fontSize: '12px' }}>
                    <td colSpan="3" style={{ borderRight: '1px solid #000000', padding: '6px 5px', textAlign: 'right' }}>Grand Total A+B+C = Invoice Value</td>
                    <td style={{ padding: '6px 5px', textAlign: 'right' }}>
                      {(parseFloat(previewInvoice.professional_fee) + parseFloat(previewInvoice.epf_amount) + parseFloat(previewInvoice.esic_amount) + parseFloat(previewInvoice.service_charge_amount) + parseFloat(previewInvoice.cgst_amount) + parseFloat(previewInvoice.sgst_amount)).toFixed(2)}
                    </td>
                  </tr>

                  {/* TDS */}
                  <tr style={{ borderBottom: '1px solid #000000', color: '#0047B8' }}>
                    <td colSpan="3" style={{ borderRight: '1px solid #000000', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>TDS @{parseFloat(previewInvoice.tds_rate)}%</td>
                    <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{parseFloat(previewInvoice.tds_amount).toFixed(2)}</td>
                  </tr>

                  {/* NET PAYMENT */}
                  <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #000000', fontSize: '13px', backgroundColor: '#f8fafc' }}>
                    <td colSpan="3" style={{ borderRight: '1px solid #000000', padding: '7px 5px', textAlign: 'right' }}>Net Payment</td>
                    <td style={{ padding: '7px 5px', textAlign: 'right', color: '#0047B8' }}>₹{parseFloat(previewInvoice.net_payment).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Footer Bank/Doc Details box */}
              <div style={{ display: 'flex', border: '1px solid #000000', minHeight: '100px' }}>
                {/* Bank Details */}
                <div style={{ width: '45%', padding: '5px', borderRight: '1px solid #000000' }}>
                  <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000000', paddingBottom: '2px', marginBottom: '3px' }}>BANK DETAILS</div>
                  <div><strong>Bank Name :</strong> {previewInvoice.bank_name || 'KARNATAKA BANK LTD'}</div>
                  <div><strong>Account No :</strong> {previewInvoice.bank_account_number || '0190202500001101'}</div>
                  <div><strong>Account Type :</strong> {previewInvoice.bank_account_type || 'CURRENT ACCOUNT'}</div>
                  <div><strong>Branch :</strong> {previewInvoice.bank_branch || 'K B EXTENSION DAVANGERE'}</div>
                  <div><strong>IFSC Code :</strong> {previewInvoice.bank_ifsc || 'KARB0000190'}</div>
                </div>

                {/* Documents identifiers */}
                <div style={{ width: '30%', padding: '5px', borderRight: '1px solid #000000' }}>
                  <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000000', paddingBottom: '2px', marginBottom: '3px' }}>Documents</div>
                  <div><strong>GST No :</strong> {previewInvoice.company_gstin || '29ABCCA0730F1Z3'}</div>
                  <div><strong>PAN :</strong> {previewInvoice.company_pan || 'ABCCA0730F'}</div>
                  <div><strong>ESI :</strong> {previewInvoice.company_esi || '58005233150000999'}</div>
                  <div><strong>EPF :</strong> {previewInvoice.company_epf || 'KNSHG3481108000'}</div>
                </div>

                {/* Signature area */}
                <div style={{ width: '25%', padding: '5px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    For {selectedCompanyId ? (companyDetails.company?.name || 'A1 JOB ALLOCATE INDIA PRIVATE LIMITED') : 'A1 JOB ALLOCATE INDIA PRIVATE LIMITED'}
                  </div>
                  <div style={{ textAlign: 'center', width: '100%', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid #cbd5e1', paddingTop: '2px' }}>
                    {previewInvoice.digital_signature || 'DIRECTOR'}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
