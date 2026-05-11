import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDoctorDashboardOverview } from '../../services/doctorApi';
import '../../styles/doctor-dashboard.css';

function DoctorPatientsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({
    doctordetails: null,
    patientdetails: [],
  });
  
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getDoctorDashboardOverview();
        if (!response.ok) {
          setError(response.data?.message || 'Failed to load patients data');
          setLoading(false);
          return;
        }
        setPayload({
          doctordetails: response.data.doctordetails || null,
          patientdetails: response.data.patientdetails || [],
        });
      } catch (err) {
        setError('Error fetching patients data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (loading) return <div style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>Loading patients...</div>;
  if (error) return <div style={{ padding: 40, color: '#ba1a1a', fontFamily: 'Inter, sans-serif' }}>{error}</div>;

  const { doctordetails, patientdetails } = payload;
  
  const filteredPatients = patientdetails.filter(patient => {
    const term = search.toLowerCase();
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    return fullName.includes(term) || String(patient.patient_id).includes(term) || (patient.reason_for_admission || '').toLowerCase().includes(term);
  });

  return (
    <div className="dd-root">
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
            <Link className="dd-nav-link active" to="/doctor/patients">
              <span className="material-symbols-outlined">group</span>
              <span>Patients</span>
            </Link>
            <Link className="dd-nav-link" to="/doctor/schedule">
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
              <div className="dd-search-wrap">
                <span className="material-symbols-outlined">search</span>
                <input 
                  className="dd-search-input" 
                  placeholder="Search patients by name, ID, condition..." 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <nav className="dd-header-nav">
                <a className="active" href="#">My Patients</a>
                <a href="#">All Admitted</a>
                <a href="#">Discharged</a>
              </nav>
            </div>
            <div className="dd-header-actions">
              <button className="dd-icon-btn">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="dd-icon-btn">
                <span className="material-symbols-outlined">chat_bubble</span>
              </button>
              <div className="dd-divider"></div>
              <div className="dd-profile">
                <div className="dd-profile-info">
                  <p className="dd-profile-name">{doctordetails?.doctor_name || 'Doctor'}</p>
                  <p className="dd-profile-role">Physician</p>
                </div>
                <img
                  className="dd-profile-avatar"
                  alt="Doctor Profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHQm2skIv80uHa3o9ZsnBvEWrpfos8UkLM9VZNMomLq6lF2dZMIWXpKZlRycqFvYHvCEbdAxp4cTbKE7Np_wpZ0wFhhGVZ15saRnluhSKdk8tHpk3K1d6itGGkiwn4bmGaIxs-kqhr9OSOvy983SfRFAtCUTHnr4nx0QtfBQK4s7EOZIHbLekmovde4L-Izoeotiec5DFm8cGfiaLk2ORYGI4AWJkTiM5l_8Hye4GjwR3yDtURAB5G1ut8KkCXUXo3PU9B0O3h9Fs"
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="dd-content">

            {/* Patients List */}
            <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dd-section-header" style={{ marginBottom: 0 }}>
                <h3 className="dd-section-title font-display">My Assigned Patients</h3>
                <span className="dd-metric-badge blue">Total: {filteredPatients.length}</span>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="dd-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Patient ID / Gender</th>
                      <th>Age / DOB</th>
                      <th>Room / Ward</th>
                      <th>Admission Condition</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.length > 0 ? filteredPatients.map((patient, idx) => {
                      const age = patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '—';
                      return (
                        <React.Fragment key={idx}>
                          <tr className={selectedPatient?.admit_id === patient.admit_id ? 'selected-row' : ''}>
                            <td className="name" style={{ fontWeight: 600 }}>{patient.first_name} {patient.last_name}</td>
                            <td className="muted">#{patient.patient_id} / <span style={{textTransform: 'capitalize'}}>{patient.gender}</span></td>
                            <td>{age} yrs<br/><span style={{fontSize: 12, color: 'var(--on-surface-variant)'}}>{patient.dob ? new Date(patient.dob).toLocaleDateString() : ''}</span></td>
                            <td>
                              <span style={{ fontWeight: 500 }}>{patient.room_number || '—'}</span><br/>
                              <span style={{fontSize: 12, color: 'var(--on-surface-variant)'}}>{patient.ward_preference || '—'} Ward</span>
                            </td>
                            <td>
                              <span className={`dd-status-badge ${patient.discharge_date ? 'discharged' : 'stable'}`}>
                                {patient.reason_for_admission || 'ADMITTED'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="dd-btn-outline" 
                                style={{ padding: '6px 12px', fontSize: 13 }}
                                onClick={() => setSelectedPatient(selectedPatient?.admit_id === patient.admit_id ? null : patient)}
                              >
                                {selectedPatient?.admit_id === patient.admit_id ? 'Hide Details' : 'View Details'}
                              </button>
                            </td>
                          </tr>
                          {selectedPatient?.admit_id === patient.admit_id && (
                            <tr className="details-row">
                              <td colSpan="6" style={{ padding: 0 }}>
                                <div style={{ 
                                  padding: '24px', 
                                  background: 'rgba(255,255,255,0.4)', 
                                  borderTop: '1px solid var(--outline-variant)',
                                  borderBottom: '1px solid var(--outline-variant)',
                                }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                                    
                                    <div>
                                      <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 12 }}>Contact Info</h4>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Email:</strong> {patient.email || 'N/A'}</p>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Phone:</strong> {patient.contact_number || 'N/A'}</p>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Address:</strong> {patient.address || 'N/A'}</p>
                                    </div>

                                    <div>
                                      <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--error)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 12 }}>Emergency Contact</h4>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Name:</strong> {patient.emergency_name || 'N/A'}</p>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Relation:</strong> {patient.relationship || 'N/A'}</p>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Phone:</strong> {patient.emergency_contact || 'N/A'}</p>
                                    </div>

                                    <div>
                                      <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--tertiary)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 12 }}>Admission Details</h4>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Admitted On:</strong> {new Date(patient.admission_date).toLocaleString()}</p>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Discharged On:</strong> {patient.discharge_date ? new Date(patient.discharge_date).toLocaleString() : 'Not Discharged'}</p>
                                      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Primary Doctor:</strong> {patient.doctor_assigned}</p>
                                    </div>
                                    
                                  </div>
                                  
                                  <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                                    <Link to={`/doctor/diagnosis?patient_id=${patient.patient_id}&patient_type=admitted`} className="dd-btn-filled" style={{ textDecoration: 'none', fontSize: 14, padding: '8px 16px' }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>stethoscope</span>
                                      Add Diagnosis
                                    </Link>
                                    <Link to={`/doctor/newprescription?patient_id=${patient.patient_id}&patient_type=admitted`} className="dd-btn-outline" style={{ textDecoration: 'none', fontSize: 14, padding: '8px 16px' }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>prescriptions</span>
                                      Add Prescription
                                    </Link>
                                    <Link to={`/chat?patient=${patient.patient_id}`} className="dd-btn-outline" style={{ textDecoration: 'none', fontSize: 14, padding: '8px 16px' }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
                                      Message Patient
                                    </Link>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }) : (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No patients found</td></tr>
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

export default DoctorPatientsPage;
