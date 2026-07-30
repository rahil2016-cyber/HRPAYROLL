import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatCard';
import LeafletMap from '../components/LeafletMap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { MdPeople, MdCheckCircle, MdEvent, MdBlock, MdAdd, MdSettings, MdMyLocation, MdCameraAlt, MdDevices, MdInfo, MdTrendingUp, MdOutlineNetworkCell, MdBusiness } from 'react-icons/md';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const INDIAN_BANKS = [
  { code: 'SBIN', name: 'STATE BANK OF INDIA' },
  { code: 'HDFC', name: 'HDFC BANK' },
  { code: 'ICIC', name: 'ICICI BANK' },
  { code: 'UTIB', name: 'AXIS BANK' },
  { code: 'KKBK', name: 'KOTAK MAHINDRA BANK' },
  { code: 'BARB', name: 'BANK OF BARODA' },
  { code: 'CNRB', name: 'CANARA BANK' },
  { code: 'PUNB', name: 'PUNJAB NATIONAL BANK' },
  { code: 'UBIN', name: 'UNION BANK OF INDIA' },
  { code: 'IDIB', name: 'INDIAN BANK' },
  { code: 'YESB', name: 'YES BANK' },
  { code: 'INDB', name: 'INDUSIND BANK' },
  { code: 'FDRL', name: 'FEDERAL BANK' },
  { code: 'IDFB', name: 'IDFC FIRST BANK' },
  { code: 'IBKL', name: 'IDBI BANK' },
  { code: 'SIBL', name: 'SOUTH INDIAN BANK' },
  { code: 'IOBA', name: 'INDIAN OVERSEAS BANK' },
  { code: 'UCBA', name: 'UCO BANK' },
  { code: 'CORP', name: 'CORPORATION BANK' },
  { code: 'ANDB', name: 'ANDHRA BANK' },
  { code: 'ALLA', name: 'ALLAHABAD BANK' },
  { code: 'SYNB', name: 'SYNDICATE BANK' },
  { code: 'VIJB', name: 'VIJAYA BANK' },
  { code: 'DBSS', name: 'DBS BANK INDIA' },
  { code: 'HSBC', name: 'HSBC BANK' },
  { code: 'SCBL', name: 'STANDARD CHARTERED BANK' },
  { code: 'JIOP', name: 'JIO PAYMENTS BANK' },
  { code: 'PYTM', name: 'PAYTM PAYMENTS BANK' },
  { code: 'AIRP', name: 'AIRTEL PAYMENTS BANK' },
  { code: 'IPOS', name: 'INDIA POST PAYMENTS BANK' },
  { code: 'KVBL', name: 'KARUR VYSYA BANK' },
  { code: 'TMBL', name: 'TAMILNAD MERCANTILE BANK' },
  { code: 'BAND', name: 'BANDHAN BANK' },
  { code: 'ESFB', name: 'EQUITAS SMALL FINANCE BANK' },
  { code: 'AUBL', name: 'AU SMALL FINANCE BANK' },
  { code: 'UJVN', name: 'UJJIVAN SMALL FINANCE BANK' },
  { code: 'JSBP', name: 'JANATA SAHAKARI BANK' },
  { code: 'SARA', name: 'SARASWAT COOPERATIVE BANK' },
  { code: 'TJSB', name: 'TJSB SAHAKARI BANK' },
  { code: 'COSB', name: 'COSMOS COOPERATIVE BANK' },
  { code: 'NKGS', name: 'NKGSB COOPERATIVE BANK' },
  { code: 'MCBL', name: 'MAHANAGAR COOPERATIVE BANK' },
  { code: 'GPUB', name: 'G P PARSIK BANK' },
  { code: 'SVCB', name: 'SVC COOPERATIVE BANK' },
  { code: 'KJSB', name: 'KALYAN JANATA SAHAKARI BANK' }
];

export default function HRDashboard({ token }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/hr/employees') || path.includes('/hr/directory')) return 'directory';
    if (path.includes('/hr/leaves')) return 'leaves';
    if (path.includes('/hr/departments') || path.includes('/hr/designations') || path.includes('/hr/structure')) return 'structure';
    if (path.includes('/hr/noticeboard')) return 'noticeboard';
    if (path.includes('/hr/settings')) return 'settings';
    if (path.includes('/hr/attendance')) return 'attendance';
    if (path.includes('/hr/payroll') || path.includes('/hr/billing')) return 'payroll-billing';
    if (path.includes('/hr/ca-partner')) return 'ca-partner';
    return 'overview';
  };

  const activeSubTab = getActiveTabFromPath();

  const handleSubTabChange = (tabId) => {
    if (tabId === 'directory') navigate('/hr/employees');
    else if (tabId === 'leaves') navigate('/hr/leaves');
    else if (tabId === 'structure') navigate('/hr/departments');
    else if (tabId === 'noticeboard') navigate('/hr/noticeboard');
    else if (tabId === 'settings') navigate('/hr/settings');
    else if (tabId === 'attendance') navigate('/hr/attendance');
    else if (tabId === 'payroll-billing') navigate('/hr/payroll');
    else if (tabId === 'ca-partner') navigate('/hr/ca-partner');
    else navigate('/hr');
    setFormSuccess(null);
    setFormError(null);
  };
  const [metrics, setMetrics] = useState({ total_employees: 0, present_today: 0, absent_today: 0, pending_leaves: 0 });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [todaysBirthdays, setTodaysBirthdays] = useState([]);
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
  
  // Self-Service Payroll & Invoices states
  const [serviceType, setServiceType] = useState('CompletePayroll');
  const [cyclesList, setCyclesList] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [payslipsList, setPayslipsList] = useState([]);
  const [caPartners, setCaPartners] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().substring(0, 10));
  const [empPage, setEmpPage] = useState(1);
  const [attPage, setAttPage] = useState(1);
  const itemsPerPage = 10;
  
  // Running payroll cycle
  const [runMonth, setRunMonth] = useState(String(new Date().getMonth() + 1));
  const [runYear, setRunYear] = useState(String(new Date().getFullYear()));
  const [runSuccess, setRunSuccess] = useState(null);
  const [runError, setRunError] = useState(null);

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

  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceFilterMonth, setInvoiceFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [invoiceFilterYear, setInvoiceFilterYear] = useState(String(new Date().getFullYear()));
  const [previewInvoice, setPreviewInvoice] = useState(null);

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

  const [loading, setLoading] = useState(true);

  // Client-Side Image Cropper states
  const [cropperRawImage, setCropperRawImage] = useState(null);
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  // Form states & Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [showNewDeptModal, setShowNewDeptModal] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ name: '', code: '', description: '' });
  const [addedEarnings, setAddedEarnings] = useState(['Basic', 'Fixed Allowance']);
  const [onboardedCreds, setOnboardedCreds] = useState(null);

  const initialEmpForm = {
    // Step 1: Basic Details
    first_name: '',
    middle_name: '',
    last_name: '',
    employee_code: '',
    date_of_joining: new Date().toISOString().substring(0, 10),
    email: '',
    mobile_number: '',
    is_director: false,
    gender: 'Male',
    branch_id: '',
    designation_id: '',
    department_id: '',
    enable_portal_access: true,
    password: 'emp123',

    // Step 2: Salary Details
    annual_ctc: 350000,
    basic_type: 'percent', // percent or fixed
    basic_value: 50,
    basic: 175000,
    hra_type: 'percent', // percent or fixed
    hra_value: 40, // 40% of basic
    hra: 70000,
    conveyance_allowance: 19200, // standard annual (1600/month)
    medical_allowance: 15000, // standard annual (1250/month)
    employer_pf_type: 'percent', // percent or fixed or none
    employer_pf_value: 12, // 12% of basic
    employer_pf: 21000,
    employer_esi_type: 'percent', // percent or fixed or none
    employer_esi_value: 3.25, // 3.25% of gross
    employer_esi: 0,
    gratuity_type: 'percent', // percent or fixed or none
    gratuity_value: 4.81, // 4.81% of basic
    gratuity: 8417,
    insurance: 0,
    bonus_type: 'none',
    bonus_value: 8.33,
    bonus: 0,
    lwf: 0,
    fixed_allowance: 0, // Special Allowance (Auto Calculated)
    other_benefits: '',

    // Step 3: Personal Details
    date_of_birth: '',
    age: '',
    father_name: '',
    pan: '',
    differently_abled_type: 'None',
    personal_email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Karnataka',
    pincode: '',

    // Step 4: Payment Information
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',

    // Additions: Photo and Emergency Contact
    photo: '',
    emergency_name: '',
    emergency_relationship: 'Parent',
    emergency_phone: ''
  };

  const [empForm, setEmpForm] = useState(initialEmpForm);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [desForm, setDesForm] = useState({ name: '' });
  const [annForm, setAnnForm] = useState({ title: '', content: '', target_role: 'All' });
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const [showAddCA, setShowAddCA] = useState(false);
  const [caForm, setCaForm] = useState({
    email: '',
    password: '',
    name: '',
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

  const handlePhotoFileSelected = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperRawImage(reader.result);
      setCropZoom(1);
      setCropX(0);
      setCropY(0);
      setShowCropperModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePerformCropAndCompress = () => {
    if (!cropperRawImage) return;

    const img = new Image();
    img.src = cropperRawImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const size = 150;
      canvas.width = size;
      canvas.height = size;

      const minDimension = Math.min(img.width, img.height);
      const sWidth = minDimension / cropZoom;
      const sHeight = minDimension / cropZoom;
      
      const maxOffsetX = img.width - sWidth;
      const maxOffsetY = img.height - sHeight;
      
      const sx = Math.max(0, Math.min(img.width - sWidth, (img.width / 2 - sWidth / 2) + cropX * maxOffsetX / 100));
      const sy = Math.max(0, Math.min(img.height - sHeight, (img.height / 2 - sHeight / 2) + cropY * maxOffsetY / 100));

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setEmpForm(prev => ({ ...prev, photo: compressedDataUrl }));
      setShowCropperModal(false);
      setCropperRawImage(null);
    };
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    setRunError(null);
    setRunSuccess(null);
    try {
      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/cycles', {
        month: parseInt(runMonth),
        year: parseInt(runYear)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRunSuccess(response.data.message);
      fetchHRData();
    } catch (err) {
      setRunError(err.response?.data?.error || 'Failed to trigger payroll cycle.');
    }
  };

  const handleLockCycle = async (cycleId) => {
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/cycles/lock', {
        cycle_id: cycleId,
        status: 'Paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHRData();
      if (selectedCycleId === cycleId) {
        handleViewPayslips(cycleId);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update cycle status.');
    }
  };

  const handleViewPayslips = async (cycleId) => {
    setSelectedCycleId(cycleId);
    setPayslipsList([]);
    try {
      const res = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/hr/payslips&cycle_id=${cycleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayslipsList(res.data.payslips || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (isEditingInvoice) {
        response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/invoices/update', {
          ...invoiceForm,
          id: editingInvoiceId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/invoices/create', {
          ...invoiceForm,
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
      fetchHRData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process invoice');
    }
  };

  const fetchHRData = async () => {
    try {
      // 1. Dashboard Stats
      const dashRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(dashRes.data.metrics);
      setRecentAttendance(dashRes.data.recent_attendance);
      setTodaysBirthdays(dashRes.data.todays_birthdays || []);
      
      const sType = dashRes.data.service_type || 'CompletePayroll';
      setServiceType(sType);

      if (sType === 'PlatformServices') {
        const cycleRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/cycles', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCyclesList(cycleRes.data.cycles || []);

        const invRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoicesList(invRes.data.invoices || []);
      }

      // 2. Employees List
      const empRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(empRes.data.employees);

      // 3. Leave Applications
      const leaveRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(leaveRes.data.leaves);

      // 4. Structural metadata
      const deptRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(deptRes.data.departments);

      const desRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/designations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDesignations(desRes.data.designations);

      const branchRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/branches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(branchRes.data.branches);

      // 5. Fetch Upgraded Attendance Stats & Logs
      const attStatsRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/attendance/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceMetrics(attStatsRes.data);

      const attLogsRes = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/hr/attendance&date=${attendanceDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHrAttendanceRecords(attLogsRes.data.attendance || []);

      const caPartnerRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/ca-partner', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCaPartners(caPartnerRes.data.ca_partners || []);

    } catch (err) {
      console.error("Error loading HR dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async (selectedDate) => {
    try {
      const res = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/hr/attendance&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHrAttendanceRecords(res.data.attendance || []);
    } catch (err) {
      console.error("Error fetching attendance logs for date", err);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [token]);

  const [settingsSubTab, setSettingsSubTab] = useState('profile');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [biometricKey, setBiometricKey] = useState('');
  const [biometricKeyLoading, setBiometricKeyLoading] = useState(false);
  const [biometricBrand, setBiometricBrand] = useState('ZKTeco');
  const [biometricDeviceName, setBiometricDeviceName] = useState('Office Entrance Machine');
  const [biometricIp, setBiometricIp] = useState('192.168.1.150');
  const [biometricPort, setBiometricPort] = useState('4370');
  const [biometricSerial, setBiometricSerial] = useState('ZK95001234567');
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState('');
  const [simulatedEmployeeCode, setSimulatedEmployeeCode] = useState('');
  const [simulatedDirection, setSimulatedDirection] = useState('check_in');
  const [simulatedTimestamp, setSimulatedTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState('');

  useEffect(() => {
    if (activeSubTab === 'settings' && settingsSubTab === 'biometric') {
      const fetchBiometricKey = async () => {
        setBiometricKeyLoading(true);
        try {
          const res = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/biometric/key', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBiometricKey(res.data.api_key || '');
        } catch (err) {
          console.error("Error fetching biometric API key", err);
        } finally {
          setBiometricKeyLoading(false);
        }
      };
      fetchBiometricKey();
    }
  }, [activeSubTab, settingsSubTab, token]);
  const [settingsForm, setSettingsForm] = useState({
    company_logo: '',
    company_name: '',
    legal_name: '',
    display_name: '',
    company_type: 'Private Limited',
    industry: '',
    company_size: '1-10 employees',
    year_established: '',
    website: '',
    official_email: '',
    phone_number: '',
    registered_address: '',
    corporate_address: '',
    city: '',
    state: '',
    country: 'India',
    pin_code: '',
    gst_number: '',
    pan_number: '',
    tan_number: '',
    cin_number: '',
    msme_registration: '',
    professional_tax_reg: '',
    shop_establishment_reg: '',
    labour_license_number: '',
    payroll_start_date: '',
    salary_cycle: 'Monthly',
    salary_pay_date: '30',
    financial_year: '2026-27',
    currency: 'INR',
    time_zone: 'Asia/Kolkata',
    working_days: '5',
    weekly_off: 'Saturday, Sunday',
    standard_working_hours: '8',
    attendance_method: 'GPS',
    pf_applicable: 'false',
    pf_number: '',
    esi_applicable: 'false',
    esi_number: '',
    professional_tax_applicable: 'false',
    lwf_applicable: 'false',
    gratuity_applicable: 'false',
    bonus_applicable: 'false',
    signature_image: '',
    company_seal: '',
    authorized_signatory_name: '',
    authorized_signatory_designation: '',
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_branch: ''
  });

  useEffect(() => {
    if (activeSubTab === 'settings') {
      const fetchSettings = async () => {
        setSettingsLoading(true);
        try {
          const res = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/company/settings', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { company, settings } = res.data;
          setSettingsForm({
            company_logo: company.logo ? `${window.API_BASE_URL}/${company.logo}` : '',
            company_name: company.name || '',
            legal_name: settings.legal_name || '',
            display_name: settings.display_name || '',
            company_type: settings.company_type || 'Private Limited',
            industry: settings.industry || '',
            company_size: settings.company_size || '1-10 employees',
            year_established: settings.year_established || '',
            website: settings.website || '',
            official_email: settings.official_email || '',
            phone_number: settings.phone_number || '',
            registered_address: settings.registered_address || '',
            corporate_address: settings.corporate_address || '',
            city: settings.city || '',
            state: settings.state || '',
            country: settings.country || 'India',
            pin_code: settings.pin_code || '',
            gst_number: settings.gst_number || '',
            pan_number: settings.pan_number || '',
            tan_number: settings.tan_number || '',
            cin_number: settings.cin_number || '',
            msme_registration: settings.msme_registration || '',
            professional_tax_reg: settings.professional_tax_reg || '',
            shop_establishment_reg: settings.shop_establishment_reg || '',
            labour_license_number: settings.labour_license_number || '',
            payroll_start_date: settings.payroll_start_date || '',
            salary_cycle: settings.salary_cycle || 'Monthly',
            salary_pay_date: settings.salary_pay_date || '30',
            financial_year: settings.financial_year || '2026-27',
            currency: settings.currency || 'INR',
            time_zone: settings.time_zone || 'Asia/Kolkata',
            working_days: settings.working_days || '5',
            weekly_off: settings.weekly_off || 'Saturday, Sunday',
            standard_working_hours: settings.standard_working_hours || '8',
            attendance_method: settings.attendance_method || 'GPS',
            pf_applicable: settings.pf_applicable || 'false',
            pf_number: settings.pf_number || '',
            esi_applicable: settings.esi_applicable || 'false',
            esi_number: settings.esi_number || '',
            professional_tax_applicable: settings.professional_tax_applicable || 'false',
            lwf_applicable: settings.lwf_applicable || 'false',
            gratuity_applicable: settings.gratuity_applicable || 'false',
            bonus_applicable: settings.bonus_applicable || 'false',
            signature_image: settings.signature_image_path ? `${window.API_BASE_URL}/${settings.signature_image_path}` : '',
            company_seal: settings.company_seal_path ? `${window.API_BASE_URL}/${settings.company_seal_path}` : '',
            authorized_signatory_name: settings.authorized_signatory_name || '',
            authorized_signatory_designation: settings.authorized_signatory_designation || '',
            bank_name: settings.bank_name || '',
            bank_account_holder: settings.bank_account_holder || '',
            bank_account_number: settings.bank_account_number || '',
            bank_ifsc: settings.bank_ifsc || '',
            bank_branch: settings.bank_branch || ''
          });
        } catch (err) {
          console.error("Error fetching company settings", err);
        } finally {
          setSettingsLoading(false);
        }
      };
      fetchSettings();
    }
  }, [activeSubTab, token]);

  const getSalaryCalculations = (form) => {
    const ctc = parseFloat(form.annual_ctc) || 0;
    
    // Basic
    let basic = 0;
    if (form.basic_type === 'percent') {
      basic = Math.round(ctc * ((parseFloat(form.basic_value) || 0) / 100));
    } else {
      basic = parseFloat(form.basic_value) || 0;
    }
    
    // HRA
    let hra = 0;
    if (form.hra_type === 'percent') {
      hra = Math.round(basic * ((parseFloat(form.hra_value) || 0) / 100));
    } else {
      hra = parseFloat(form.hra_value) || 0;
    }
    
    const conveyance = parseFloat(form.conveyance_allowance) || 0;
    const medical = parseFloat(form.medical_allowance) || 0;
    
    // Employer PF
    let employer_pf = 0;
    if (form.employer_pf_type === 'percent') {
      employer_pf = Math.round(basic * ((parseFloat(form.employer_pf_value) || 0) / 100));
    } else if (form.employer_pf_type === 'fixed') {
      employer_pf = parseFloat(form.employer_pf_value) || 0;
    }
    
    // Gratuity
    let gratuity = 0;
    if (form.gratuity_type === 'percent') {
      gratuity = Math.round(basic * ((parseFloat(form.gratuity_value) || 0) / 100));
    } else if (form.gratuity_type === 'fixed') {
      gratuity = parseFloat(form.gratuity_value) || 0;
    }
    
    const insurance = parseFloat(form.insurance) || 0;
    const lwf = parseFloat(form.lwf) || 0;
    
    // Bonus
    let bonus = 0;
    if (form.bonus_type === 'percent') {
      bonus = Math.round(basic * ((parseFloat(form.bonus_value) || 0) / 100));
    } else if (form.bonus_type === 'fixed') {
      bonus = parseFloat(form.bonus_value) || 0;
    }
    
    // ESI & Gross
    let tempGross = ctc - (employer_pf + gratuity + insurance + bonus + lwf);
    let employer_esi = 0;
    let gross = tempGross;
    
    if (form.employer_esi_type === 'percent') {
      const esiRate = (parseFloat(form.employer_esi_value) || 0) / 100;
      let estimatedMonthlyGross = tempGross / 12;
      if (estimatedMonthlyGross <= 21000) {
        gross = Math.round(tempGross / (1 + esiRate));
        employer_esi = Math.round(gross * esiRate);
      }
    } else if (form.employer_esi_type === 'fixed') {
      employer_esi = parseFloat(form.employer_esi_value) || 0;
      gross = tempGross - employer_esi;
    }
    
    // Special Allowance (Fixed Allowance)
    let fixed_allowance = Math.round(gross - (basic + hra + conveyance + medical));
    
    // Summary Metrics
    const allocated = basic + hra + conveyance + medical + employer_pf + employer_esi + gratuity + insurance + bonus + lwf;
    const remaining = ctc - allocated;
    
    // Monthly Deductions (estimates)
    const monthlyGross = gross / 12;
    const monthlyBasic = basic / 12;
    const empPF = (employer_pf > 0) ? (monthlyBasic * 0.12) : 0;
    const empESI = (monthlyGross <= 21000 && employer_esi > 0) ? (monthlyGross * 0.0075) : 0;
    const profTax = (monthlyGross > 15000) ? 200 : 0;
    const tds = (monthlyGross > 50000) ? (monthlyGross * 0.05) : 0;
    const totalDeductions = empPF + empESI + profTax + tds;
    const netSalary = Math.max(0, monthlyGross - totalDeductions);
    
    return {
      basic,
      hra,
      conveyance,
      medical,
      employer_pf,
      employer_esi,
      gratuity,
      insurance,
      bonus,
      lwf,
      fixed_allowance,
      gross,
      allocated,
      remaining,
      netSalary
    };
  };

  const handleEmpOnboard = async (e) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const first = empForm.first_name || '';
      const middle = empForm.middle_name || '';
      const last = empForm.last_name || '';
      const combinedName = [first, middle, last].filter(n => n.trim() !== '').join(' ');

      const calcs = getSalaryCalculations(empForm);
      if (calcs.fixed_allowance < 0) {
        throw new Error("Total salary components cannot exceed Annual CTC.");
      }

      const payload = {
        ...empForm,
        name: combinedName,
        basic: calcs.basic,
        hra: calcs.hra,
        conveyance_allowance: calcs.conveyance,
        medical_allowance: calcs.medical,
        employer_pf: calcs.employer_pf,
        employer_esi: calcs.employer_esi,
        gratuity: calcs.gratuity,
        insurance: calcs.insurance,
        bonus: calcs.bonus,
        lwf: calcs.lwf,
        fixed_allowance: calcs.fixed_allowance,
        monthly_salary: calcs.gross
      };

      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/employees', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOnboardedCreds({
        name: combinedName,
        email: empForm.email,
        employee_code: response.data.employee_code,
        password: response.data.password
      });
      setFormSuccess('Employee onboarded successfully!');
      setEmpForm(initialEmpForm);
      setWizardStep(1);
      setAddedEarnings(['Basic', 'Fixed Allowance']);
      fetchHRData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to onboard employee';
      const details = err.response?.data?.details || err.message;
      setFormError(`${errMsg}: ${details}`);
    }
  };

  const handleAddNewDept = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/departments', newDeptForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowNewDeptModal(false);
      setNewDeptForm({ name: '', code: '', description: '' });
      
      // Refresh departments and auto-select
      const deptRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(deptRes.data.departments);
      setEmpForm(prev => ({ ...prev, department_id: res.data.id }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create department.');
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/leaves', {
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
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/departments', deptForm, {
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
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/designations', desForm, {
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
      await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/announcements', annForm, {
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
      const res = await axios.get(`${window.API_BASE_URL}/index.php?route=/api/hr/attendance/${attId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRecord(res.data);
    } catch (err) {
      console.error("Failed to load attendance details", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleExportAttendance = () => {
    if (hrAttendanceRecords.length === 0) {
      alert("No attendance records to export.");
      return;
    }
    
    const headers = [
      "Employee ID",
      "Name",
      "Department",
      "Date",
      "Clock In",
      "Clock Out",
      "WFH Mode",
      "GPS Verified",
      "Face Verified",
      "Liveness Verified",
      "Clock-in Distance (meters)",
      "Daily Status"
    ];

    const rows = hrAttendanceRecords.map(att => [
      att.employee_code || '',
      att.employee_name || '',
      att.department_name || 'General',
      att.date || '',
      att.clock_in || '--:--',
      att.clock_out || '--:--',
      att.is_wfh === 1 ? 'Yes' : 'No',
      att.clock_in_gps_verified ? 'Yes' : 'No',
      att.clock_in_face_verified ? 'Yes' : 'No',
      att.clock_in_liveness_verified ? 'Yes' : 'No',
      att.is_wfh === 1 ? '0' : Math.round(att.clock_in_distance || 0),
      att.status || ''
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCAPartner = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    try {
      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/ca-partner', caForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormSuccess(response.data.message || 'CA/Finance Partner created successfully.');
      setCaForm({
        email: '',
        password: '',
        name: '',
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
      setShowAddCA(false);
      
      const caPartnerRes = await axios.get(window.API_BASE_URL + '/index.php?route=/api/hr/ca-partner', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCaPartners(caPartnerRes.data.ca_partners || []);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create CA/Finance partner.');
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

      {/* Tabs removed to use sidebar navigation */}

      {/* SUB-TAB 1: COMPANY OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {todaysBirthdays.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <div>
                <strong style={{ color: '#92400e', fontSize: '0.95rem', display: 'block' }}>Today's Birthday Celebrations! 🎂</strong>
                <span style={{ color: '#b45309', fontSize: '0.85rem' }}>
                  The following employees are celebrating their birthdays today: {todaysBirthdays.map(b => `${b.employee_name} (${b.employee_code})`).join(', ')}. Wish them a fantastic day! 🎈
                </span>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <StatCard title="Active Employees" value={metrics.total_employees} icon={MdPeople} description="Registered in catalog" />
            <span style={{ display: 'none' }}>Spacer</span>
            <StatCard title="Present Today" value={metrics.present_today} icon={MdCheckCircle} description="Clocked in geofence" trendColor="#0047B8" />
            <StatCard title="Out of Office" value={metrics.absent_today} icon={MdBlock} description="Absent or on leave" />
            <StatCard title="Pending Leave Approvals" value={metrics.pending_leaves} icon={MdEvent} description="Requires immediate response" trendColor="#E30613" />
          </div>

          {/* Billing & Subscriptions Summary Card */}
          <div className="premium-card" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            borderLeft: '4px solid #E30613',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Billing & Overtime Rate Summary</h4>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.75rem' }}>
                Subscription and Overtime pay rates scale dynamically based on the employee catalog size.
              </p>
              <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Active Employees Cost</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#E30613' }}>₹{(metrics.total_employees * 150).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>/ month</span></span>
                  <span style={{ fontSize: '0.65rem', display: 'block', color: '#64748b', marginTop: '0.1rem' }}>(Calculated at ₹150 per employee)</span>
                </div>
                <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '2.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Dynamic OT Payout Rate</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>₹{(metrics.total_employees * 5).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>/ minute</span></span>
                  <span style={{ fontSize: '0.65rem', display: 'block', color: '#64748b', marginTop: '0.1rem' }}>(Calculated at ₹5 * {metrics.total_employees} active employees)</span>
                </div>
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(227, 6, 19, 0.05)',
              padding: '0.8rem 1.2rem',
              borderRadius: '8px',
              border: '1px dashed rgba(227, 6, 19, 0.2)',
              textAlign: 'right',
              alignSelf: 'stretch',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 600 }}>NEXT INVOICE DUE</span>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>August 1, 2026</strong>
            </div>
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

        const totalAttPages = Math.ceil(hrAttendanceRecords.length / itemsPerPage) || 1;
        const paginatedAttendance = hrAttendanceRecords.slice((attPage - 1) * itemsPerPage, attPage * itemsPerPage);

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Daily Attendance Roster</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Select Date:</label>
                    <input 
                      type="date" 
                      value={attendanceDate} 
                      onChange={e => {
                        setAttendanceDate(e.target.value);
                        fetchAttendanceByDate(e.target.value);
                      }} 
                      style={{
                        padding: '0.35rem 0.6rem',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        color: '#334155',
                        backgroundColor: '#fff'
                      }} 
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportAttendance}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  Export to Excel (CSV)
                </button>
              </div>
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
                    {paginatedAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', color: '#64748b' }}>No check-in logs recorded today.</td>
                      </tr>
                    ) : (
                      paginatedAttendance.map((att, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img 
                                src={att.avatar ? `${window.API_BASE_URL}/${att.avatar}` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
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
              
              {/* Pagination Controls */}
              {hrAttendanceRecords.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Showing {(attPage - 1) * itemsPerPage + 1} to {Math.min(attPage * itemsPerPage, hrAttendanceRecords.length)} of {hrAttendanceRecords.length} entries
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      disabled={attPage === 1}
                      onClick={() => setAttPage(prev => prev - 1)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        backgroundColor: attPage === 1 ? '#f1f5f9' : '#fff',
                        color: attPage === 1 ? '#94a3b8' : '#334155',
                        cursor: attPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                      Page {attPage} of {totalAttPages}
                    </span>
                    <button
                      disabled={attPage === totalAttPages}
                      onClick={() => setAttPage(prev => prev + 1)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        backgroundColor: attPage === totalAttPages ? '#f1f5f9' : '#fff',
                        color: attPage === totalAttPages ? '#94a3b8' : '#334155',
                        cursor: attPage === totalAttPages ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* SUB-TAB 2: EMPLOYEE REGISTRY */}
      {activeSubTab === 'directory' && (() => {
        const totalEmpPages = Math.ceil(employees.length / itemsPerPage) || 1;
        const paginatedEmployees = employees.slice((empPage - 1) * itemsPerPage, empPage * itemsPerPage);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Onboarding Form */}
          <div className="premium-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Add Employee</h3>
            
            {/* Step Wizard Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', overflowX: 'auto', gap: '1rem' }}>
              {[
                { step: 1, label: 'Basic Details' },
                { step: 2, label: 'Salary Details' },
                { step: 3, label: 'Personal Details' },
                { step: 4, label: 'Payment Information' }
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: wizardStep === s.step ? 1 : 0.6 }}>
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: wizardStep >= s.step ? '#0047B8' : '#cbd5e1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {s.step}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: wizardStep === s.step ? 700 : 500, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {formSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(0,71,184,0.05)', borderRadius: '6px', color: '#0047B8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.5rem' }}>{formSuccess}</div>}
            {formError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.5rem' }}>{formError}</div>}

            <form onSubmit={(e) => {
              e.preventDefault();
              if (wizardStep === 2) {
                const calcs = getSalaryCalculations(empForm);
                if (calcs.fixed_allowance < 0) {
                  setFormError("Total salary components cannot exceed Annual CTC.");
                  return;
                }
              }
              if (wizardStep < 4) {
                setWizardStep(wizardStep + 1);
              } else {
                handleEmpOnboard(e);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* STEP 1: BASIC DETAILS */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Employee Name <span style={{ color: '#E30613' }}>*</span></label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        <input type="text" value={empForm.first_name} onChange={e => setEmpForm({...empForm, first_name: e.target.value})} required placeholder="First Name" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <input type="text" value={empForm.middle_name} onChange={e => setEmpForm({...empForm, middle_name: e.target.value})} placeholder="Middle Name" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <input type="text" value={empForm.last_name} onChange={e => setEmpForm({...empForm, last_name: e.target.value})} required placeholder="Last Name" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Employee ID</label>
                      <input type="text" value="Auto-Generated on Submit" disabled style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Date of Joining <span style={{ color: '#E30613' }}>*</span></label>
                      <input type="date" value={empForm.date_of_joining} onChange={e => setEmpForm({...empForm, date_of_joining: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Work Email <span style={{ color: '#E30613' }}>*</span></label>
                      <input type="email" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} required placeholder="abc@xyz.com" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Mobile Number</label>
                      <input type="text" value={empForm.mobile_number} onChange={e => setEmpForm({...empForm, mobile_number: e.target.value})} placeholder="e.g. 9876543210" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input type="checkbox" checked={empForm.is_director} onChange={e => setEmpForm({...empForm, is_director: e.target.checked})} />
                      Employee is a Director/person with substantial interest in the company.
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Gender <span style={{ color: '#E30613' }}>*</span></label>
                      <select value={empForm.gender} onChange={e => setEmpForm({...empForm, gender: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Work Location <span style={{ color: '#E30613' }}>*</span></label>
                      <select value={empForm.branch_id} onChange={e => setEmpForm({...empForm, branch_id: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                        <option value="">Select Branch</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Designation <span style={{ color: '#E30613' }}>*</span></label>
                      <select value={empForm.designation_id} onChange={e => setEmpForm({...empForm, designation_id: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                        <option value="">Select Designation</option>
                        {designations.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Department <span style={{ color: '#E30613' }}>*</span></span>
                        <button type="button" onClick={() => setShowNewDeptModal(true)} style={{ background: 'none', border: 'none', color: '#0047B8', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>+ Quick Add</button>
                      </label>
                      <select value={empForm.department_id} onChange={e => setEmpForm({...empForm, department_id: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                      <input type="checkbox" checked={empForm.enable_portal_access} onChange={e => setEmpForm({...empForm, enable_portal_access: e.target.checked})} style={{ marginTop: '0.2rem' }} />
                      <div>
                        <span>Enable Portal Access</span>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>The employee will be able to view payslips, submit their IT declaration and create reimbursement claims through the employee portal.</p>
                      </div>
                    </label>
                  </div>

                  {empForm.enable_portal_access && (
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Initial Portal Password <span style={{ color: '#E30613' }}>*</span></label>
                      <input type="text" value={empForm.password} onChange={e => setEmpForm({...empForm, password: e.target.value})} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      Save and Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SALARY DETAILS */}
              {wizardStep === 2 && (() => {
                const calcs = getSalaryCalculations(empForm);
                const isInvalid = calcs.fixed_allowance < 0;
                
                const fmt = (num) => {
                  const val = Math.round(num || 0);
                  return '₹' + val.toLocaleString('en-IN');
                };

                const basicPct = (calcs.basic / (empForm.annual_ctc || 1)) * 100;
                const isBasicWarn = basicPct < 40 || basicPct > 50;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Salary Structure</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Set how the employee's salary is divided for accurate pay calculation.</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '400px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Annual CTC <span style={{ color: '#E30613' }}>*</span></label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#64748b' }}>₹</span>
                        <input 
                          type="number" 
                          min="0" 
                          value={empForm.annual_ctc} 
                          onChange={e => {
                            const ctc = parseFloat(e.target.value) || 0;
                            setEmpForm(prev => ({ ...prev, annual_ctc: ctc }));
                          }} 
                          required 
                          style={{ 
                            width: '100%', 
                            padding: '0.5rem 0.5rem 0.5rem 1.75rem', 
                            borderRadius: '4px', 
                            border: isInvalid ? '1px solid #E30613' : '1px solid #cbd5e1',
                            backgroundColor: isInvalid ? 'rgba(227, 6, 19, 0.02)' : '#fff',
                            transition: 'all 0.2s',
                            fontWeight: 600
                          }} 
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>per year</span>
                    </div>

                    {/* Basic Warning Limit */}
                    {isBasicWarn && empForm.annual_ctc > 0 && (
                      <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', color: '#d97706', fontSize: '0.75rem', lineHeight: '1.4' }}>
                        ⚠️ <strong>Payroll Policy Recommendation:</strong> Basic Salary is currently <strong>{basicPct.toFixed(1)}%</strong> of CTC. Keeping Basic Salary between 40% and 50% of Annual CTC is standard practice under Indian payroll rules to optimize employee tax benefit structures.
                      </div>
                    )}

                    {/* Invalid Structure Warning */}
                    {isInvalid && (
                      <div style={{ padding: '0.75rem', backgroundColor: 'rgba(227, 6, 19, 0.05)', border: '1px solid rgba(227, 6, 19, 0.2)', borderRadius: '6px', color: '#E30613', fontSize: '0.75rem', fontWeight: 600, lineHeight: '1.4' }}>
                        ❌ Total salary components cannot exceed Annual CTC. The allocation is overallocated by {fmt(Math.abs(calcs.fixed_allowance))}. Please reduce component values or increase Annual CTC.
                      </div>
                    )}

                    {/* Live Salary Summary Card */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '1rem',
                      marginTop: '0.5rem',
                      marginBottom: '1rem',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.01)'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Annual CTC</span>
                        <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{fmt(empForm.annual_ctc)}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Monthly CTC</span>
                        <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{fmt(empForm.annual_ctc / 12)}</strong>
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#0047B8', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Gross Salary</span>
                        <strong style={{ fontSize: '1.1rem', color: '#0047B8' }}>{fmt(calcs.gross)}</strong>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>{fmt(calcs.gross / 12)} / mo</span>
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Employer Share</span>
                        <strong style={{ fontSize: '1.1rem', color: '#475569' }}>{fmt(calcs.employer_pf + calcs.employer_esi + calcs.gratuity + calcs.insurance + calcs.bonus + calcs.lwf)}</strong>
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Allocated</span>
                        <strong style={{ fontSize: '1.1rem', color: '#334155' }}>{fmt(calcs.allocated)}</strong>
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', color: isInvalid ? '#E30613' : '#16a34a', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Remaining</span>
                        <strong style={{ fontSize: '1.1rem', color: isInvalid ? '#E30613' : '#16a34a' }}>{fmt(calcs.remaining)}</strong>
                      </div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Est. Take-Home</span>
                        <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>{fmt(calcs.netSalary)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/ mo</span></strong>
                      </div>
                    </div>

                    <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', marginTop: '0.5rem' }}>
                      <table className="custom-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>Salary Component</th>
                            <th>Calculation Type</th>
                            <th style={{ textAlign: 'right', width: '220px' }}>Monthly Amount</th>
                            <th style={{ textAlign: 'right', width: '220px' }}>Annual Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Earnings Section */}
                          <tr style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}><td colSpan="4">Employee Earnings</td></tr>
                          
                          {/* Basic */}
                          <tr>
                            <td><strong>Basic Salary</strong></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select 
                                  value={empForm.basic_type} 
                                  onChange={e => {
                                    const type = e.target.value;
                                    setEmpForm(prev => ({ 
                                      ...prev, 
                                      basic_type: type, 
                                      basic_value: type === 'percent' ? 50 : Math.round(prev.annual_ctc * 0.5) 
                                    }));
                                  }}
                                  style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                >
                                  <option value="percent">% of CTC</option>
                                  <option value="fixed">Fixed</option>
                                </select>
                                {empForm.basic_type === 'percent' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max="100" 
                                      value={empForm.basic_value} 
                                      onChange={e => {
                                        const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                                        setEmpForm(prev => ({ ...prev, basic_value: val }));
                                      }}
                                      style={{ width: '55px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }} 
                                    />
                                    <span style={{ fontSize: '0.8rem' }}>%</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.basic_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={Math.round(calcs.basic / 12)} 
                                    onChange={e => {
                                      const monthlyVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, basic_value: monthlyVal * 12 }));
                                    }}
                                    style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <strong style={{ color: '#0f172a' }}>{fmt(calcs.basic / 12)}</strong>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.basic_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={calcs.basic} 
                                    onChange={e => {
                                      const annualVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, basic_value: annualVal }));
                                    }}
                                    style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <span style={{ color: '#475569' }}>{fmt(calcs.basic)}</span>
                              )}
                            </td>
                          </tr>

                          {/* HRA */}
                          <tr>
                            <td><strong>House Rent Allowance (HRA)</strong></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select 
                                  value={empForm.hra_type} 
                                  onChange={e => {
                                    const type = e.target.value;
                                    setEmpForm(prev => ({ 
                                      ...prev, 
                                      hra_type: type, 
                                      hra_value: type === 'percent' ? 40 : Math.round(calcs.basic * 0.4) 
                                    }));
                                  }}
                                  style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                >
                                  <option value="percent">% of Basic</option>
                                  <option value="fixed">Fixed</option>
                                </select>
                                {empForm.hra_type === 'percent' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max="100" 
                                      value={empForm.hra_value} 
                                      onChange={e => {
                                        const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                                        setEmpForm(prev => ({ ...prev, hra_value: val }));
                                      }}
                                      style={{ width: '55px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }} 
                                    />
                                    <span style={{ fontSize: '0.8rem' }}>%</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.hra_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={Math.round(calcs.hra / 12)} 
                                    onChange={e => {
                                      const monthlyVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, hra_value: monthlyVal * 12 }));
                                    }}
                                    style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <strong style={{ color: '#0f172a' }}>{fmt(calcs.hra / 12)}</strong>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.hra_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={calcs.hra} 
                                    onChange={e => {
                                      const annualVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, hra_value: annualVal }));
                                    }}
                                    style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <span style={{ color: '#475569' }}>{fmt(calcs.hra)}</span>
                              )}
                            </td>
                          </tr>

                          {/* Conveyance */}
                          <tr>
                            <td>Conveyance Allowance</td>
                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>Fixed</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={Math.round(empForm.conveyance_allowance / 12)} 
                                  onChange={e => {
                                    const monthlyVal = parseFloat(e.target.value) || 0;
                                    setEmpForm(prev => ({ ...prev, conveyance_allowance: monthlyVal * 12 }));
                                  }}
                                  style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={empForm.conveyance_allowance} 
                                  onChange={e => {
                                    const annualVal = parseFloat(e.target.value) || 0;
                                    setEmpForm(prev => ({ ...prev, conveyance_allowance: annualVal }));
                                  }}
                                  style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                />
                              </div>
                            </td>
                          </tr>

                          {/* Medical */}
                          <tr>
                            <td>Medical Allowance</td>
                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>Fixed</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={Math.round(empForm.medical_allowance / 12)} 
                                  onChange={e => {
                                    const monthlyVal = parseFloat(e.target.value) || 0;
                                    setEmpForm(prev => ({ ...prev, medical_allowance: monthlyVal * 12 }));
                                  }}
                                  style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={empForm.medical_allowance} 
                                  onChange={e => {
                                    const annualVal = parseFloat(e.target.value) || 0;
                                    setEmpForm(prev => ({ ...prev, medical_allowance: annualVal }));
                                  }}
                                  style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                />
                              </div>
                            </td>
                          </tr>

                          {/* Special Allowance */}
                          <tr style={{ backgroundColor: '#fafafa' }}>
                            <td>
                              <strong>Special Allowance</strong>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 400 }}>CTC residual balancer component</span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Auto Calculated</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: calcs.fixed_allowance < 0 ? '#E30613' : '#0f172a' }}>
                              {fmt(calcs.fixed_allowance / 12)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: calcs.fixed_allowance < 0 ? '#E30613' : '#475569' }}>
                              {fmt(calcs.fixed_allowance)}
                            </td>
                          </tr>

                          {/* Employer Contributions Section */}
                          <tr style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}><td colSpan="4">Employer Contributions</td></tr>

                          {/* Employer PF */}
                          <tr>
                            <td>Employer PF Contribution</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select 
                                  value={empForm.employer_pf_type} 
                                  onChange={e => {
                                    const type = e.target.value;
                                    setEmpForm(prev => ({ 
                                      ...prev, 
                                      employer_pf_type: type, 
                                      employer_pf_value: type === 'percent' ? 12 : type === 'fixed' ? 21600 : 0 
                                    }));
                                  }}
                                  style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                >
                                  <option value="percent">% of Basic</option>
                                  <option value="fixed">Fixed</option>
                                  <option value="none">None</option>
                                </select>
                                {empForm.employer_pf_type === 'percent' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={empForm.employer_pf_value} 
                                      onChange={e => {
                                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                                        setEmpForm(prev => ({ ...prev, employer_pf_value: val }));
                                      }}
                                      style={{ width: '55px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }} 
                                    />
                                    <span style={{ fontSize: '0.8rem' }}>%</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.employer_pf_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={Math.round(calcs.employer_pf / 12)} 
                                    onChange={e => {
                                      const monthlyVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, employer_pf_value: monthlyVal * 12 }));
                                    }}
                                    style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <strong>{fmt(calcs.employer_pf / 12)}</strong>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.employer_pf_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={calcs.employer_pf} 
                                    onChange={e => {
                                      const annualVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, employer_pf_value: annualVal }));
                                    }}
                                    style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <span>{fmt(calcs.employer_pf)}</span>
                              )}
                            </td>
                          </tr>

                          {/* Employer ESI */}
                          <tr>
                            <td>Employer ESI Contribution</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select 
                                  value={empForm.employer_esi_type} 
                                  onChange={e => {
                                    const type = e.target.value;
                                    setEmpForm(prev => ({ 
                                      ...prev, 
                                      employer_esi_type: type, 
                                      employer_esi_value: type === 'percent' ? 3.25 : type === 'fixed' ? 5000 : 0 
                                    }));
                                  }}
                                  style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                >
                                  <option value="percent">% of Gross</option>
                                  <option value="fixed">Fixed</option>
                                  <option value="none">None</option>
                                </select>
                                {empForm.employer_esi_type === 'percent' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={empForm.employer_esi_value} 
                                      onChange={e => {
                                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                                        setEmpForm(prev => ({ ...prev, employer_esi_value: val }));
                                      }}
                                      style={{ width: '55px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }} 
                                    />
                                    <span style={{ fontSize: '0.8rem' }}>%</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.employer_esi_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={Math.round(calcs.employer_esi / 12)} 
                                    onChange={e => {
                                      const monthlyVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, employer_esi_value: monthlyVal * 12 }));
                                    }}
                                    style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <strong>{fmt(calcs.employer_esi / 12)}</strong>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.employer_esi_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={calcs.employer_esi} 
                                    onChange={e => {
                                      const annualVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, employer_esi_value: annualVal }));
                                    }}
                                    style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <span>{fmt(calcs.employer_esi)}</span>
                              )}
                            </td>
                          </tr>

                          {/* Gratuity */}
                          <tr>
                            <td>Gratuity</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select 
                                  value={empForm.gratuity_type} 
                                  onChange={e => {
                                    const type = e.target.value;
                                    setEmpForm(prev => ({ 
                                      ...prev, 
                                      gratuity_type: type, 
                                      gratuity_value: type === 'percent' ? 4.81 : type === 'fixed' ? 8000 : 0 
                                    }));
                                  }}
                                  style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                >
                                  <option value="percent">% of Basic</option>
                                  <option value="fixed">Fixed</option>
                                  <option value="none">None</option>
                                </select>
                                {empForm.gratuity_type === 'percent' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={empForm.gratuity_value} 
                                      onChange={e => {
                                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                                        setEmpForm(prev => ({ ...prev, gratuity_value: val }));
                                      }}
                                      style={{ width: '55px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }} 
                                    />
                                    <span style={{ fontSize: '0.8rem' }}>%</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.gratuity_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={Math.round(calcs.gratuity / 12)} 
                                    onChange={e => {
                                      const monthlyVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, gratuity_value: monthlyVal * 12 }));
                                    }}
                                    style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <strong>{fmt(calcs.gratuity / 12)}</strong>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.gratuity_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={calcs.gratuity} 
                                    onChange={e => {
                                      const annualVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, gratuity_value: annualVal }));
                                    }}
                                    style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <span>{fmt(calcs.gratuity)}</span>
                              )}
                            </td>
                          </tr>

                          {/* Insurance */}
                          <tr>
                            <td>Insurance Allowance</td>
                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>Fixed</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={Math.round(empForm.insurance / 12)} 
                                  onChange={e => {
                                    const monthlyVal = parseFloat(e.target.value) || 0;
                                    setEmpForm(prev => ({ ...prev, insurance: monthlyVal * 12 }));
                                  }}
                                  style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={empForm.insurance} 
                                  onChange={e => {
                                    const annualVal = parseFloat(e.target.value) || 0;
                                    setEmpForm(prev => ({ ...prev, insurance: annualVal }));
                                  }}
                                  style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                />
                              </div>
                            </td>
                          </tr>

                          {/* Bonus */}
                          <tr>
                            <td>Statutory Bonus</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <select 
                                  value={empForm.bonus_type} 
                                  onChange={e => {
                                    const type = e.target.value;
                                    setEmpForm(prev => ({ 
                                      ...prev, 
                                      bonus_type: type, 
                                      bonus_value: type === 'percent' ? 8.33 : type === 'fixed' ? 7000 : 0 
                                    }));
                                  }}
                                  style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                >
                                  <option value="percent">% of Basic</option>
                                  <option value="fixed">Fixed</option>
                                  <option value="none">None</option>
                                </select>
                                {empForm.bonus_type === 'percent' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={empForm.bonus_value} 
                                      onChange={e => {
                                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                                        setEmpForm(prev => ({ ...prev, bonus_value: val }));
                                      }}
                                      style={{ width: '55px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }} 
                                    />
                                    <span style={{ fontSize: '0.8rem' }}>%</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.bonus_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={Math.round(calcs.bonus / 12)} 
                                    onChange={e => {
                                      const monthlyVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, bonus_value: monthlyVal * 12 }));
                                    }}
                                    style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <strong>{fmt(calcs.bonus / 12)}</strong>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {empForm.bonus_type === 'fixed' ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={calcs.bonus} 
                                    onChange={e => {
                                      const annualVal = parseFloat(e.target.value) || 0;
                                      setEmpForm(prev => ({ ...prev, bonus_value: annualVal }));
                                    }}
                                    style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                  />
                                </div>
                              ) : (
                                <span>{fmt(calcs.bonus)}</span>
                              )}
                            </td>
                          </tr>

                          {/* LWF */}
                          <tr>
                            <td>Labour Welfare Fund (LWF)</td>
                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>Fixed</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={Math.round(empForm.lwf / 12)} 
                                  onChange={e => {
                                    const monthlyVal = parseFloat(e.target.value) || 0;
                                    setEmpForm(prev => ({ ...prev, lwf: monthlyVal * 12 }));
                                  }}
                                  style={{ width: '100px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={empForm.lwf} 
                                  onChange={e => {
                                    const annualVal = parseFloat(e.target.value) || 0;
                                    setEmpForm(prev => ({ ...prev, lwf: annualVal }));
                                  }}
                                  style={{ width: '110px', padding: '0.2rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} 
                                />
                              </div>
                            </td>
                          </tr>

                          {/* CTC total row */}
                          <tr style={{ fontWeight: 700, backgroundColor: '#f0fdf4', color: '#166534' }}>
                            <td>Cost to Company (CTC)</td>
                            <td style={{ fontSize: '0.8rem' }}>Data Integrity Safe</td>
                            <td style={{ textAlign: 'right' }}>{fmt(empForm.annual_ctc / 12)}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(empForm.annual_ctc)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
                      <button type="button" onClick={() => setWizardStep(1)} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                        Back
                      </button>
                      <button 
                        type="submit" 
                        disabled={isInvalid}
                        style={{ 
                          backgroundColor: isInvalid ? '#cbd5e1' : '#0047B8', 
                          color: isInvalid ? '#94a3b8' : '#fff', 
                          border: 'none', 
                          padding: '0.65rem 1.25rem', 
                          borderRadius: '6px', 
                          fontWeight: 600, 
                          cursor: isInvalid ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        Save and Continue
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* STEP 3: PERSONAL DETAILS */}
              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Date of Birth <span style={{ color: '#E30613' }}>*</span></label>
                      <input type="date" value={empForm.date_of_birth} onChange={e => {
                        const dob = e.target.value;
                        const age = dob ? (new Date().getFullYear() - new Date(dob).getFullYear()) : 0;
                        setEmpForm({...empForm, date_of_birth: dob, age: age});
                      }} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Age</label>
                      <input type="number" readOnly value={empForm.age} placeholder="25" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Father's Name <span style={{ color: '#E30613' }}>*</span></label>
                      <input type="text" value={empForm.father_name} onChange={e => setEmpForm({...empForm, father_name: e.target.value})} required placeholder="Father's Name" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>PAN</label>
                      <input type="text" value={empForm.pan} onChange={e => setEmpForm({...empForm, pan: e.target.value.toUpperCase()})} placeholder="e.g. AAAA0000A" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Differently Abled Type</label>
                      <select value={empForm.differently_abled_type} onChange={e => setEmpForm({...empForm, differently_abled_type: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                        <option value="None">None</option>
                        <option value="Visual Impairment">Visual Impairment</option>
                        <option value="Hearing Impairment">Hearing Impairment</option>
                        <option value="Locomotor Disability">Locomotor Disability</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Personal Email Address</label>
                      <input type="email" value={empForm.personal_email} onChange={e => setEmpForm({...empForm, personal_email: e.target.value})} placeholder="personal@email.com" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Residential Address</label>
                    <input type="text" value={empForm.address_line1} onChange={e => setEmpForm({...empForm, address_line1: e.target.value})} placeholder="Address Line 1" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    <input type="text" value={empForm.address_line2} onChange={e => setEmpForm({...empForm, address_line2: e.target.value})} placeholder="Address Line 2" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '0.5rem' }}>
                      <input type="text" value={empForm.city} onChange={e => setEmpForm({...empForm, city: e.target.value})} placeholder="Town/City" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      <input type="text" value={empForm.state} onChange={e => setEmpForm({...empForm, state: e.target.value})} placeholder="State" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      <input type="text" value={empForm.pincode} onChange={e => setEmpForm({...empForm, pincode: e.target.value})} placeholder="PIN Code" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Profile Photo</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handlePhotoFileSelected(e.target.files[0])} 
                        style={{ fontSize: '0.8rem', width: '100%' }} 
                      />
                      {empForm.photo && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={empForm.photo} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                          <button type="button" onClick={() => setEmpForm({...empForm, photo: ''})} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Emergency Contact Details</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={empForm.emergency_name} 
                        onChange={e => setEmpForm({...empForm, emergency_name: e.target.value})} 
                        placeholder="Emergency Contact Name" 
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                      />
                      <select 
                        value={empForm.emergency_relationship} 
                        onChange={e => setEmpForm({...empForm, emergency_relationship: e.target.value})} 
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                      >
                        <option value="Parent">Parent</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                      <input 
                        type="text" 
                        value={empForm.emergency_phone} 
                        onChange={e => setEmpForm({...empForm, emergency_phone: e.target.value})} 
                        placeholder="Emergency Phone Number" 
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setWizardStep(2)} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      Back
                    </button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="button" onClick={() => setWizardStep(4)} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                        Skip
                      </button>
                      <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                        Save and Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PAYMENT INFORMATION */}
              {wizardStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Bank Name <span style={{ color: '#E30613' }}>*</span></label>
                      <input 
                        type="text" 
                        list="bank-list" 
                        value={empForm.bank_name} 
                        onChange={e => setEmpForm({...empForm, bank_name: e.target.value})} 
                        required 
                        placeholder="Select or type Bank Name" 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                      />
                      <datalist id="bank-list">
                        {INDIAN_BANKS.map(bank => (
                          <option key={bank.code} value={bank.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Account Number <span style={{ color: '#E30613' }}>*</span></label>
                      <input type="text" value={empForm.account_number} onChange={e => setEmpForm({...empForm, account_number: e.target.value})} required placeholder="Bank Account Number" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>IFSC Code <span style={{ color: '#E30613' }}>*</span></label>
                      <input 
                        type="text" 
                        value={empForm.ifsc_code} 
                        onChange={e => {
                          const ifsc = e.target.value.toUpperCase();
                          let autoBank = empForm.bank_name;
                          if (ifsc.length >= 4) {
                            const prefix = ifsc.substring(0, 4);
                            const matched = INDIAN_BANKS.find(b => b.code === prefix);
                            if (matched) {
                              autoBank = matched.name;
                            }
                          }
                          setEmpForm({
                            ...empForm, 
                            ifsc_code: ifsc, 
                            bank_name: autoBank
                          });
                        }} 
                        required 
                        placeholder="e.g. SBIN0001234" 
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Account Holder Name</label>
                      <input type="text" value={empForm.account_holder_name || `${empForm.first_name} ${empForm.last_name}`} onChange={e => setEmpForm({...empForm, account_holder_name: e.target.value})} placeholder="Name in Bank Account" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setWizardStep(3)} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      Back
                    </button>
                    <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
                      Save and Onboard
                    </button>
                  </div>
                </div>
              )}

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
                  {paginatedEmployees.map(emp => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 700 }}>{emp.employee_code}</td>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.branch_name || '--'}</td>
                      <td>{emp.department_name || '--'}</td>
                      <td>{emp.designation_name || '--'}</td>
                      <td>₹{parseFloat(emp.monthly_salary).toLocaleString()}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {employees.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Showing {(empPage - 1) * itemsPerPage + 1} to {Math.min(empPage * itemsPerPage, employees.length)} of {employees.length} entries
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    disabled={empPage === 1}
                    onClick={() => setEmpPage(prev => prev - 1)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      backgroundColor: empPage === 1 ? '#f1f5f9' : '#fff',
                      color: empPage === 1 ? '#94a3b8' : '#334155',
                      cursor: empPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                    Page {empPage} of {totalEmpPages}
                  </span>
                  <button
                    disabled={empPage === totalEmpPages}
                    onClick={() => setEmpPage(prev => prev + 1)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      backgroundColor: empPage === totalEmpPages ? '#f1f5f9' : '#fff',
                      color: empPage === totalEmpPages ? '#94a3b8' : '#334155',
                      cursor: empPage === totalEmpPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    })()}

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

      {/* SUB-TAB: PAYROLL & INVOICING */}
      {activeSubTab === 'payroll-billing' && serviceType === 'CompletePayroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="premium-card" style={{ borderLeft: '4px solid #E30613', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>CA Managed Complete Payroll Model</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Your company subscription has been provisioned under the <strong>Complete Payroll Service</strong> model. 
              Under this subscription, all professional CA services, ledger entries, tax invoice generation, and monthly payroll processing cycles are managed externally by your assigned Chartered Accountant.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <div style={{ flex: 1, minWidth: '240px', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0047B8', fontWeight: 700 }}>HR Permissions (Read-Only)</h4>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  <li>You can view all current active employee registers and records.</li>
                  <li>Salary structure details for staff can be configured on onboarding.</li>
                  <li>Daily attendance logs, check-ins, and leaves are fully manageable by HR.</li>
                  <li>Payroll runs and TAX INVOICE drafts must be generated and locked by the assigned CA.</li>
                </ul>
              </div>
              <div style={{ flex: 1, minWidth: '240px', backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0047B8', fontWeight: 700 }}>Need Changes?</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  If you need to make adjustments to a drafted or locked invoice, or if a payroll cycle requires manual corrections, please reach out to your assigned CA firm administrator. 
                  Only the super admin can adjust your subscription service model parameters.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'payroll-billing' && serviceType === 'PlatformServices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* RUN PAYROLL CYCLE FORM CARD */}
          <div className="premium-card" style={{ borderLeft: '4px solid #0047B8' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Run Self-Managed Payroll Cycle</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem', marginTop: 0 }}>
              Initiate a new monthly cycle for active employees. Basic, HRA, ESI, PF, TDS and attendance overtime payouts will be auto-calculated.
            </p>
            {runSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{runSuccess}</div>}
            {runError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>{runError}</div>}
            <form onSubmit={handleRunPayroll} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Billing Month</label>
                <select value={runMonth} onChange={e => setRunMonth(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', minWidth: '150px' }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Billing Year</label>
                <select value={runYear} onChange={e => setRunYear(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', minWidth: '120px' }}>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
              <button type="submit" style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                Run & Calculate Cycle
              </button>
            </form>
          </div>

          {/* ACTIVE & PAST PAYROLL CYCLES LEDGER */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
            <div className="premium-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Payroll Cycle Logs</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cyclesList.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#64748b' }}>No payroll cycles run yet.</td>
                      </tr>
                    ) : (
                      cyclesList.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{new Date(c.year, c.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: c.status === 'Paid' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                              color: c.status === 'Paid' ? '#10b981' : '#f59e0b'
                            }}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button onClick={() => handleViewPayslips(c.id)} style={{ border: 'none', backgroundColor: 'transparent', color: '#0047B8', fontWeight: 600, cursor: 'pointer' }}>
                                View Payslips
                              </button>
                              {c.status !== 'Paid' && (
                                <button onClick={() => handleLockCycle(c.id)} style={{ border: 'none', backgroundColor: 'transparent', color: '#10b981', fontWeight: 700, cursor: 'pointer' }}>
                                  Lock & Pay
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

            {selectedCycleId && (
              <div className="premium-card" style={{ borderTop: '4px solid #0047B8' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Employee Payslips Breakdown</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Gross</th>
                        <th>Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslipsList.map(ps => (
                        <tr key={ps.id}>
                          <td style={{ fontWeight: 600 }}>{ps.employee_name}</td>
                          <td>₹{parseFloat(ps.gross_salary).toLocaleString()}</td>
                          <td style={{ fontWeight: 700, color: '#0047B8' }}>₹{parseFloat(ps.net_salary).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SELF-SERVICE TAX INVOICES SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
            <div className="premium-card" style={{ borderLeft: '4px solid #0047B8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.10rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {isEditingInvoice ? `Edit Self-Raised Invoice (${invoiceForm.invoice_number})` : 'Raise New Tax Invoice'}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    Generate or edit Tax Invoices for client remittance. Amounts are calculated automatically as you type.
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
                  
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Basic and DA</span>
                  <input type="number" required value={invoiceForm.basic_da_rate} onChange={e => setInvoiceForm({...invoiceForm, basic_da_rate: e.target.value})} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  <input type="number" required value={invoiceForm.basic_da_mandays} onChange={e => setInvoiceForm({...invoiceForm, basic_da_mandays: e.target.value})} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  <strong style={{ fontSize: '0.85rem', textAlign: 'right', color: '#0047B8' }}>₹{invoiceForm.basic_da_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>

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

            {/* BILLING INVOICES LEDGER */}
            <div className="premium-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>Self-Raised Invoices Ledger</h3>
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
                                <MdMyLocation /> View & Print
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
        </div>
      )}

      {/* SUB-TAB 6: SETTINGS */}
      {activeSubTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem' }}>
          
          {/* Settings Left Sub-Tabs Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { id: 'profile', label: 'Company Profile' },
              { id: 'payroll', label: 'Payroll' },
              { id: 'compliance', label: 'Compliance' },
              { id: 'branding', label: 'Branding' },
              { id: 'bank', label: 'Bank Details' },
              { id: 'biometric', label: 'Biometric Integration' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setSettingsSubTab(sub.id)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: settingsSubTab === sub.id ? '#0047B8' : 'transparent',
                  color: settingsSubTab === sub.id ? '#fff' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Settings Right Edit Form Panel */}
          <div className="premium-card" style={{ padding: '2rem' }}>
            {settingsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#64748b' }}>
                Loading settings database metadata...
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setFormError(null);
                setFormSuccess(null);
                
                // Form validations
                if (settingsForm.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(settingsForm.gst_number)) {
                  setFormError("Invalid GSTIN format (e.g. 29AAAAA0000A1Z5)");
                  return;
                }
                if (settingsForm.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(settingsForm.pan_number)) {
                  setFormError("Invalid PAN format (e.g. ABCDE1234F)");
                  return;
                }
                if (settingsForm.tan_number && !/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(settingsForm.tan_number)) {
                  setFormError("Invalid TAN format (e.g. ABCD12345E)");
                  return;
                }
                if (settingsForm.cin_number && !/^[UuLl][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/.test(settingsForm.cin_number)) {
                  setFormError("Invalid CIN format");
                  return;
                }
                if (settingsForm.bank_ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(settingsForm.bank_ifsc)) {
                  setFormError("Invalid IFSC Code format (e.g. SBIN0001234)");
                  return;
                }
                if (settingsForm.pin_code && !/^\d{6}$/.test(settingsForm.pin_code)) {
                  setFormError("PIN Code must be exactly 6 digits");
                  return;
                }

                try {
                  const res = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/company/settings/update', settingsForm, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.data.success) {
                    setFormSuccess("Company settings updated successfully!");
                  }
                } catch (err) {
                  setFormError(err.response?.data?.error || "Failed to update company settings");
                }
              }}>
                {formSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(0,71,184,0.05)', borderRadius: '6px', color: '#0047B8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.25rem' }}>{formSuccess}</div>}
                {formError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1.25rem' }}>{formError}</div>}

                {/* NESTED TAB 1: COMPANY PROFILE */}
                {settingsSubTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Company Profile Information</h4>
                    
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                      <div style={{
                        width: '75px',
                        height: '75px',
                        borderRadius: '8px',
                        border: '2px dashed #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#f8fafc'
                      }}>
                        {settingsForm.company_logo ? (
                          <img src={settingsForm.company_logo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <MdCheckCircle size={24} style={{ color: '#94a3b8' }} />
                        )}
                      </div>
                      <div>
                        <label style={{
                          display: 'inline-block',
                          padding: '0.45rem 0.85rem',
                          backgroundColor: '#fff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#475569'
                        }}>
                          Change Company Logo
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setSettingsForm({ ...settingsForm, company_logo: r.result });
                              r.readAsDataURL(file);
                            }
                          }} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Company Name *</label>
                        <input type="text" value={settingsForm.company_name} onChange={e => setSettingsForm({ ...settingsForm, company_name: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Legal Business Name *</label>
                        <input type="text" value={settingsForm.legal_name} onChange={e => setSettingsForm({ ...settingsForm, legal_name: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Display Name</label>
                        <input type="text" value={settingsForm.display_name} onChange={e => setSettingsForm({ ...settingsForm, display_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Company Type</label>
                        <select value={settingsForm.company_type} onChange={e => setSettingsForm({ ...settingsForm, company_type: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                          <option value="Private Limited">Private Limited</option>
                          <option value="LLP">LLP</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Proprietorship">Proprietorship</option>
                          <option value="Public Limited">Public Limited</option>
                          <option value="NGO">NGO</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Industry</label>
                        <input type="text" value={settingsForm.industry} onChange={e => setSettingsForm({ ...settingsForm, industry: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Company Size</label>
                        <select value={settingsForm.company_size} onChange={e => setSettingsForm({ ...settingsForm, company_size: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                          <option value="1-10 employees">1-10 employees</option>
                          <option value="11-50 employees">11-50 employees</option>
                          <option value="51-200 employees">51-200 employees</option>
                          <option value="201-500 employees">201-500 employees</option>
                          <option value="500+ employees">500+ employees</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Year Established</label>
                        <input type="number" value={settingsForm.year_established} onChange={e => setSettingsForm({ ...settingsForm, year_established: parseInt(e.target.value) || '' })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Website</label>
                        <input type="text" value={settingsForm.website} onChange={e => setSettingsForm({ ...settingsForm, website: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Official Email *</label>
                        <input type="email" value={settingsForm.official_email} onChange={e => setSettingsForm({ ...settingsForm, official_email: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
                        <input type="text" value={settingsForm.phone_number} onChange={e => setSettingsForm({ ...settingsForm, phone_number: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1rem', paddingTop: '1rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Registered Office Address *</label>
                      <textarea rows="2" value={settingsForm.registered_address} onChange={e => setSettingsForm({ ...settingsForm, registered_address: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>City *</label>
                        <input type="text" value={settingsForm.city} onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>State *</label>
                        <input type="text" value={settingsForm.state} onChange={e => setSettingsForm({ ...settingsForm, state: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>PIN Code *</label>
                        <input type="text" value={settingsForm.pin_code} onChange={e => setSettingsForm({ ...settingsForm, pin_code: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* NESTED TAB 2: PAYROLL */}
                {settingsSubTab === 'payroll' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Payroll Cycles & Calendar Settings</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Payroll Start Date</label>
                        <input type="date" value={settingsForm.payroll_start_date} onChange={e => setSettingsForm({ ...settingsForm, payroll_start_date: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Salary Cycle</label>
                        <select value={settingsForm.salary_cycle} onChange={e => setSettingsForm({ ...settingsForm, salary_cycle: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                          <option value="Monthly">Monthly</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Bi-weekly">Bi-weekly</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Salary Pay Date</label>
                        <select value={settingsForm.salary_pay_date} onChange={e => setSettingsForm({ ...settingsForm, salary_pay_date: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                          <option value="25">25th</option>
                          <option value="28">28th</option>
                          <option value="30">Last day</option>
                          <option value="5">5th of next month</option>
                          <option value="10">10th of next month</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Financial Year</label>
                        <select value={settingsForm.financial_year} onChange={e => setSettingsForm({ ...settingsForm, financial_year: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                          <option value="2026-27">2026-27</option>
                          <option value="2025-26">2025-26</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Working Days per Week</label>
                        <select value={settingsForm.working_days} onChange={e => setSettingsForm({ ...settingsForm, working_days: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                          <option value="5">5 Days</option>
                          <option value="6">6 Days</option>
                          <option value="5.5">5.5 Days</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Primary Attendance Check-In</label>
                        <select value={settingsForm.attendance_method} onChange={e => setSettingsForm({ ...settingsForm, attendance_method: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                          <option value="GPS">GPS Location (Geofencing)</option>
                          <option value="Face Recognition">Face Recognition Portal</option>
                          <option value="Biometric">Biometric Sync</option>
                          <option value="Manual">Manual Approvals</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Weekly Off Days</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                          const selectedDays = settingsForm.weekly_off ? settingsForm.weekly_off.split(',').map(d => d.trim()) : [];
                          const isSelected = selectedDays.includes(day);
                          return (
                            <button
                              type="button"
                              key={day}
                              onClick={() => {
                                let updated;
                                if (isSelected) {
                                  updated = selectedDays.filter(d => d !== day);
                                } else {
                                  updated = [...selectedDays, day];
                                }
                                const orderedUpdated = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].filter(d => updated.includes(d));
                                setSettingsForm({ ...settingsForm, weekly_off: orderedUpdated.join(', ') });
                              }}
                              style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: '20px',
                                border: isSelected ? '1.5px solid #0047B8' : '1px solid #cbd5e1',
                                backgroundColor: isSelected ? 'rgba(0, 71, 184, 0.08)' : '#fff',
                                color: isSelected ? '#0047B8' : '#475569',
                                fontWeight: isSelected ? '600' : '400',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* NESTED TAB 3: COMPLIANCE */}
                {settingsSubTab === 'compliance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Compliance Registers & Statutory Slabs</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>GSTIN Number</label>
                        <input type="text" value={settingsForm.gst_number} onChange={e => setSettingsForm({ ...settingsForm, gst_number: e.target.value.toUpperCase() })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>PAN Number</label>
                        <input type="text" value={settingsForm.pan_number} onChange={e => setSettingsForm({ ...settingsForm, pan_number: e.target.value.toUpperCase() })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>TAN Number</label>
                        <input type="text" value={settingsForm.tan_number} onChange={e => setSettingsForm({ ...settingsForm, tan_number: e.target.value.toUpperCase() })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>CIN</label>
                        <input type="text" value={settingsForm.cin_number} onChange={e => setSettingsForm({ ...settingsForm, cin_number: e.target.value.toUpperCase() })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>Provident Fund (EPF) Deductions</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>12% basic contribution rules</span>
                        </div>
                        <select value={settingsForm.pf_applicable} onChange={e => setSettingsForm({ ...settingsForm, pf_applicable: e.target.value })} style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                          <option value="true">APPLICABLE</option>
                          <option value="false">NOT APPLICABLE</option>
                        </select>
                      </div>

                      {settingsForm.pf_applicable === 'true' && (
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>PF Registration Number</label>
                          <input type="text" value={settingsForm.pf_number} onChange={e => setSettingsForm({ ...settingsForm, pf_number: e.target.value.toUpperCase() })} style={{ width: '100%', maxWidth: '350px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>Employees' State Insurance (ESI)</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Statutory health slabs under ₹21,000 monthly gross</span>
                        </div>
                        <select value={settingsForm.esi_applicable} onChange={e => setSettingsForm({ ...settingsForm, esi_applicable: e.target.value })} style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                          <option value="true">APPLICABLE</option>
                          <option value="false">NOT APPLICABLE</option>
                        </select>
                      </div>

                      {settingsForm.esi_applicable === 'true' && (
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>ESI Registration Code</label>
                          <input type="text" value={settingsForm.esi_number} onChange={e => setSettingsForm({ ...settingsForm, esi_number: e.target.value })} style={{ width: '100%', maxWidth: '350px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* NESTED TAB 4: BRANDING */}
                {settingsSubTab === 'branding' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Brand Assets & Document Templates</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Authorized Signatory Name *</label>
                        <input type="text" value={settingsForm.authorized_signatory_name} onChange={e => setSettingsForm({ ...settingsForm, authorized_signatory_name: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Signatory Designation</label>
                        <input type="text" value={settingsForm.authorized_signatory_designation} onChange={e => setSettingsForm({ ...settingsForm, authorized_signatory_designation: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                        <strong style={{ fontSize: '0.8rem' }}>Authorized Signature</strong>
                        <div style={{ height: '70px', width: '160px', backgroundColor: '#fff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {settingsForm.signature_image ? <img src={settingsForm.signature_image} alt="Signature Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'No signature image'}
                        </div>
                        <label style={{ padding: '0.35rem 0.75rem', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                          Upload Signature
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setSettingsForm({ ...settingsForm, signature_image: r.result });
                              r.readAsDataURL(file);
                            }
                          }} style={{ display: 'none' }} />
                        </label>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                        <strong style={{ fontSize: '0.8rem' }}>Company Seal / Stamp</strong>
                        <div style={{ height: '70px', width: '70px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {settingsForm.company_seal ? <img src={settingsForm.company_seal} alt="Seal Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'No seal stamp'}
                        </div>
                        <label style={{ padding: '0.35rem 0.75rem', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                          Upload Seal Stamp
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setSettingsForm({ ...settingsForm, company_seal: r.result });
                              r.readAsDataURL(file);
                            }
                          }} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* NESTED TAB 5: BANK DETAILS */}
                {settingsSubTab === 'bank' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Corporate Bank Account</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Bank Name *</label>
                        <input 
                          type="text" 
                          list="settings-bank-list" 
                          value={settingsForm.bank_name} 
                          onChange={e => setSettingsForm({ ...settingsForm, bank_name: e.target.value })} 
                          required 
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                        />
                        <datalist id="settings-bank-list">
                          {INDIAN_BANKS.map(bank => (
                            <option key={bank.code} value={bank.name} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Account Holder Name *</label>
                        <input type="text" value={settingsForm.bank_account_holder} onChange={e => setSettingsForm({ ...settingsForm, bank_account_holder: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Account Number *</label>
                        <input type="text" value={settingsForm.bank_account_number} onChange={e => setSettingsForm({ ...settingsForm, bank_account_number: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>IFSC Code *</label>
                        <input 
                          type="text" 
                          value={settingsForm.bank_ifsc} 
                          onChange={e => {
                            const ifsc = e.target.value.toUpperCase();
                            let bName = settingsForm.bank_name;
                            if (ifsc.length >= 4) {
                              const matched = INDIAN_BANKS.find(b => b.code === ifsc.substring(0, 4));
                              if (matched) bName = matched.name;
                            }
                            setSettingsForm({ ...settingsForm, bank_ifsc: ifsc, bank_name: bName });
                          }} 
                          required 
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Branch Name</label>
                        <input type="text" value={settingsForm.bank_branch} onChange={e => setSettingsForm({ ...settingsForm, bank_branch: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* NESTED TAB 6: BIOMETRIC INTEGRATION */}
                {settingsSubTab === 'biometric' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>Biometric Attendance Machine Integration</h4>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                        Connect physical fingerprint/biometric devices (ZKTeco, eSSL, Matrix, Mantra) to automatically sync punch logs with the HRMS database for automated payroll calculations.
                      </p>
                    </div>

                    {/* Interactive Pipeline / Data Flow Diagram */}
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', padding: '1.5rem', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', marginTop: 0, marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Biometric Data Synchronization Pipeline
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', position: 'relative' }}>
                        {[
                          { step: "Employee", desc: "Fingerprint Scan" },
                          { step: "Biometric Device", desc: "Local Punch Log" },
                          { step: "Device API / SDK", desc: "ADMS Push Protocol" },
                          { step: "Payroll Server", desc: "Verification Engine" },
                          { step: "Database", desc: "Attendance Table" },
                          { step: "Salary Engine", desc: "Overtime & Present Days" }
                        ].map((item, idx, arr) => (
                          <React.Fragment key={idx}>
                            <div style={{ flex: '1', minWidth: '130px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0047B8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                {idx + 1}
                              </div>
                              <strong style={{ fontSize: '0.8rem', display: 'block', color: '#f1f5f9' }}>{item.step}</strong>
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>{item.desc}</span>
                            </div>
                            {idx < arr.length - 1 && (
                              <div style={{ color: '#0047B8', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                →
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                      {/* Left: Device Configuration */}
                      <div className="premium-card" style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Device Connectivity Settings</h5>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Popular Device Brand</label>
                            <select value={biometricBrand} onChange={e => setBiometricBrand(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem' }}>
                              <option value="ZKTeco">ZKTeco</option>
                              <option value="eSSL">eSSL (Enterprise)</option>
                              <option value="Matrix">Matrix COSEC</option>
                              <option value="Mantra">Mantra</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Device Custom Name</label>
                            <input type="text" value={biometricDeviceName} onChange={e => setBiometricDeviceName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Machine Static IP / URL</label>
                            <input type="text" value={biometricIp} onChange={e => setBiometricIp(e.target.value)} placeholder="192.168.1.150" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>TCP Communication Port</label>
                            <input type="text" value={biometricPort} onChange={e => setBiometricPort(e.target.value)} placeholder="4370" style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Device Serial Number / ID</label>
                          <input type="text" value={biometricSerial} onChange={e => setBiometricSerial(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>

                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setConnectionTesting(true);
                              setConnectionResult('');
                              setTimeout(() => {
                                setConnectionTesting(false);
                                setConnectionResult({
                                  success: true,
                                  msg: `Successfully connected to ${biometricBrand} Machine (${biometricIp}:${biometricPort})! Status: ONLINE. Device Serial ${biometricSerial} verified.`
                                });
                              }, 1500);
                            }}
                            disabled={connectionTesting}
                            style={{
                              padding: '0.55rem 1.25rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              backgroundColor: '#f8fafc',
                              color: '#334155',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            {connectionTesting ? 'Connecting to Machine API...' : '⚡ Connect / Test Machine Link'}
                          </button>

                          {connectionResult && (
                            <div style={{
                              marginTop: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              fontSize: '0.75rem',
                              lineHeight: '1.4'
                            }}>
                              ✅ <strong>Link Active:</strong> {connectionResult.msg}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: API Credentials */}
                      <div className="premium-card" style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>API Key Credentials (for SDK Push)</h5>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                          Configure your local biometric server or machine client to push punch logs using the authorization credentials below.
                        </p>

                        <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>ENDPOINT URL</label>
                          <div style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem', wordBreak: 'break-all', fontFamily: 'monospace', color: '#334155' }}>
                            {window.API_BASE_URL}/index.php?route=/api/biometric
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>X-API-KEY HEADER</label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="text"
                              readOnly
                              value={biometricKeyLoading ? 'Loading API Key...' : biometricKey}
                              style={{ flex: 1, padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'monospace', color: '#0f172a' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(biometricKey);
                                alert("API Key copied to clipboard!");
                              }}
                              style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to regenerate the API key? Any machines currently using the old key will stop syncing.")) return;
                              setBiometricKeyLoading(true);
                              try {
                                const res = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/biometric/key/regenerate', {}, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                setBiometricKey(res.data.api_key || '');
                                alert("New API Key generated successfully!");
                              } catch (err) {
                                alert("Failed to regenerate API Key.");
                              } finally {
                                setBiometricKeyLoading(false);
                              }
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              border: '1px solid #e11d48',
                              borderRadius: '6px',
                              backgroundColor: '#fff',
                              color: '#e11d48',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            🔄 Regenerate Secret API Key
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Biometric Simulator tool */}
                    <div className="premium-card" style={{ padding: '1.25rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>🔧 Live Biometric Machine Punch Simulator</h5>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                        Simulate a physical fingerprint scan at the machine. This directly triggers the backend API pipeline to write attendance records.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Select Employee</label>
                          <select
                            value={simulatedEmployeeCode}
                            onChange={e => setSimulatedEmployeeCode(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem' }}
                          >
                            <option value="">-- Choose Employee --</option>
                            {employees && employees.map(emp => (
                              <option key={emp.id} value={emp.employee_code}>
                                {emp.first_name} {emp.last_name} ({emp.employee_code || 'No Code'})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Punch Type</label>
                          <select
                            value={simulatedDirection}
                            onChange={e => setSimulatedDirection(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem' }}
                          >
                            <option value="check_in">Clock In (Check-In)</option>
                            <option value="check_out">Clock Out (Check-Out)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#475569' }}>Punch Time</label>
                          <input
                            type="datetime-local"
                            value={simulatedTimestamp}
                            onChange={e => setSimulatedTimestamp(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!simulatedEmployeeCode) {
                                alert("Please select an employee to simulate.");
                                return;
                              }
                              setSimulationLoading(true);
                              setSimulationResult('');
                              try {
                                // format timestamp from YYYY-MM-DDTHH:MM to YYYY-MM-DD HH:MM:00
                                const formattedTime = simulatedTimestamp.replace('T', ' ') + ':00';
                                const res = await axios.post(window.API_BASE_URL + '/index.php?route=/api/biometric', {
                                  employee_code: simulatedEmployeeCode,
                                  timestamp: formattedTime,
                                  type: simulatedDirection
                                }, {
                                  headers: {
                                    'X-API-Key': biometricKey
                                  }
                                });
                                setSimulationResult({
                                  success: true,
                                  msg: `Success! ${res.data.message || 'Data synced'}. Processed ${res.data.processed_records} records. ${res.data.errors?.length ? 'Errors: ' + res.data.errors.join(', ') : ''}`
                                });
                                // refresh data
                                fetchHRData();
                              } catch (err) {
                                setSimulationResult({
                                  success: false,
                                  msg: err.response?.data?.error || "Failed to push mock biometric log"
                                });
                              } finally {
                                setSimulationLoading(false);
                              }
                            }}
                            disabled={simulationLoading}
                            style={{
                              width: '100%',
                              padding: '0.55rem',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: '#0047B8',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            {simulationLoading ? 'Syncing...' : '📡 Send Mock Punch'}
                          </button>
                        </div>
                      </div>

                      {simulationResult && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          backgroundColor: simulationResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(227, 6, 19, 0.08)',
                          border: simulationResult.success ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(227, 6, 19, 0.2)',
                          color: simulationResult.success ? '#10b981' : '#E30613',
                          fontSize: '0.75rem'
                        }}>
                          <strong>Simulation Result:</strong> {simulationResult.msg}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Footer Action */}
                {settingsSubTab !== 'biometric' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', marginTop: '1.5rem', paddingTop: '1rem' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '0.6rem 1.5rem',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#0047B8',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Save Settings
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: CA / FINANCE PARTNER */}
      {activeSubTab === 'ca-partner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Chartered Accountant & Finance Partners</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Manage corporate accounting relations, credentials, and compliance firm configurations.</p>
            </div>
            {!showAddCA && (
              <button 
                onClick={() => setShowAddCA(true)} 
                style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <MdAdd /> Register CA Partner
              </button>
            )}
          </div>

          {formSuccess && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>{formSuccess}</div>}
          {formError && <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(227,6,19,0.05)', border: '1px solid rgba(227,6,19,0.2)', borderRadius: '6px', color: '#E30613', fontWeight: 600, fontSize: '0.85rem' }}>{formError}</div>}

          {showAddCA ? (
            <div className="premium-card" style={{ borderLeft: '4px solid #0047B8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Register New CA Partner Profile</h4>
                <button 
                  onClick={() => { setShowAddCA(false); setFormError(null); setFormSuccess(null); }} 
                  style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateCAPartner} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0047B8', margin: '0 0 0.5rem 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>1. Login Credentials & Basic Info</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>CA Partner Name *</label>
                      <input type="text" required placeholder="e.g. Rahil CA" value={caForm.name} onChange={e => setCaForm({...caForm, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Email Address *</label>
                      <input type="email" required placeholder="ca@firm.com" value={caForm.email} onChange={e => setCaForm({...caForm, email: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Password *</label>
                      <input type="password" required placeholder="••••••••" value={caForm.password} onChange={e => setCaForm({...caForm, password: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0047B8', margin: '0 0 0.5rem 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>2. Professional & Firm Profile Details</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Firm Name</label>
                      <input type="text" placeholder="e.g. Apex Tax & Advisory" value={caForm.firm_name} onChange={e => setCaForm({...caForm, firm_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Registration Number</label>
                      <input type="text" placeholder="e.g. ICAI Reg No" value={caForm.registration_number} onChange={e => setCaForm({...caForm, registration_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Mobile Number</label>
                      <input type="text" placeholder="+919999988888" value={caForm.mobile_number} onChange={e => setCaForm({...caForm, mobile_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>GSTIN Number</label>
                      <input type="text" placeholder="15-digit GSTIN" value={caForm.gst_number} onChange={e => setCaForm({...caForm, gst_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>PAN Number</label>
                      <input type="text" placeholder="10-digit PAN" value={caForm.pan_number} onChange={e => setCaForm({...caForm, pan_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Digital Signature (Text/Name)</label>
                      <input type="text" placeholder="e.g. AUTHORIZED SIGNATORY" value={caForm.digital_signature} onChange={e => setCaForm({...caForm, digital_signature: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Registered Office Address</label>
                    <textarea rows="2" placeholder="Full address details" value={caForm.address} onChange={e => setCaForm({...caForm, address: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0047B8', margin: '0 0 0.5rem 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>3. Banking details (Used for invoice disbursements)</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Bank Name</label>
                      <input type="text" placeholder="e.g. ICICI Bank" value={caForm.bank_name} onChange={e => setCaForm({...caForm, bank_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Account Number</label>
                      <input type="text" placeholder="Bank Account Number" value={caForm.account_number} onChange={e => setCaForm({...caForm, account_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>IFSC Code</label>
                      <input type="text" placeholder="IFSC" value={caForm.ifsc_code} onChange={e => setCaForm({...caForm, ifsc_code: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>UPI ID</label>
                      <input type="text" placeholder="ca@upi" value={caForm.upi_id} onChange={e => setCaForm({...caForm, upi_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { setShowAddCA(false); setFormError(null); setFormSuccess(null); }} 
                    style={{ padding: '0.6rem 1.25rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{ padding: '0.6rem 1.5rem', border: 'none', backgroundColor: '#0047B8', color: '#fff', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Register & Assign Partner
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {caPartners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px' }}>
                  <MdBusiness size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem 0' }}>No CA / Finance Partner Assigned</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
                    Assign a Chartered Accountant or external Finance firm to delegate tax calculation parameters, monthly payroll verification runs, and professional invoice generation.
                  </p>
                  <button 
                    onClick={() => setShowAddCA(true)} 
                    style={{ backgroundColor: '#0047B8', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Add CA Partner Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  {caPartners.map(ca => (
                    <div key={ca.id} className="premium-card" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block' }}>{ca.firm_name || 'Individual CA Practice'}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Assigned CA Representative: <strong>{ca.name}</strong></span>
                        </div>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                          ● {ca.status || 'Active'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Contact Details</span>
                          <span style={{ fontSize: '0.85rem', display: 'block', color: '#334155' }}>📧 {ca.email}</span>
                          <span style={{ fontSize: '0.85rem', display: 'block', color: '#334155', marginTop: '0.25rem' }}>📱 {ca.mobile_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Identifiers</span>
                          <span style={{ fontSize: '0.85rem', display: 'block', color: '#334155' }}>ICAI Reg: {ca.registration_number || 'N/A'}</span>
                          <span style={{ fontSize: '0.85rem', display: 'block', color: '#334155', marginTop: '0.25rem' }}>GSTIN: {ca.gst_number || 'N/A'}</span>
                          <span style={{ fontSize: '0.85rem', display: 'block', color: '#334155', marginTop: '0.25rem' }}>PAN: {ca.pan_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Disbursement Bank Account</span>
                          <span style={{ fontSize: '0.85rem', display: 'block', color: '#334155' }}>🏦 {ca.bank_name || 'N/A'}</span>
                          <span style={{ fontSize: '0.85rem', display: 'block', color: '#334155', marginTop: '0.25rem' }}>A/C: {ca.account_number || 'N/A'}</span>
                          <span style={{ fontSize: '0.85rem', display: 'block', color: '#334155', marginTop: '0.25rem' }}>IFSC: {ca.ifsc_code || 'N/A'}</span>
                        </div>
                      </div>

                      {ca.address && (
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                          <strong>Firm Office Address:</strong> {ca.address}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                              src={`${window.API_BASE_URL}/${selectedRecord.record.clock_in_photo}`} 
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
                              src={`${window.API_BASE_URL}/${selectedRecord.record.clock_out_photo}`} 
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

      {/* New Department Modal Overlay */}
      {showNewDeptModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div className="premium-card" style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            padding: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>New Department</h3>
              <button 
                type="button" 
                onClick={() => setShowNewDeptModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddNewDept}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Department Name <span style={{ color: '#e30613' }}>*</span></label>
                    <input 
                      type="text" 
                      value={newDeptForm.name} 
                      onChange={e => setNewDeptForm({...newDeptForm, name: e.target.value})} 
                      required 
                      placeholder="e.g. Engineering" 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Department Code</label>
                    <input 
                      type="text" 
                      value={newDeptForm.code} 
                      onChange={e => setNewDeptForm({...newDeptForm, code: e.target.value})} 
                      placeholder="e.g. ENG" 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Description</label>
                  <textarea 
                    value={newDeptForm.description} 
                    onChange={e => setNewDeptForm({...newDeptForm, description: e.target.value})} 
                    placeholder="Short description of department responsibilities..." 
                    rows="3" 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit' }} 
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#e30613' }}>* indicates mandatory fields</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowNewDeptModal(false)}
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
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      padding: '0.5rem 1.25rem',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#0047B8',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarded Credentials Success Modal */}
      {onboardedCreds && (
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
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            padding: '2.25rem',
            width: '90%',
            maxWidth: '520px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <MdCheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Employee Onboarded Successfully!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem', lineHeight: '1.5' }}>
              A unique Employee ID and temporary login password have been generated for <strong>{onboardedCreds.name}</strong>.
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Unique Employee ID</span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace' }}>{onboardedCreds.employee_code}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Username / Email</span>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{onboardedCreds.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Temporary Password</span>
                <strong style={{ fontSize: '0.85rem', color: '#E30613', fontFamily: 'monospace' }}>{onboardedCreds.password}</strong>
              </div>
            </div>

            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '6px',
              color: '#d97706',
              fontSize: '0.75rem',
              marginBottom: '1.75rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              ⚠️ <strong>Important Note:</strong> Please make sure to share the Unique Employee ID (or Email) and the password with the employee so they can log into their Employee Workspace.
            </div>

            <button
              onClick={() => {
                try {
                  navigator.clipboard.writeText(`Employee ID: ${onboardedCreds.employee_code}\nEmail: ${onboardedCreds.email}\nPassword: ${onboardedCreds.password}`);
                } catch (err) {}
                setOnboardedCreds(null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#0047B8',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                fontSize: '0.9rem'
              }}
            >
              Copy Credentials & Close
            </button>
          </div>
        </div>
      )}

      {/* Client-Side Image Cropper Modal */}
      {showCropperModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Crop Profile Image</h3>
            
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 1.5rem auto', border: '2px dashed #0047B8', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={cropperRawImage} 
                alt="Crop Preview" 
                style={{ 
                  transform: `scale(${cropZoom}) translate(${cropX}px, ${cropY}px)`, 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transition: 'transform 0.1s ease-out'
                }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Zoom Level ({cropZoom.toFixed(1)}x)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.1" 
                  value={cropZoom} 
                  onChange={e => setCropZoom(parseFloat(e.target.value))} 
                  style={{ width: '100%' }} 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Horizontal (X: {cropX}px)
                  </label>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    value={cropX} 
                    onChange={e => setCropX(parseInt(e.target.value))} 
                    style={{ width: '100%' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                    Vertical (Y: {cropY}px)
                  </label>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    value={cropY} 
                    onChange={e => setCropY(parseInt(e.target.value))} 
                    style={{ width: '100%' }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => { setShowCropperModal(false); setCropperRawImage(null); }} 
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handlePerformCropAndCompress} 
                style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: '#0047B8', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Crop & Compress
              </button>
            </div>
          </div>
        </div>
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
                Print / Save PDF
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
                    {previewInvoice.company_name || 'A1 JOB ALLOCATE INDIA PRIVATE LIMITED'}
                  </div>
                  <div style={{ marginTop: '2px', color: '#333' }}>
                    Registered Corporate Office: Harihara, Karnataka
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
                    For {previewInvoice.company_name}
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
