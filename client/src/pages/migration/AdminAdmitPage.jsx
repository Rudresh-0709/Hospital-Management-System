import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminAdmitOverview } from '../../services/adminApi';
import { getPatientFullName, getPatientSearchName } from '../../utils/patientName';
import '../../styles/modern-form-migrate.css';

function AdminAdmitPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({ patients: [], doctors: [], rooms: [], message: null });
  const [search, setSearch] = useState('');
  const [admitForm, setAdmitForm] = useState({
    patient_id: '',
    contact_number: '',
    reason_for_admission: '',
    doctor_assigned: '',
    ward_preference: 'general',
    room_number: '',
  });

  const flashText = Array.isArray(payload.message)
    ? payload.message[0]
    : payload.message || '';

  useEffect(() => {
    async function fetchData() {
      const response = await getAdminAdmitOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load admit overview');
        setLoading(false);
        return;
      }

      setPayload({
        patients: response.data.patients || [],
        doctors: response.data.doctors || [],
        rooms: response.data.rooms || [],
        message: response.data.message || null,
      });
      setAdmitForm((prev) => ({
        ...prev,
        patient_id: prev.patient_id || response.data.patients?.[0]?.patient_id || '',
        contact_number: prev.contact_number || response.data.patients?.[0]?.contact_number || '',
        doctor_assigned: prev.doctor_assigned || response.data.doctors?.[0]?.doctor_name || '',
        room_number: prev.room_number || response.data.rooms?.[0]?.room_number || '',
      }));
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payload.patients;

    return payload.patients.filter((patient) => {
      const fullName = getPatientSearchName(patient);
      return (
        fullName.includes(term)
        || String(patient.patient_id || '').toLowerCase().includes(term)
      );
    });
  }, [payload.patients, search]);

  const selectedPatient = useMemo(
    () => payload.patients.find((patient) => String(patient.patient_id) === String(admitForm.patient_id)),
    [payload.patients, admitForm.patient_id]
  );

  return (
    <AdminShell title="Admit Patient">
      <div className="modern-form-page">
        {/* Main Content */}
        <div className="form-main">
          {/* Page Header */}
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">🏥 Patient Admission</h1>
              <p className="form-subtitle">
                Review and manage patient admissions. View eligible patients, available doctors, and open rooms.
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {loading && (
            <div className="form-alert info">
              <span className="form-alert-icon">ℹ️</span>
              <span>Loading admission overview...</span>
            </div>
          )}
          {!loading && error && (
            <div className="form-alert error">
              <span className="form-alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Summary Cards */}
          {!loading && !error && (
            <div className="form-summary-grid">
              <div className="form-summary-card">
                <div className="form-summary-label">👥 Eligible Patients</div>
                <div className="form-summary-value">{payload.patients.length}</div>
              </div>
              <div className="form-summary-card secondary">
                <div className="form-summary-label">👨‍⚕️ Available Doctors</div>
                <div className="form-summary-value">{payload.doctors.length}</div>
              </div>
              <div className="form-summary-card success">
                <div className="form-summary-label">🛏️ Open Rooms</div>
                <div className="form-summary-value">{payload.rooms.length}</div>
              </div>
            </div>
          )}

          {/* Candidate List Section */}
          {!loading && !error && (
            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon">📝</span>
                <h2 className="form-section-title">Admit Existing Patient</h2>
              </div>

              <form action="/admit_patient" method="POST">
                <div className="form-field-row">
                  <div>
                    <label className="form-label required" htmlFor="admit_patient_id">Patient ID</label>
                    <span className="form-label-hint">Primary identifier (recommended)</span>
                    <select
                      id="admit_patient_id"
                      className="form-select"
                      name="patient_id"
                      value={admitForm.patient_id}
                      onChange={(e) => {
                        const nextPatient = payload.patients.find((patient) => String(patient.patient_id) === String(e.target.value));
                        setAdmitForm({
                          ...admitForm,
                          patient_id: e.target.value,
                          contact_number: nextPatient?.contact_number || '',
                        });
                      }}
                      required
                    >
                      {payload.patients.map((patient, idx) => (
                        <option key={`${patient.patient_id}-${idx}`} value={patient.patient_id}>
                          {patient.patient_id} - {getPatientFullName(patient)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" htmlFor="admit_contact_number">Mobile Number (Backup)</label>
                    <input
                      id="admit_contact_number"
                      className="form-input"
                      name="contact_number"
                      value={admitForm.contact_number}
                      onChange={(e) => setAdmitForm({ ...admitForm, contact_number: e.target.value })}
                      placeholder="Enter mobile if patient ID unknown"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label required" htmlFor="admit_reason">Reason for Admission</label>
                  <textarea
                    id="admit_reason"
                    className="form-textarea"
                    rows={3}
                    name="reason_for_admission"
                    value={admitForm.reason_for_admission}
                    onChange={(e) => setAdmitForm({ ...admitForm, reason_for_admission: e.target.value })}
                    required
                  />
                </div>

                <div className="form-field-row">
                  <div>
                    <label className="form-label required" htmlFor="admit_doctor_assigned">Doctor Assigned</label>
                    <select
                      id="admit_doctor_assigned"
                      className="form-select"
                      name="doctor_assigned"
                      value={admitForm.doctor_assigned}
                      onChange={(e) => setAdmitForm({ ...admitForm, doctor_assigned: e.target.value })}
                      required
                    >
                      {payload.doctors.map((doctor, idx) => (
                        <option key={`${doctor.doctor_id || doctor.doctor_name}-${idx}`} value={doctor.doctor_name}>
                          {doctor.doctor_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" htmlFor="admit_ward_preference">Ward Preference</label>
                    <select
                      id="admit_ward_preference"
                      className="form-select"
                      name="ward_preference"
                      value={admitForm.ward_preference}
                      onChange={(e) => setAdmitForm({ ...admitForm, ward_preference: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="private">Private</option>
                      <option value="General">General (Title)</option>
                      <option value="Private">Private (Title)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label required" htmlFor="admit_room_number">Room Number</label>
                    <select
                      id="admit_room_number"
                      className="form-select"
                      name="room_number"
                      value={admitForm.room_number}
                      onChange={(e) => setAdmitForm({ ...admitForm, room_number: e.target.value })}
                      required
                    >
                      {payload.rooms.map((room, idx) => (
                        <option key={`${room.room_number}-${room.ward_preference || idx}`} value={room.room_number}>
                          {room.room_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <input type="hidden" name="first_name" value={selectedPatient?.first_name || ''} />
                <input type="hidden" name="last_name" value={selectedPatient?.last_name || ''} />

                <div className="form-button-group right">
                  <button className="form-button success" type="submit">✓ Admit Patient</button>
                </div>
              </form>
            </div>
          )}

          {!loading && !error && !!flashText && (
            <div className="form-alert success">
              <span className="form-alert-icon">✓</span>
              <span>{flashText}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="form-section">
              <div className="form-section-header">
                <span className="form-section-icon">📋</span>
                <h2 className="form-section-title">Admission Candidates</h2>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Search Patients</label>
                <input
                  className="form-input"
                  placeholder="Search by patient ID or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {filteredPatients.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="form-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Full Name</th>
                        <th>Last Discharge</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient, idx) => (
                        <tr key={`${patient.patient_id}-${idx}`}>
                          <td><strong>{patient.patient_id}</strong></td>
                          <td>{getPatientFullName(patient)}</td>
                          <td style={{ fontSize: '12px' }}>
                            {patient.discharge_date ? String(patient.discharge_date).slice(0, 10) : '—'}
                          </td>
                          <td><span style={{ color: '#0ea05e', fontWeight: '600' }}>✓ Ready</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="form-empty">
                  <div className="form-empty-icon">📋</div>
                  <p>No matching patients found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Resources */}
        <div className="form-aside">
          {/* Doctors Section */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="form-section-icon">👨‍⚕️</span>
              <h3 className="form-section-title">Available Doctors</h3>
            </div>

            {payload.doctors.length > 0 ? (
              <div>
                {payload.doctors.slice(0, 8).map((doctor, idx) => (
                  <div key={idx} className="form-tip-card">
                    <strong>{doctor.doctor_name || 'Dr. Name'}</strong>
                    <p>{doctor.specialty || 'General Practice'}</p>
                  </div>
                ))}
                {payload.doctors.length > 8 && (
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                    +{payload.doctors.length - 8} more doctors
                  </p>
                )}
              </div>
            ) : (
              <div className="form-empty" style={{ padding: '20px' }}>
                <p style={{ fontSize: '12px' }}>No doctors available</p>
              </div>
            )}
          </div>

          {/* Rooms Section */}
          <div className="form-section">
            <div className="form-section-header">
              <span className="form-section-icon">🛏️</span>
              <h3 className="form-section-title">Open Rooms</h3>
            </div>

            {payload.rooms.length > 0 ? (
              <div>
                {payload.rooms.slice(0, 8).map((room, idx) => (
                  <div key={idx} className="form-sidebar-item">
                    <span>🚪 Room {room.room_number || room.id || idx + 1}</span>
                    <span style={{ marginLeft: 'auto', color: '#0ea05e', fontWeight: '600' }}>Available</span>
                  </div>
                ))}
                {payload.rooms.length > 8 && (
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                    +{payload.rooms.length - 8} more rooms
                  </p>
                )}
              </div>
            ) : (
              <div className="form-empty" style={{ padding: '20px' }}>
                <p style={{ fontSize: '12px' }}>No rooms available</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Tips */}
        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">ℹ️ ADMISSION TIPS</div>
            <div className="form-tip-card">
              <strong>Select Carefully</strong>
              <p>Choose appropriate doctor and ward for patient</p>
            </div>
            <div className="form-tip-card">
              <strong>Check Availability</strong>
              <p>Ensure rooms and doctors are available</p>
            </div>
            <div className="form-tip-card">
              <strong>Confirm Details</strong>
              <p>Verify all patient information before admission</p>
            </div>
          </div>

          <div className="form-sidebar-section">
            <div className="form-sidebar-title">📊 OVERVIEW</div>
            <div className="form-sidebar-item">
              <span>📋 Candidates:</span>
              <strong>{payload.patients.length}</strong>
            </div>
            <div className="form-sidebar-item">
              <span>🔍 Filtered:</span>
              <strong>{filteredPatients.length}</strong>
            </div>
            <div className="form-sidebar-item">
              <span>👨‍⚕️ Doctors:</span>
              <strong>{payload.doctors.length}</strong>
            </div>
            <div className="form-sidebar-item">
              <span>🛏️ Rooms:</span>
              <strong>{payload.rooms.length}</strong>
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminAdmitPage;
