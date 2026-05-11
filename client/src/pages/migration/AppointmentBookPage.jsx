import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { bookAppointment, getAppointmentFormData } from '../../services/appointmentApi';
import { getPatientDashboardOverview } from '../../services/patientApi';
import { getPatientFullName } from '../../utils/patientName';
import Toast from '../../components/migration/Toast';
import '../../styles/patient-dashboard-ejs.css';
import '../../styles/modern-form-migrate.css';

const navItems = [
  { name: 'Dashboard', to: '/patient/dashboard' },
  { name: 'Appointments', active: true },
  { name: 'Medications' },
  { name: 'Lab Results' },
  { name: 'Billing' },
  { name: 'Support' },
];

function AppointmentBookPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: '', text: '' });
  const [doctors, setDoctors] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const [form, setForm] = useState({
    appointee_name: '',
    appointee_email: '',
    doctor_name: '',
    appointee_contact: '',
    appointment_date: '',
    appointment_time: '',
    purpose: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Load patient data
        const patientResponse = await getPatientDashboardOverview();
        if (patientResponse.ok) {
          setPatientData(patientResponse.data?.patient || null);
        }

        // Load appointment form data
        const response = await getAppointmentFormData();
        if (!response.ok) {
          setError(response.data?.message || 'Failed to load doctors');
          setLoading(false);
          return;
        }

        const doctorList = response.data?.doctors || [];
        setDoctors(doctorList);
        if (doctorList.length) {
          setForm((prev) => ({ ...prev, doctor_name: doctorList[0].doctor_name }));
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load form data');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const patientName = useMemo(() => getPatientFullName(patientData), [patientData]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setToast({ type: '', text: '' });
    const response = await bookAppointment(form);
    if (!response.ok) {
      setToast({ type: 'error', text: response.data?.message || 'Failed to submit appointment' });
      return;
    }

    setToast({ type: 'success', text: response.data?.message || 'Appointment request submitted successfully' });
    setForm((prev) => ({
      ...prev,
      appointee_name: '',
      appointee_email: '',
      appointee_contact: '',
      appointment_date: '',
      appointment_time: '',
      purpose: '',
    }));
  };

  return (
    <div className="migrate-patient-dashboard modern-pd">
      {toast.text && (
        <Toast
          type={toast.type}
          message={toast.text}
          onClose={() => setToast({ type: '', text: '' })}
        />
      )}
      <aside className="pd-sidebar">
        <div className="pd-brand">Clinical Sanctuary</div>

        <div className="pd-user-card">
          <div className="avatar-circle">{patientName?.[0]?.toUpperCase() || 'A'}</div>
          <div>
            <h4>{patientName}</h4>
            <p>ID: PAT-8291</p>
          </div>
        </div>

        <nav className="pd-menu" aria-label="Patient menu">
          {navItems.map((item) => (
            item.to ? (
              <Link key={item.name} to={item.to} className={item.active ? 'active' : ''}>
                {item.name}
              </Link>
            ) : (
              <a href="#" key={item.name} className={item.active ? 'active' : ''}>{item.name}</a>
            )
          ))}
        </nav>

        <div className="pd-side-bottom">
          <a href="#">Settings</a>
          <Link to="/patient/ai" className="chat-btn">Chat with Agent</Link>
        </div>
      </aside>

      <div className="pd-main">
        <header className="pd-topbar">
          <input type="text" placeholder="Search records, doctors, or results..." aria-label="Search records" />
          <div className="topbar-actions">
            <button type="button" className="icon-btn" aria-label="Notifications">!</button>
            <button type="button" className="icon-btn" aria-label="Help">?</button>
            <Link to="/chat" className="ghost-btn">Contact Doctor</Link>
            <button type="button" className="solid-btn">Request Refill</button>
          </div>
        </header>

        {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading appointment form...</div>}

        {!loading && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 className="form-title">Book Appointment</h1>
                <p className="form-subtitle">Schedule your visit with our healthcare professionals</p>
              </div>
              <Link to="/patient/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8f9fb', textDecoration: 'none', color: '#0f172a', fontWeight: '600', fontSize: '14px' }}>
                <ArrowLeft size={18} />
                Back to Dashboard
              </Link>
            </div>

            {error && (
              <div className="form-alert error">
                <span className="form-alert-icon">✕</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-section">
              <div className="form-section-header">
                <h2 className="form-section-title">Appointment Details</h2>
              </div>

              <form onSubmit={onSubmit}>
                <div className="form-field-group">
                  <label className="form-label required" htmlFor="appointee_name">Patient Name</label>
                  <input className="form-input" id="appointee_name" name="appointee_name" value={form.appointee_name} onChange={onChange} placeholder="Enter your full name" required />
                </div>

                <div className="form-field-group">
                  <label className="form-label required" htmlFor="appointee_email">Patient Email Address</label>
                  <input className="form-input" id="appointee_email" name="appointee_email" type="email" value={form.appointee_email} onChange={onChange} placeholder="Enter your email address" required />
                </div>

                <div className="form-field-group">
                  <label className="form-label required" htmlFor="doctor_name">Doctor Assigned</label>
                  <select id="doctor_name" name="doctor_name" value={form.doctor_name} onChange={onChange} className="form-select" required>
                    <option value="">Select a doctor</option>
                    {doctors.length > 0 ? doctors.map((doctor) => (
                      <option key={doctor.doctor_id} value={doctor.doctor_name}>{doctor.doctor_name}</option>
                    )) : <option value="" disabled>No doctors available</option>}
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="form-label required" htmlFor="appointee_contact">Contact Number</label>
                  <input className="form-input" id="appointee_contact" name="appointee_contact" value={form.appointee_contact} onChange={onChange} placeholder="Enter your contact number" required />
                </div>

                <div className="form-field-row">
                  <div className="form-field-group">
                    <label className="form-label required" htmlFor="appointment_date">Appointment Date</label>
                    <input className="form-input" id="appointment_date" name="appointment_date" type="date" value={form.appointment_date} onChange={onChange} required />
                  </div>
                  <div className="form-field-group">
                    <label className="form-label required" htmlFor="appointment_time">Appointment Time</label>
                    <input className="form-input" id="appointment_time" name="appointment_time" type="time" value={form.appointment_time} onChange={onChange} required />
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="form-label required" htmlFor="purpose">Purpose of Visit</label>
                  <textarea className="form-textarea" id="purpose" name="purpose" value={form.purpose} onChange={onChange} placeholder="Please describe the reason for your appointment" required />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="form-button success">Schedule Appointment</button>
                  <Link to="/patient/dashboard" className="form-button secondary" style={{ textDecoration: 'none', color: 'inherit' }}>Cancel</Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppointmentBookPage;
