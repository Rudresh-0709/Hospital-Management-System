import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllAppointments, approveAppointment, rejectAppointment, getAppointmentDetails } from '../../services/doctorApi';
import Toast from '../../components/migration/Toast';
import '../../styles/doctor-dashboard.css';

function DoctorSchedulePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [flashMsg, setFlashMsg] = useState({ type: '', text: '' });
  
  // To handle expanded details
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState({ diagnosis: null, prescriptions: [], loading: false });

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const response = await getAllAppointments();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load schedule');
      } else {
        setAppointments(response.data.appointments || []);
      }
    } catch (err) {
      setError('Error fetching schedule data');
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      let res;
      if (newStatus === 'Scheduled') {
        res = await approveAppointment(id);
      } else if (newStatus === 'Cancelled') {
        res = await rejectAppointment(id);
      }
      
      if (res && res.ok) {
        setFlashMsg({ type: 'success', text: `Appointment ${newStatus === 'Scheduled' ? 'Approved' : 'Rejected'} successfully!` });
        // Update local state
        setAppointments(prev => prev.map(app => app.appointment_id === id ? { ...app, status: newStatus } : app));
      } else {
        setFlashMsg({ type: 'error', text: res?.data?.message || `Failed to ${newStatus} appointment.` });
      }
    } catch (err) {
      setFlashMsg({ type: 'error', text: 'Network error occurred.' });
    }
  };

  const toggleDetails = async (appId) => {
    if (selectedAppointmentId === appId) {
      setSelectedAppointmentId(null);
      return;
    }
    
    setSelectedAppointmentId(appId);
    setAppointmentDetails({ diagnosis: null, prescriptions: [], loading: true });
    
    try {
      const res = await getAppointmentDetails(appId);
      if (res.ok) {
        setAppointmentDetails({
          diagnosis: res.data.diagnosis,
          prescriptions: res.data.prescriptions || [],
          loading: false
        });
      } else {
        setAppointmentDetails({ diagnosis: null, prescriptions: [], loading: false, error: 'Failed to load details' });
      }
    } catch (err) {
      setAppointmentDetails({ diagnosis: null, prescriptions: [], loading: false, error: 'Network error' });
    }
  };

  if (loading && appointments.length === 0) return <div style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>Loading schedule...</div>;
  if (error) return <div style={{ padding: 40, color: '#ba1a1a', fontFamily: 'Inter, sans-serif' }}>{error}</div>;

  const upcomingAppointments = appointments.filter(a => ['Pending', 'Scheduled'].includes(a.status));
  const pastAppointments = appointments.filter(a => ['Completed', 'Cancelled'].includes(a.status));
  
  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className="dd-root">
      {flashMsg.text && (
        <Toast
          type={flashMsg.type}
          message={flashMsg.text}
          onClose={() => setFlashMsg({ type: '', text: '' })}
        />
      )}
      <div className="dd-layout">

        {/* ===== SIDEBAR ===== */}
        <aside className="dd-sidebar">
          <div className="dd-sidebar-brand">
            <span className="material-symbols-outlined">medical_services</span>
            <div>
              <div className="dd-sidebar-brand-name">MedPulse</div>
              <div className="dd-sidebar-brand-sub">Medical Center</div>
            </div>
          </div>

          <nav className="dd-nav">
            <Link className="dd-nav-link" to="/doctor/dashboard">
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link className="dd-nav-link" to="/doctor/patients">
              <span className="material-symbols-outlined">group</span>
              <span>Patients</span>
            </Link>
            <Link className="dd-nav-link active" to="/doctor/schedule">
              <span className="material-symbols-outlined">calendar_today</span>
              <span>Schedule</span>
            </Link>
            <Link className="dd-nav-link" to="/doctor/chat">
              <span className="material-symbols-outlined">chat</span>
              <span>Chat</span>
            </Link>
          </nav>

          <div className="dd-sidebar-bottom">
            <button className="dd-btn-primary">New Appointment</button>
            <a className="dd-nav-link" href="#">
              <span className="material-symbols-outlined">help</span>
              <span>Help Center</span>
            </a>
            <button className="dd-nav-link" onClick={handleLogout} style={{ color: 'var(--error)' }}>
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <main className="dd-main">
          {/* Header */}
          <header className="dd-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Schedule & Appointments</h2>
              <nav className="dd-header-nav">
                <a className={activeTab === 'upcoming' ? 'active' : ''} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('upcoming'); }}>Upcoming ({upcomingAppointments.length})</a>
                <a className={activeTab === 'past' ? 'active' : ''} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('past'); }}>Past ({pastAppointments.length})</a>
              </nav>
            </div>
          </header>

          {/* Content */}
          <div className="dd-content">

            {/* Schedule List */}
            <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dd-section-header" style={{ marginBottom: 0 }}>
                <h3 className="dd-section-title font-display">{activeTab === 'upcoming' ? 'Upcoming Appointments' : 'Past Appointments'}</h3>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="dd-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Patient Name</th>
                      <th>Purpose / Notes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedAppointments.length > 0 ? displayedAppointments.map((app, idx) => {
                      const isSelected = selectedAppointmentId === app.appointment_id;
                      return (
                        <React.Fragment key={idx}>
                          <tr className={isSelected ? 'selected-row' : ''}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <strong>{app.appointment_date}</strong><br/>
                              <span className="muted">{app.appointment_time}</span>
                            </td>
                            <td className="name" style={{ fontWeight: 600 }}>{app.appointee_name}</td>
                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {app.purpose || 'No details provided'}
                            </td>
                            <td>
                              <span className={`dd-status-badge ${app.status === 'Pending' ? 'warning' : app.status === 'Scheduled' ? 'stable' : app.status === 'Completed' ? 'success' : 'critical'}`}>
                                {app.status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {activeTab === 'upcoming' && app.status === 'Pending' && (
                                  <>
                                    <button 
                                      className="dd-btn-filled" 
                                      style={{ padding: '6px 12px', fontSize: 13, background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                                      onClick={() => handleStatusChange(app.appointment_id, 'Scheduled')}
                                    >
                                      Accept
                                    </button>
                                    <button 
                                      className="dd-btn-outline" 
                                      style={{ padding: '6px 12px', fontSize: 13, color: 'var(--error)', borderColor: 'var(--error)', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                                      onClick={() => handleStatusChange(app.appointment_id, 'Cancelled')}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                
                                {activeTab === 'past' && (
                                  <button 
                                    className="dd-btn-outline" 
                                    style={{ padding: '6px 12px', fontSize: 13 }}
                                    onClick={() => toggleDetails(app.appointment_id)}
                                  >
                                    {isSelected ? 'Hide Info' : 'View Info'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Details Row for Past Appointments */}
                          {isSelected && activeTab === 'past' && (
                            <tr className="details-row">
                              <td colSpan="5" style={{ padding: 0 }}>
                                <div style={{ 
                                  padding: '24px', 
                                  background: 'rgba(255,255,255,0.4)', 
                                  borderTop: '1px solid var(--outline-variant)',
                                  borderBottom: '1px solid var(--outline-variant)',
                                }}>
                                  {appointmentDetails.loading ? (
                                    <p>Loading historical details...</p>
                                  ) : appointmentDetails.error ? (
                                    <p style={{ color: 'var(--error)' }}>{appointmentDetails.error}</p>
                                  ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                      
                                      {/* Diagnosis Column */}
                                      <div>
                                        <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 12 }}>Diagnosis Overview</h4>
                                        {appointmentDetails.diagnosis ? (
                                          <>
                                            <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Diagnosis Name:</strong> {appointmentDetails.diagnosis.diagnosis_name}</p>
                                            <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Severity:</strong> {appointmentDetails.diagnosis.severity}</p>
                                            <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Symptoms:</strong> {appointmentDetails.diagnosis.symptoms}</p>
                                            <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Notes:</strong> {appointmentDetails.diagnosis.notes || 'N/A'}</p>
                                          </>
                                        ) : (
                                          <p style={{ margin: '4px 0', fontSize: 14, color: 'var(--on-surface-variant)' }}>No diagnosis recorded for this appointment.</p>
                                        )}
                                      </div>

                                      {/* Prescription Column */}
                                      <div>
                                        <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--tertiary)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 12 }}>Prescriptions Provided</h4>
                                        {appointmentDetails.prescriptions && appointmentDetails.prescriptions.length > 0 ? (
                                          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
                                            {appointmentDetails.prescriptions.map((med, midx) => (
                                              <li key={midx} style={{ marginBottom: 4 }}>
                                                <strong>{med.medicine_name}</strong> - {med.dosage} ({med.time_of_intake})
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p style={{ margin: '4px 0', fontSize: 14, color: 'var(--on-surface-variant)' }}>No prescriptions recorded.</p>
                                        )}
                                      </div>
                                      
                                    </div>
                                  )}
                                  
                                  {/* Quick Action to Add if none exists */}
                                  {!appointmentDetails.loading && !appointmentDetails.diagnosis && app.status === 'Completed' && (
                                    <div style={{ marginTop: '20px' }}>
                                      <Link to={`/doctor/diagnosis?patient_id=${app.appointment_id}&patient_type=appointment`} className="dd-btn-filled" style={{ textDecoration: 'none', fontSize: 14, padding: '8px 16px', display: 'inline-block' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'bottom', marginRight: 4 }}>stethoscope</span>
                                        Add Diagnosis
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No {activeTab} appointments found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

export default DoctorSchedulePage;
