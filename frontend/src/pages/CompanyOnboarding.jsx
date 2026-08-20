import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Logo from '../components/Logo';
import { 
  MdBusiness, MdLocationOn, MdAssignment, MdAccessTime, 
  MdSecurity, MdPalette, MdAccountBalance, MdLayers, 
  MdPerson, MdRateReview, MdCheckCircle, MdChevronLeft, MdChevronRight,
  MdCloudUpload, MdDelete, MdAdd, MdRemoveCircleOutline
} from 'react-icons/md';

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
  { code: 'JIOP', name: 'JIO PAYMENTS BANK' },
  { code: 'PYTM', name: 'PAYTM PAYMENTS BANK' },
  { code: 'AIRP', name: 'AIRTEL PAYMENTS BANK' },
  { code: 'IPOS', name: 'INDIA POST PAYMENTS BANK' }
];

export default function CompanyOnboarding({ token, user, onOnboardingSuccess, onLogout }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState({});

  // Form states
  const [formData, setFormData] = useState({
    // Step 1: Company Profile
    company_logo: '',
    company_name: user?.company_name || '',
    legal_name: '',
    display_name: '',
    company_type: 'Private Limited',
    industry: '',
    company_size: '1-10 employees',
    year_established: new Date().getFullYear(),
    website: '',
    official_email: user?.email || '',
    phone_number: '',

    // Step 2: Registered Address
    registered_address: '',
    corporate_address: '',
    city: '',
    state: '',
    country: 'India',
    pin_code: '',

    // Step 3: Tax & Compliance
    gst_number: '',
    pan_number: '',
    tan_number: '',
    cin_number: '',
    msme_registration: '',
    professional_tax_reg: '',
    shop_establishment_reg: '',
    labour_license_number: '',

    // Step 4: Payroll Settings
    payroll_start_date: new Date().toISOString().substring(0, 10),
    salary_cycle: 'Monthly',
    salary_pay_date: '30',
    financial_year: '2026-27',
    currency: 'INR',
    time_zone: 'Asia/Kolkata',
    working_days: '5',
    weekly_off: 'Saturday, Sunday',
    standard_working_hours: '8',
    attendance_method: 'GPS',

    // Step 5: Statutory Settings
    pf_applicable: 'false',
    pf_number: '',
    esi_applicable: 'false',
    esi_number: '',
    professional_tax_applicable: 'true',
    lwf_applicable: 'false',
    gratuity_applicable: 'false',
    bonus_applicable: 'false',

    // Step 6: Company Branding
    signature_image: '',
    company_seal: '',
    authorized_signatory_name: user?.name || '',
    authorized_signatory_designation: 'HR Director',

    // Step 7: Company Bank Details
    bank_name: '',
    bank_account_holder: user?.name || '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_branch: '',

    // Step 8: Organization Setup
    departments: [
      { name: 'Engineering', code: 'ENG' },
      { name: 'Human Resources', code: 'HR' },
      { name: 'Finance', code: 'FIN' }
    ],
    designations: [
      { name: 'Software Engineer' },
      { name: 'HR Executive' },
      { name: 'Finance Manager' }
    ],
    locations: [
      { name: 'Main HQ', address: 'Corporate Towers, Tech Hub', latitude: 12.9716, longitude: 77.5946, radius_meters: 200 }
    ],

    // Step 9: First Admin Account
    admin_name: user?.name || '',
    admin_email: user?.email || '',
    admin_mobile: '',
    admin_password: '',
    admin_confirm_password: ''
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('company_onboarding_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Pre-populate fields but retain essential user settings if empty
        setFormData(prev => ({
          ...prev,
          ...parsed,
          company_name: parsed.company_name || prev.company_name,
          official_email: parsed.official_email || prev.official_email,
          admin_name: parsed.admin_name || prev.admin_name,
          admin_email: parsed.admin_email || prev.admin_email
        }));
        
        const savedStep = localStorage.getItem('company_onboarding_step');
        if (savedStep) {
          setCurrentStep(parseInt(savedStep) || 1);
        }
      } catch (e) {
        console.error("Failed to load onboarding draft", e);
      }
    }
  }, []);

  // Auto-save draft on data changes
  const saveDraft = (updatedData) => {
    const dataToSave = updatedData || formData;
    // Exclude large base64 image fields from localStorage to prevent payload bloat
    const { company_logo, signature_image, company_seal, ...draftWithoutImages } = dataToSave;
    localStorage.setItem('company_onboarding_draft', JSON.stringify(draftWithoutImages));
    localStorage.setItem('company_onboarding_step', currentStep.toString());
  };

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    saveDraft(updated);
  };

  const handleNestedChange = (category, index, key, value) => {
    const list = [...formData[category]];
    list[index] = { ...list[index], [key]: value };
    const updated = { ...formData, [category]: list };
    setFormData(updated);
    saveDraft(updated);
  };

  const addNestedRow = (category, emptyObj) => {
    const updated = { ...formData, [category]: [...formData[category], emptyObj] };
    setFormData(updated);
    saveDraft(updated);
  };

  const removeNestedRow = (category, index) => {
    const list = [...formData[category]];
    list.splice(index, 1);
    const updated = { ...formData, [category]: list };
    setFormData(updated);
    saveDraft(updated);
  };

  const handleDetectLocation = (idx) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        let updated = [...formData.locations];
        updated[idx] = {
          ...updated[idx],
          latitude: lat,
          longitude: lon,
          address: "Detecting address..."
        };
        setFormData({ ...formData, locations: updated });
        
        try {
          const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (response.data) {
            updated = [...formData.locations];
            updated[idx] = {
              ...updated[idx],
              latitude: lat,
              longitude: lon,
              address: response.data.display_name
            };
            const newFormData = { ...formData, locations: updated };
            setFormData(newFormData);
            saveDraft(newFormData);
          }
        } catch (err) {
          updated = [...formData.locations];
          updated[idx] = {
            ...updated[idx],
            latitude: lat,
            longitude: lon,
            address: `Detected Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`
          };
          const newFormData = { ...formData, locations: updated };
          setFormData(newFormData);
          saveDraft(newFormData);
        }
      },
      (error) => {
        alert("Unable to retrieve your location. Please check your browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Compress + Base64 file uploader — resizes to max 800px, 70% JPEG quality
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 800;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.70);
        handleInputChange(field, compressed);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // Validations
  const getValidationErrors = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.company_name.trim()) errors.company_name = "Company Name is required";
      if (!formData.legal_name.trim()) errors.legal_name = "Legal Business Name is required";
      if (!formData.official_email.trim()) errors.official_email = "Official Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.official_email)) errors.official_email = "Invalid email format";
    }
    if (step === 2) {
      if (!formData.registered_address.trim()) errors.registered_address = "Registered Address is required";
      if (!formData.city.trim()) errors.city = "City is required";
      if (!formData.state.trim()) errors.state = "State is required";
      if (!formData.pin_code.trim()) errors.pin_code = "PIN Code is required";
      else if (!/^\d{6}$/.test(formData.pin_code)) errors.pin_code = "PIN Code must be exactly 6 digits";
    }
    if (step === 3) {
      // Compliance inputs are fully optional and accept any format
    }
    if (step === 6) {
      if (!formData.authorized_signatory_name.trim()) errors.authorized_signatory_name = "Authorized Signatory Name is required";
    }
    if (step === 7) {
      if (formData.bank_ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bank_ifsc)) {
        errors.bank_ifsc = "Invalid IFSC Code format (e.g. SBIN0001234)";
      }
    }
    if (step === 9) {
      if (!formData.admin_name.trim()) errors.admin_name = "Admin Full Name is required";
      if (!formData.admin_email.trim()) errors.admin_email = "Admin Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) errors.admin_email = "Invalid email format";
      
      // Password validation only if they want to change/provide it
      if (formData.admin_password) {
        if (formData.admin_password.length < 6) {
          errors.admin_password = "Password must be at least 6 characters long";
        }
        if (formData.admin_password !== formData.admin_confirm_password) {
          errors.admin_confirm_password = "Passwords do not match";
        }
      }
    }
    return errors;
  };

  const handleNext = () => {
    const errors = getValidationErrors(currentStep);
    if (Object.keys(errors).length > 0) {
      alert("Please fix the validation errors in this section before continuing:\n" + Object.values(errors).join("\n"));
      return;
    }
    setApiError(null);
    const next = currentStep + 1;
    setCurrentStep(next);
    localStorage.setItem('company_onboarding_step', next.toString());
  };

  const handlePrev = () => {
    setApiError(null);
    const prev = currentStep - 1;
    setCurrentStep(prev);
    localStorage.setItem('company_onboarding_step', prev.toString());
  };

  const handleSubmit = async () => {
    // Validate Step 9 errors
    const errors = getValidationErrors(9);
    if (Object.keys(errors).length > 0) {
      alert("Please fix validation errors in Step 9: First Admin Account before submitting.");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const response = await axios.post(window.API_BASE_URL + '/index.php?route=/api/hr/onboarding/submit', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.token) {
        setSuccess(true);
        // Clean up localStorage drafts
        localStorage.removeItem('company_onboarding_draft');
        localStorage.removeItem('company_onboarding_step');

        // Short timeout for gorgeous success animation
        setTimeout(() => {
          onOnboardingSuccess(response.data.token, response.data.user);
        }, 2500);
      }
    } catch (err) {
      setApiError(err.response?.data?.error || err.response?.data?.details || 'Failed to complete company onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeErrors = getValidationErrors(currentStep);

  // Steps declaration list
  const stepsList = [
    { num: 1, label: 'Company Profile', icon: MdBusiness },
    { num: 2, label: 'Registered Address', icon: MdLocationOn },
    { num: 3, label: 'Tax & Compliance', icon: MdAssignment },
    { num: 4, label: 'Payroll Settings', icon: MdAccessTime },
    { num: 5, label: 'Statutory Settings', icon: MdSecurity },
    { num: 6, label: 'Company Branding', icon: MdPalette },
    { num: 7, label: 'Bank Details', icon: MdAccountBalance },
    { num: 8, label: 'Org Setup', icon: MdLayers },
    { num: 9, label: 'First Admin', icon: MdPerson },
    { num: 10, label: 'Review & Complete', icon: MdRateReview }
  ];

  if (success) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '500px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          borderTop: '5px solid #0047B8'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16,185,129,0.1)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MdCheckCircle size={44} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>Onboarding Complete!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Your company profile, compliance regulations, branding, and payroll structure have been successfully provisioned. Redirecting to your HRMS Dashboard...
          </p>
          <div className="spinner" style={{ borderTopColor: '#0047B8' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      
      {/* SIDEBAR WIZARD PROGRESS BLOCK */}
      <aside style={{
        width: '300px',
        backgroundColor: '#0f172a',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.5rem',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10
      }}>
        {/* Header Branding */}
        <div style={{ backgroundColor: '#fff', padding: '0.4rem 0.75rem', borderRadius: '8px', marginBottom: '2.5rem', alignSelf: 'flex-start' }}>
          <Logo width={135} height={34} />
        </div>

        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          Company Setup Wizard
        </h4>

        {/* Progress List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto' }}>
          {stepsList.map(step => {
            const Icon = step.icon;
            const isCompleted = step.num < currentStep;
            const isActive = step.num === currentStep;

            return (
              <button
                key={step.num}
                onClick={() => {
                  if (step.num <= currentStep || isCompleted) {
                    setCurrentStep(step.num);
                  }
                }}
                disabled={step.num > currentStep && !isCompleted}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(0, 71, 184, 0.15)' : 'transparent',
                  color: isActive ? '#fff' : (isCompleted ? '#10b981' : '#64748b'),
                  cursor: (step.num <= currentStep || isCompleted) ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  width: '100%'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#0047B8' : (isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {isCompleted ? '✓' : step.num}
                </div>
                <span style={{ flex: 1 }}>{step.label}</span>
                <Icon size={16} />
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Logged in as <strong>{user?.name}</strong></span>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.55rem',
              backgroundColor: 'rgba(227, 6, 19, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: '#E30613',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              width: '100%',
              transition: 'background-color 0.2s'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT BLOCK */}
      <main style={{ flex: 1, marginLeft: '300px', padding: '2.5rem 3.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Header Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Company Setup & Configuration</h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
              Configure your enterprise statutory registry, payroll accounts, and compliance guidelines.
            </p>
          </div>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '0.35rem 0.75rem',
            backgroundColor: '#fff',
            borderRadius: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            color: '#0047B8'
          }}>
            Step {currentStep} of 10
          </div>
        </div>

        {apiError && (
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(227,6,19,0.05)',
            border: '1px solid rgba(227,6,19,0.2)',
            borderRadius: '8px',
            color: '#E30613',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            ⚠️ {apiError}
          </div>
        )}

        {/* STEP CONTENT SWITCHBOARD */}
        <div className="premium-card" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* STEP 1: COMPANY PROFILE */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdBusiness /> Company Profile
              </h3>
              
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '12px',
                  border: '2px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#f8fafc'
                }}>
                  {formData.company_logo ? (
                    <img src={formData.company_logo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <MdCloudUpload size={28} style={{ color: '#94a3b8' }} />
                  )}
                </div>
                <div>
                  <label style={{
                    display: 'inline-block',
                    padding: '0.55rem 1rem',
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#475569',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    Upload Company Logo
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'company_logo')} style={{ display: 'none' }} />
                  </label>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem' }}>Recommended size: square image, PNG/JPG max 2MB</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company Name <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.company_name} onChange={e => handleInputChange('company_name', e.target.value)} required placeholder="Acme Corp" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.company_name ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.company_name && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.company_name}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Legal Business Name <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.legal_name} onChange={e => handleInputChange('legal_name', e.target.value)} required placeholder="Acme Solutions Private Limited" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.legal_name ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.legal_name && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.legal_name}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Display Name (Optional)</label>
                  <input type="text" value={formData.display_name} onChange={e => handleInputChange('display_name', e.target.value)} placeholder="Acme" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company Type</label>
                  <select value={formData.company_type} onChange={e => handleInputChange('company_type', e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Co-operative Housing Society">Co-operative Housing Society</option>
                    <option value="LLP">LLP</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="NGO">NGO</option>
                    <option value="Startup">Startup</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Industry</label>
                  <input type="text" value={formData.industry} onChange={e => handleInputChange('industry', e.target.value)} placeholder="e.g. Information Technology" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Company Size</label>
                  <select value={formData.company_size} onChange={e => handleInputChange('company_size', e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-500 employees">201-500 employees</option>
                    <option value="500+ employees">500+ employees</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Year Established</label>
                  <input type="number" value={formData.year_established} onChange={e => handleInputChange('year_established', parseInt(e.target.value) || new Date().getFullYear())} placeholder="e.g. 2020" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Website</label>
                  <input type="url" value={formData.website} onChange={e => handleInputChange('website', e.target.value)} placeholder="https://example.com" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Official Email <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="email" value={formData.official_email} onChange={e => handleInputChange('official_email', e.target.value)} required placeholder="info@company.com" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.official_email ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.official_email && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.official_email}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Phone Number</label>
                  <input type="tel" value={formData.phone_number} onChange={e => handleInputChange('phone_number', e.target.value)} placeholder="e.g. +91 9999999999" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REGISTERED ADDRESS */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdLocationOn /> Registered Office Address
              </h3>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Registered Office Address <span style={{ color: '#E30613' }}>*</span></label>
                <textarea rows="3" value={formData.registered_address} onChange={e => handleInputChange('registered_address', e.target.value)} required placeholder="Suite 404, Tech Park, Residency Road" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.registered_address ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }} />
                {activeErrors.registered_address && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.registered_address}</span>}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Corporate Office Address (Optional)</label>
                <textarea rows="3" value={formData.corporate_address} onChange={e => handleInputChange('corporate_address', e.target.value)} placeholder="Leave blank if same as registered office address" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>City <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.city} onChange={e => handleInputChange('city', e.target.value)} required placeholder="Bengaluru" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.city ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.city && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.city}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>State <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.state} onChange={e => handleInputChange('state', e.target.value)} required placeholder="Karnataka" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.state ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.state && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.state}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Country</label>
                  <input type="text" value={formData.country} onChange={e => handleInputChange('country', e.target.value)} placeholder="India" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>PIN Code <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.pin_code} onChange={e => handleInputChange('pin_code', e.target.value)} required placeholder="560001" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.pin_code ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.pin_code && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.pin_code}</span>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TAX & COMPLIANCE */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdAssignment /> Tax & Statutory Compliance Registers
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-0.75rem' }}>
                Configure primary legal accounts. Optional fields can be completed from **Settings** later.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>GSTIN Number</label>
                  <input type="text" value={formData.gst_number} onChange={e => handleInputChange('gst_number', e.target.value.toUpperCase())} placeholder="e.g. 29AAAAA0000A1Z5" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.gst_number ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.gst_number && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.gst_number}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>PAN Number</label>
                  <input type="text" value={formData.pan_number} onChange={e => handleInputChange('pan_number', e.target.value.toUpperCase())} placeholder="e.g. AAAA0000A" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.pan_number ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.pan_number && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.pan_number}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>TAN Number</label>
                  <input type="text" value={formData.tan_number} onChange={e => handleInputChange('tan_number', e.target.value.toUpperCase())} placeholder="e.g. ABCD12345E" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.tan_number ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.tan_number && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.tan_number}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>CIN (Corporate Identification Number)</label>
                  <input type="text" value={formData.cin_number} onChange={e => handleInputChange('cin_number', e.target.value.toUpperCase())} placeholder="e.g. U72200KA2020PTC000000" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.cin_number ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.cin_number && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.cin_number}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>MSME Registration Number</label>
                  <input type="text" value={formData.msme_registration} onChange={e => handleInputChange('msme_registration', e.target.value)} placeholder="UDYAM-XX-00-0000000" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Professional Tax Reg (PTEC/PTRC)</label>
                  <input type="text" value={formData.professional_tax_reg} onChange={e => handleInputChange('professional_tax_reg', e.target.value)} placeholder="PT Registration Code" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Shop & Establishment License Number</label>
                  <input type="text" value={formData.shop_establishment_reg} onChange={e => handleInputChange('shop_establishment_reg', e.target.value)} placeholder="S&E License ID" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Labour License Number</label>
                  <input type="text" value={formData.labour_license_number} onChange={e => handleInputChange('labour_license_number', e.target.value)} placeholder="Labour Registry ID" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PAYROLL SETTINGS */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdAccessTime /> Payroll & Calendar Settings
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Payroll Start Date</label>
                  <input type="date" value={formData.payroll_start_date} onChange={e => handleInputChange('payroll_start_date', e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Salary Cycle</label>
                  <select value={formData.salary_cycle} onChange={e => handleInputChange('salary_cycle', e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                    <option value="Monthly">Monthly Cycle</option>
                    <option value="Weekly">Weekly Cycle</option>
                    <option value="Bi-weekly">Bi-weekly Cycle</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Monthly Salary Pay Date</label>
                  <select value={formData.salary_pay_date} onChange={e => handleInputChange('salary_pay_date', e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : (day === 2 || day === 22 ? 'nd' : (day === 3 || day === 23 ? 'rd' : 'th'));
                      return <option key={day} value={day}>{day}{suffix} of the month</option>;
                    })}
                    <option value="Last day of the month">Last day of the month</option>
                    <option value="5th of the next month">5th of the next month</option>
                    <option value="10th of the next month">10th of the next month</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Financial Year</label>
                  <select value={formData.financial_year} onChange={e => handleInputChange('financial_year', e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                    <option value="2026-27">FY 2026-2027 (Apr-Mar)</option>
                    <option value="2025-26">FY 2025-2026 (Apr-Mar)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Currency</label>
                  <input type="text" value={formData.currency} onChange={e => handleInputChange('currency', e.target.value)} placeholder="INR (₹)" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Time Zone</label>
                  <input type="text" value={formData.time_zone} onChange={e => handleInputChange('time_zone', e.target.value)} placeholder="Asia/Kolkata (IST)" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Working Days per Week</label>
                  <select value={formData.working_days} onChange={e => handleInputChange('working_days', e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                    <option value="5">5 Days</option>
                    <option value="6">6 Days</option>
                    <option value="5.5">5.5 Days (Alternate Saturdays)</option>
                  </select>
                </div>
                 <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Weekly Off Days</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const selectedDays = formData.weekly_off ? formData.weekly_off.split(',').map(d => d.trim()) : [];
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
                            handleInputChange('weekly_off', orderedUpdated.join(', '));
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '20px',
                            border: isSelected ? '1.5px solid #0047B8' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? 'rgba(0, 71, 184, 0.08)' : '#fff',
                            color: isSelected ? '#0047B8' : '#475569',
                            fontWeight: isSelected ? '600' : '400',
                            fontSize: '0.8rem',
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
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Standard Working Hours / Day</label>
                  <input type="number" value={formData.standard_working_hours} onChange={e => handleInputChange('standard_working_hours', e.target.value)} placeholder="8" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Primary Attendance Check-In Method</label>
                  <select value={formData.attendance_method} onChange={e => handleInputChange('attendance_method', e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                    <option value="GPS">GPS Location (Geofencing)</option>
                    <option value="Face Recognition">Face Recognition Portal</option>
                    <option value="Biometric">Biometric Sync</option>
                    <option value="Manual">Manual Approvals</option>
                    <option value="QR">QR Code Scan</option>
                  </select>
                  {formData.attendance_method === 'Biometric' && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(0, 71, 184, 0.05)', border: '1px solid rgba(0, 71, 184, 0.1)', borderRadius: '6px', fontSize: '0.8rem', color: '#0047B8', lineHeight: '1.4' }}>
                      <strong>🔌 Biometric Machine Connected:</strong> Once onboarding is complete, you can generate API Keys, connect ZKTeco, eSSL, Matrix, or Mantra machines, and configure sync settings in your HR Dashboard Settings.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: STATUTORY SETTINGS */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdSecurity /> Indian Statutory Deductions Configuration
              </h3>

              {/* PF applicable toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Employees' Provident Fund (EPF) Deductions</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>Enable statutory employee & employer PF contributions (12% of basic)</span>
                </div>
                <select value={formData.pf_applicable} onChange={e => handleInputChange('pf_applicable', e.target.value)} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, backgroundColor: '#fff' }}>
                  <option value="true">APPLICABLE</option>
                  <option value="false">NOT APPLICABLE</option>
                </select>
              </div>

              {formData.pf_applicable === 'true' && (
                <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #0047B8' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>EPF Registration Number (EPFO Code)</label>
                  <input type="text" value={formData.pf_number} onChange={e => handleInputChange('pf_number', e.target.value.toUpperCase())} placeholder="e.g. KKBAN0000000000" style={{ width: '100%', maxWidth: '400px', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              )}

              {/* ESI applicable toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Employees' State Insurance (ESI)</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>Statutory health insurance coverage for employees with gross salary &le; ₹21,000/month</span>
                </div>
                <select value={formData.esi_applicable} onChange={e => handleInputChange('esi_applicable', e.target.value)} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, backgroundColor: '#fff' }}>
                  <option value="true">APPLICABLE</option>
                  <option value="false">NOT APPLICABLE</option>
                </select>
              </div>

              {formData.esi_applicable === 'true' && (
                <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #0047B8' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>ESIC Code Number</label>
                  <input type="text" value={formData.esi_number} onChange={e => handleInputChange('esi_number', e.target.value)} placeholder="e.g. 31000000000000000" style={{ width: '100%', maxWidth: '400px', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              )}

              {/* Other statutory switches */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                    <input type="checkbox" checked={formData.professional_tax_applicable === 'true'} onChange={e => handleInputChange('professional_tax_applicable', e.target.checked ? 'true' : 'false')} />
                    Professional Tax (PT)
                  </label>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Deduct state Professional Tax based on salary slabs.</span>
                </div>

                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                    <input type="checkbox" checked={formData.lwf_applicable === 'true'} onChange={e => handleInputChange('lwf_applicable', e.target.checked ? 'true' : 'false')} />
                    Labour Welfare Fund (LWF)
                  </label>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Employer & Employee state LWF contributions.</span>
                </div>

                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                    <input type="checkbox" checked={formData.gratuity_applicable === 'true'} onChange={e => handleInputChange('gratuity_applicable', e.target.checked ? 'true' : 'false')} />
                    Gratuity Provisioning
                  </label>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Accrue Gratuity (4.81% of basic salary) in monthly CTC.</span>
                </div>

                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                    <input type="checkbox" checked={formData.bonus_applicable === 'true'} onChange={e => handleInputChange('bonus_applicable', e.target.checked ? 'true' : 'false')} />
                    Statutory Bonus (8.33%)
                  </label>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Calculate and include minimum statutory bonus in CTC.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: COMPANY BRANDING */}
          {currentStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdPalette /> Brand Assets & Signature Templates
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-0.75rem' }}>
                These brand assets will automatically render on **Payslips, Offer Letters, Appointment Letters, Experience Letters, and Salary Certificates**.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Authorized Signatory Name <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.authorized_signatory_name} onChange={e => handleInputChange('authorized_signatory_name', e.target.value)} required placeholder="e.g. John Doe" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.authorized_signatory_name ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.authorized_signatory_name && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.authorized_signatory_name}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Designation</label>
                  <input type="text" value={formData.authorized_signatory_designation} onChange={e => handleInputChange('authorized_signatory_designation', e.target.value)} placeholder="e.g. Managing Director" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
                {/* Signature upload */}
                <div style={{ padding: '1.25rem', border: '1px solid #cbd5e1', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Authorized Signature Image</strong>
                  <div style={{ width: '200px', height: '80px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                    {formData.signature_image ? (
                      <img src={formData.signature_image} alt="Signature Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>No signature uploaded</div>
                    )}
                  </div>
                  <label style={{ padding: '0.45rem 1rem', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                    Upload Signature Image
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature_image')} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Company Seal Upload */}
                <div style={{ padding: '1.25rem', border: '1px solid #cbd5e1', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Official Company Seal / Stamp</strong>
                  <div style={{ width: '120px', height: '120px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                    {formData.company_seal ? (
                      <img src={formData.company_seal} alt="Seal Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>No seal uploaded</div>
                    )}
                  </div>
                  <label style={{ padding: '0.45rem 1rem', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                    Upload Company Seal
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'company_seal')} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: COMPANY BANK DETAILS */}
          {currentStep === 7 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdAccountBalance /> Corporate Bank Account (Salary Disbursement)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Bank Name <span style={{ color: '#E30613' }}>*</span></label>
                  <input 
                    type="text" 
                    list="company-bank-list" 
                    value={formData.bank_name} 
                    onChange={e => handleInputChange('bank_name', e.target.value)} 
                    required 
                    placeholder="Search or type Bank Name" 
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                  />
                  <datalist id="company-bank-list">
                    {INDIAN_BANKS.map(bank => (
                      <option key={bank.code} value={bank.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Account Holder Name <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.bank_account_holder} onChange={e => handleInputChange('bank_account_holder', e.target.value)} required placeholder="Company Account Name" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Account Number <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.bank_account_number} onChange={e => handleInputChange('bank_account_number', e.target.value)} required placeholder="Corporate Savings/Current Account ID" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>IFSC Code <span style={{ color: '#E30613' }}>*</span></label>
                  <input 
                    type="text" 
                    value={formData.bank_ifsc} 
                    onChange={e => {
                      const ifsc = e.target.value.toUpperCase();
                      let matchedName = formData.bank_name;
                      if (ifsc.length >= 4) {
                        const matched = INDIAN_BANKS.find(b => b.code === ifsc.substring(0, 4));
                        if (matched) matchedName = matched.name;
                      }
                      setFormData(prev => ({ ...prev, bank_ifsc: ifsc, bank_name: matchedName }));
                    }} 
                    required 
                    placeholder="e.g. HDFC0001234" 
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.bank_ifsc ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                  />
                  {activeErrors.bank_ifsc && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.bank_ifsc}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Branch Name</label>
                  <input type="text" value={formData.bank_branch} onChange={e => handleInputChange('bank_branch', e.target.value)} placeholder="e.g. M.G. Road Branch" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: ORGANIZATION SETUP */}
          {currentStep === 8 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <MdLayers /> Organizational Structures
              </h3>

              {/* Departments grid setup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Departments Setup</strong>
                  <button type="button" onClick={() => addNestedRow('departments', { name: '', code: '' })} style={{ border: 'none', backgroundColor: 'transparent', color: '#0047B8', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MdAdd /> Add Department
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formData.departments.map((dept, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input type="text" required value={dept.name} onChange={e => handleNestedChange('departments', idx, 'name', e.target.value)} placeholder="Department Name (e.g. Operations)" style={{ flex: 2, padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                      <input type="text" value={dept.code} onChange={e => handleNestedChange('departments', idx, 'code', e.target.value)} placeholder="Code (e.g. OPS)" style={{ flex: 1, padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                      {formData.departments.length > 1 && (
                        <button type="button" onClick={() => removeNestedRow('departments', idx)} style={{ backgroundColor: 'transparent', border: 'none', color: '#E30613', cursor: 'pointer' }}><MdDelete size={18} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Designations grid setup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Designations Setup</strong>
                  <button type="button" onClick={() => addNestedRow('designations', { name: '' })} style={{ border: 'none', backgroundColor: 'transparent', color: '#0047B8', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MdAdd /> Add Designation
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formData.designations.map((des, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input type="text" required value={des.name} onChange={e => handleNestedChange('designations', idx, 'name', e.target.value)} placeholder="Designation Title (e.g. Executive Assistant)" style={{ flex: 1, padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                      {formData.designations.length > 1 && (
                        <button type="button" onClick={() => removeNestedRow('designations', idx)} style={{ backgroundColor: 'transparent', border: 'none', color: '#E30613', cursor: 'pointer' }}><MdDelete size={18} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations grid setup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Office Locations Setup</strong>
                  <button type="button" onClick={() => addNestedRow('locations', { name: '', address: '', latitude: 12.9716, longitude: 77.5946, radius_meters: 200 })} style={{ border: 'none', backgroundColor: 'transparent', color: '#0047B8', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MdAdd /> Add Location
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.locations.map((loc, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative' }}>
                      {formData.locations.length > 1 && (
                        <button type="button" onClick={() => removeNestedRow('locations', idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#E30613', cursor: 'pointer' }}><MdDelete size={18} /></button>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Location Name</label>
                          <input type="text" required value={loc.name} onChange={e => handleNestedChange('locations', idx, 'name', e.target.value)} placeholder="e.g. Mumbai HQ" style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Office Address Location</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              readOnly
                              value={loc.address || 'Click "Detect Live Location" to set...'} 
                              style={{ flex: 1, padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box', backgroundColor: '#f1f5f9', color: '#475569' }} 
                            />
                            <button
                              type="button"
                              onClick={() => handleDetectLocation(idx)}
                              style={{
                                padding: '0.45rem 1rem',
                                border: 'none',
                                borderRadius: '4px',
                                backgroundColor: '#0047B8',
                                color: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              📍 Detect Live Location
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Latitude</label>
                          <input type="number" step="any" value={loc.latitude ?? 12.9716} onChange={e => handleNestedChange('locations', idx, 'latitude', parseFloat(e.target.value) || 0)} placeholder="12.9716" style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Longitude</label>
                          <input type="number" step="any" value={loc.longitude ?? 77.5946} onChange={e => handleNestedChange('locations', idx, 'longitude', parseFloat(e.target.value) || 0)} placeholder="77.5946" style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Radius (Meters)</label>
                          <input type="number" value={loc.radius_meters ?? 200} onChange={e => handleNestedChange('locations', idx, 'radius_meters', parseInt(e.target.value) || 200)} placeholder="200" style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: FIRST ADMIN ACCOUNT */}
          {currentStep === 9 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdPerson /> Primary HR Administrator Account Setup
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-0.75rem' }}>
                Verify or update your login credentials. You are assigned as **Super Admin** of this company.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Admin Full Name <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="text" value={formData.admin_name} onChange={e => handleInputChange('admin_name', e.target.value)} required placeholder="HR Administrator Name" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.admin_name ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.admin_name && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.admin_name}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Official Admin Email <span style={{ color: '#E30613' }}>*</span></label>
                  <input type="email" value={formData.admin_email} onChange={e => handleInputChange('admin_email', e.target.value)} required placeholder="admin@company.com" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.admin_email ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.admin_email && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.admin_email}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Mobile Number</label>
                  <input type="tel" value={formData.admin_mobile} onChange={e => handleInputChange('admin_mobile', e.target.value)} placeholder="e.g. +91 9999999999" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Update Login Password (Optional)</label>
                  <input type="password" value={formData.admin_password} onChange={e => handleInputChange('admin_password', e.target.value)} placeholder="Leave blank to keep existing password" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.admin_password ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.admin_password && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.admin_password}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#475569' }}>Confirm Password</label>
                  <input type="password" value={formData.admin_confirm_password} onChange={e => handleInputChange('admin_confirm_password', e.target.value)} placeholder="Confirm new login password" style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: activeErrors.admin_confirm_password ? '1px solid #E30613' : '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  {activeErrors.admin_confirm_password && <span style={{ fontSize: '0.7rem', color: '#E30613' }}>{activeErrors.admin_confirm_password}</span>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: REVIEW & COMPLETE */}
          {currentStep === 10 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdRateReview /> Setup Review & Complete
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '-0.75rem' }}>
                Review all the entered company profile statutory configurations. You can click on any step to edit fields.
              </p>

              {/* Review summary cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {/* Block 1 */}
                <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '0.8rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>1. Company Profile</strong>
                  <span style={{ display: 'block' }}>Name: <strong>{formData.company_name}</strong></span>
                  <span style={{ display: 'block' }}>Legal Name: {formData.legal_name}</span>
                  <span style={{ display: 'block' }}>Type: {formData.company_type} | Year: {formData.year_established}</span>
                  <span style={{ display: 'block' }}>Email: {formData.official_email}</span>
                </div>

                {/* Block 2 */}
                <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '0.8rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>2. Address</strong>
                  <span style={{ display: 'block' }}>{formData.registered_address}</span>
                  <span style={{ display: 'block' }}>{formData.city}, {formData.state} - {formData.pin_code}</span>
                </div>

                {/* Block 3 */}
                <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '0.8rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>3. Compliance Registry</strong>
                  <span style={{ display: 'block' }}>GST: {formData.gst_number || '--'}</span>
                  <span style={{ display: 'block' }}>PAN: {formData.pan_number || '--'}</span>
                  <span style={{ display: 'block' }}>TAN: {formData.tan_number || '--'}</span>
                </div>

                {/* Block 4 */}
                <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '0.8rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>4. Payroll Rules</strong>
                  <span style={{ display: 'block' }}>Cycle: <strong>{formData.salary_cycle}</strong> (Pay Date: {formData.salary_pay_date}th)</span>
                  <span style={{ display: 'block' }}>Working days: {formData.working_days} off: {formData.weekly_off}</span>
                  <span style={{ display: 'block' }}>Check-in method: {formData.attendance_method}</span>
                </div>

                {/* Block 5 */}
                <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '0.8rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>5. Statutory Accruals</strong>
                  <span style={{ display: 'block' }}>EPF applicable: <strong>{formData.pf_applicable === 'true' ? 'YES' : 'NO'}</strong> {formData.pf_number && `(${formData.pf_number})`}</span>
                  <span style={{ display: 'block' }}>ESI applicable: <strong>{formData.esi_applicable === 'true' ? 'YES' : 'NO'}</strong> {formData.esi_number && `(${formData.esi_number})`}</span>
                </div>

                {/* Block 6 */}
                <div style={{ padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '0.8rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a' }}>6. Company Bank Details</strong>
                  <span style={{ display: 'block' }}>Bank: {formData.bank_name}</span>
                  <span style={{ display: 'block' }}>A/C Holder: {formData.bank_account_holder}</span>
                  <span style={{ display: 'block' }}>A/C No: {formData.bank_account_number}</span>
                  <span style={{ display: 'block' }}>IFSC: {formData.bank_ifsc}</span>
                </div>
              </div>
            </div>
          )}

          {/* Setup Footer Navigator Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.5rem',
            marginTop: 'auto'
          }}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  padding: '0.6rem 1.25rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <MdChevronLeft size={18} /> Previous Step
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  saveDraft();
                  alert("Progress saved as draft!");
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                Save as Draft
              </button>

              {currentStep < 10 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    padding: '0.6rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#0047B8',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 71, 184, 0.15)'
                  }}
                >
                  Next Step <MdChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: '0.6rem 1.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#0047B8',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 71, 184, 0.15)'
                  }}
                >
                  {loading ? 'Submitting Details...' : 'Complete & Launch'}
                </button>
              )}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
