import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminPatientsOverview, createNewPatient } from '../../services/adminApi';
import { getPatientFullName, getPatientSearchName } from '../../utils/patientName';
import Toast from '../../components/migration/Toast';
import '../../styles/modern-form-migrate.css';

function AdminPatientsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({ patients: [], doctors: [], rooms: [], message: null });
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flashMsg, setFlashMsg] = useState({ type: '', text: '' });
  const [newPatientForm, setNewPatientForm] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    gender: 'male',
    contact_number: '',
    email: '',
    address: '',
    password: '',
    emergency_name: '',
    relationship: '',
    emergency_contact: '',
    reason_for_admission: '',
    doctor_assigned: '',
    ward_preference: 'General',
    room_number: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFlashMsg({ type: '', text: '' });
    try {
      const res = await createNewPatient(newPatientForm);
      if (res.ok) {
        setFlashMsg({ type: 'success', text: res.data.message || 'Patient admitted successfully!' });
        // Reset form
        setNewPatientForm({
          first_name: '', last_name: '', dob: '', gender: 'male',
          contact_number: '', email: '', address: '', password: '',
          emergency_name: '', relationship: '', emergency_contact: '',
          reason_for_admission: '',
          doctor_assigned: payload.doctors?.[0]?.doctor_name || '',
          ward_preference: 'General',
          room_number: payload.rooms?.[0]?.room_number || '',
        });
        // Refresh overview data
        const updated = await getAdminPatientsOverview();
        if (updated.ok) {
          setPayload({
            patients: updated.data.patients || [],
            doctors: updated.data.doctors || [],
            rooms: updated.data.rooms || [],
            message: null,
          });
        }
      } else {
        setFlashMsg({ type: 'error', text: res.data.message || 'Failed to admit patient.' });
      }
    } catch (err) {
      setFlashMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    async function fetchData() {
      const response = await getAdminPatientsOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load patients overview');
        setLoading(false);
        return;
      }

      setPayload({
        patients: response.data.patients || [],
        doctors: response.data.doctors || [],
        rooms: response.data.rooms || [],
        message: response.data.message || null,
      });
      setNewPatientForm((prev) => ({
        ...prev,
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
        || String(patient.doctor_assigned || '').toLowerCase().includes(term)
      );
    });
  }, [payload.patients, search]);

  return (
    <AdminShell title="New Patient">
      {flashMsg.text && (
        <Toast
          type={flashMsg.type}
          message={flashMsg.text}
          onClose={() => setFlashMsg({ type: '', text: '' })}
        />
      )}
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">New Patient Registration</h1>
              <p className="form-subtitle">Create patient, emergency, and admission records in a single workflow.</p>
            </div>
          </div>

          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading patient overview...</span></div>}
          {!loading && error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Registration Form</h3></div>
            <form onSubmit={handleSubmit}>
              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="new_patient_first_name">First Name</label>
                  <input id="new_patient_first_name" className="form-input" name="first_name" value={newPatientForm.first_name} onChange={(e) => setNewPatientForm({ ...newPatientForm, first_name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label required" htmlFor="new_patient_last_name">Last Name</label>
                  <input id="new_patient_last_name" className="form-input" name="last_name" value={newPatientForm.last_name} onChange={(e) => setNewPatientForm({ ...newPatientForm, last_name: e.target.value })} required />
                </div>
              </div>

              <div className="form-field-row three">
                <div>
                  <label className="form-label required" htmlFor="new_patient_dob">Date of Birth</label>
                  <input id="new_patient_dob" type="date" className="form-input" name="dob" value={newPatientForm.dob} onChange={(e) => setNewPatientForm({ ...newPatientForm, dob: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="new_patient_gender">Gender</label>
                  <select id="new_patient_gender" className="form-select" name="gender" value={newPatientForm.gender} onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label required" htmlFor="new_patient_contact">Contact Number</label>
                  <input id="new_patient_contact" className="form-input" name="contact_number" value={newPatientForm.contact_number} onChange={(e) => setNewPatientForm({ ...newPatientForm, contact_number: e.target.value })} required />
                </div>
              </div>

              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="new_patient_email">Email</label>
                  <input id="new_patient_email" type="email" className="form-input" name="email" value={newPatientForm.email} onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label required" htmlFor="new_patient_password">Password</label>
                  <input id="new_patient_password" type="password" className="form-input" name="password" value={newPatientForm.password} onChange={(e) => setNewPatientForm({ ...newPatientForm, password: e.target.value })} required />
                </div>
              </div>

              <div className="form-field-row full">
                <div>
                  <label className="form-label required" htmlFor="new_patient_address">Address</label>
                  <textarea id="new_patient_address" className="form-textarea" name="address" rows={2} value={newPatientForm.address} onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })} required />
                </div>
              </div>

              <div className="form-section-header"><h4 className="form-section-title">Emergency Contact</h4></div>
              <div className="form-field-row three">
                <div>
                  <label className="form-label required" htmlFor="new_patient_emergency_name">Contact Name</label>
                  <input id="new_patient_emergency_name" className="form-input" name="emergency_name" value={newPatientForm.emergency_name} onChange={(e) => setNewPatientForm({ ...newPatientForm, emergency_name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label required" htmlFor="new_patient_relationship">Relationship</label>
                  <input id="new_patient_relationship" className="form-input" name="relationship" value={newPatientForm.relationship} onChange={(e) => setNewPatientForm({ ...newPatientForm, relationship: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label required" htmlFor="new_patient_emergency_contact">Emergency Contact Number</label>
                  <input id="new_patient_emergency_contact" className="form-input" name="emergency_contact" value={newPatientForm.emergency_contact} onChange={(e) => setNewPatientForm({ ...newPatientForm, emergency_contact: e.target.value })} required />
                </div>
              </div>

              <div className="form-section-header"><h4 className="form-section-title">Admission Details</h4></div>
              <div className="form-field-row full">
                <div>
                  <label className="form-label required" htmlFor="new_patient_reason">Reason for Admission</label>
                  <textarea id="new_patient_reason" className="form-textarea" name="reason_for_admission" rows={2} value={newPatientForm.reason_for_admission} onChange={(e) => setNewPatientForm({ ...newPatientForm, reason_for_admission: e.target.value })} required />
                </div>
              </div>

              <div className="form-field-row three">
                <div>
                  <label className="form-label required" htmlFor="new_patient_doctor">Doctor Assigned</label>
                  <select id="new_patient_doctor" className="form-select" name="doctor_assigned" value={newPatientForm.doctor_assigned} onChange={(e) => setNewPatientForm({ ...newPatientForm, doctor_assigned: e.target.value })} required>
                    {payload.doctors.length > 0 ? payload.doctors.map((doctor, idx) => (
                      <option key={`${doctor.doctor_id || doctor.doctor_name}-${idx}`} value={doctor.doctor_name}>{doctor.doctor_name}</option>
                    )) : <option value="">No doctors available</option>}
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="new_patient_ward">Ward Preference</label>
                  <select id="new_patient_ward" className="form-select" name="ward_preference" value={newPatientForm.ward_preference} onChange={(e) => setNewPatientForm({ ...newPatientForm, ward_preference: e.target.value })}>
                    <option value="General">General</option>
                    <option value="Private">Private</option>
                    <option value="ICU">ICU</option>
                  </select>
                </div>
                <div>
                  <label className="form-label required" htmlFor="new_patient_room">Room Number</label>
                  <select id="new_patient_room" className="form-select" name="room_number" value={newPatientForm.room_number} onChange={(e) => setNewPatientForm({ ...newPatientForm, room_number: e.target.value })} required>
                    {payload.rooms.length > 0 ? payload.rooms.map((room, idx) => (
                      <option key={`${room.room_number}-${room.ward_preference || idx}`} value={room.room_number}>{room.room_number}</option>
                    )) : <option value="">No rooms available</option>}
                  </select>
                </div>
              </div>

              <div className="form-button-group right">
                <button className="form-button success" type="submit" disabled={submitting}>{submitting ? 'Admitting...' : 'Admit Patient'}</button>
              </div>
            </form>
          </section>
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Overview</h3></div>
            <div className="form-summary-grid">
              <div className="form-summary-card"><div className="form-summary-label">Patients</div><div className="form-summary-value">{payload.patients.length}</div></div>
              <div className="form-summary-card secondary"><div className="form-summary-label">Doctors</div><div className="form-summary-value">{payload.doctors.length}</div></div>
              <div className="form-summary-card success"><div className="form-summary-label">Rooms</div><div className="form-summary-value">{payload.rooms.length}</div></div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Patient List</h3></div>
            <input
              className="form-input"
              placeholder="Search by patient id, name, doctor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!loading && !error && (
              <div style={{ overflowY: 'auto', marginTop: '12px', maxHeight: '420px' }}>
                <table className="form-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Name</th>
                      <th>Doctor</th>
                      <th>Admit</th>
                      <th>Discharge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient, idx) => (
                      <tr key={`${patient.patient_id}-${patient.admit_id || patient.emergency_id || idx}`}>
                        <td>{patient.patient_id}</td>
                        <td>{getPatientFullName(patient)}</td>
                        <td>{patient.doctor_assigned || '-'}</td>
                        <td>{patient.admit_date ? String(patient.admit_date).slice(0, 10) : '-'}</td>
                        <td>{patient.discharge_date ? String(patient.discharge_date).slice(0, 10) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredPatients.length && <p className="muted" style={{ marginTop: 12 }}>No matching patients found.</p>}
              </div>
            )}
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Registration</div>
            <div className="form-sidebar-item">Step 1: Patient profile</div>
            <div className="form-sidebar-item">Step 2: Emergency contact</div>
            <div className="form-sidebar-item">Step 3: Admission details</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminPatientsPage;
