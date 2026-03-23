import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { dischargePatient, getAdminDischargeOverview } from '../../services/adminApi';
import { getPatientFullName, getPatientSearchName } from '../../utils/patientName';
import '../../styles/modern-form-migrate.css';

function AdminDischargePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    patient_id: '',
    contact_number: '',
    reason_for_admission: '',
  });

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    const response = await getAdminDischargeOverview();

    if (!response.ok) {
      setError(response.data?.message || 'Failed to load discharge overview');
      setPatients([]);
      setLoading(false);
      return;
    }

    const nextPatients = response.data.patients || [];
    setPatients(nextPatients);
    setForm((prev) => ({
      ...prev,
      patient_id: prev.patient_id || nextPatients[0]?.patient_id || '',
      contact_number: prev.contact_number || nextPatients[0]?.contact_number || '',
    }));
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient) => {
      const fullName = getPatientSearchName(patient);
      return fullName.includes(term) || String(patient.patient_id || '').includes(term);
    });
  }, [patients, search]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.patient_id && !form.contact_number) {
      setError('Please provide Patient ID or Mobile Number.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const response = await dischargePatient(form);
    setSubmitting(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to discharge patient');
      return;
    }

    setSuccess(response.data?.message || 'Patient discharged successfully');
    setForm((prev) => ({ ...prev, reason_for_admission: '' }));
    await loadOverview();
  };

  return (
    <AdminShell title="Discharge Patient">
      <div className="modern-form-page">
        {/* Main Form Section */}
        <div className="form-main">
          {/* Page Header */}
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">🏥 Patient Discharge</h1>
              <p className="form-subtitle">
                Complete the discharge process for admitted patients. Ensure all details are verified before submission.
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {loading && (
            <div className="form-alert info">
              <span className="form-alert-icon">ℹ️</span>
              <span>Loading discharge overview...</span>
            </div>
          )}
          {!loading && error && (
            <div className="form-alert error">
              <span className="form-alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {!loading && success && (
            <div className="form-alert success">
              <span className="form-alert-icon">✓</span>
              <span>{success}</span>
            </div>
          )}

          {!loading && patients.length > 0 && (
            <form onSubmit={onSubmit}>
              {/* Discharge Form Section */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="form-section-icon">📋</span>
                  <h2 className="form-section-title">Discharge Details</h2>
                </div>

                <div className="form-field-row">
                  <div>
                    <label className="form-label">Patient ID</label>
                    <span className="form-label-hint">Preferred for exact match</span>
                    <input
                      id="discharge_patient_id"
                      className="form-input"
                      placeholder="e.g., 1024"
                      value={form.patient_id}
                      onChange={(e) => setForm({ ...form, patient_id: e.target.value.trim() })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Mobile Number (Backup)</label>
                    <span className="form-label-hint">Use this if patient does not remember ID</span>
                    <input
                      id="discharge_contact_number"
                      className="form-input"
                      placeholder="e.g., 9876543210"
                      value={form.contact_number}
                      onChange={(e) => setForm({ ...form, contact_number: e.target.value.trim() })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label required">Discharge Reason</label>
                  <span className="form-label-hint">Provide details about the patient's discharge</span>
                  <textarea
                    id="discharge_reason"
                    className="form-textarea"
                    rows={4}
                    placeholder="e.g., Patient has recovered and is discharged for home care..."
                    value={form.reason_for_admission}
                    onChange={(e) => setForm({ ...form, reason_for_admission: e.target.value })}
                    required
                  />
                </div>

                <div className="form-button-group right">
                  <button className="form-button secondary" type="reset">
                    ↻ Reset
                  </button>
                  <button className="form-button success" type="submit" disabled={submitting}>
                    {submitting ? '⏳ Processing...' : '✓ Discharge Patient'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {!loading && !patients.length && (
            <div className="form-section">
              <div className="form-empty">
                <div className="form-empty-icon">🚫</div>
                <p>No admitted patients available for discharge.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Patient List */}
        <div className="form-aside">
          <div className="form-section">
            <div className="form-section-header">
              <span className="form-section-icon">👥</span>
              <h3 className="form-section-title">Admitted Patients</h3>
            </div>

            <div>
              <input
                className="form-input"
                placeholder="Search by ID or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredPatients.length > 0 ? (
              <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                <table className="form-table" style={{ marginTop: '16px' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Doctor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient, idx) => (
                      <tr key={`${patient.admit_id || patient.patient_id}-${idx}`}>
                        <td><strong>{patient.patient_id}</strong></td>
                        <td>{getPatientFullName(patient)}</td>
                        <td style={{ fontSize: '12px' }}>{patient.doctor_assigned || '—'} / {patient.contact_number || 'No mobile'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="form-empty" style={{ padding: '20px' }}>
                <div className="form-empty-icon">📋</div>
                <p style={{ fontSize: '12px' }}>No matching patients found.</p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="form-info-card">
            <strong>💡 Discharge Checklist</strong>
            <p>Ensure patient prescriptions are ready, follow-up appointments are scheduled, and discharge summary is documented.</p>
          </div>
        </div>

        {/* Right Sidebar - Tips */}
        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">ℹ️ DISCHARGE TIPS</div>
            <div className="form-tip-card">
              <strong>Verify Details</strong>
              <p>Confirm patient name and ID before discharge</p>
            </div>
            <div className="form-tip-card">
              <strong>Document Reason</strong>
              <p>Always provide discharge reason for records</p>
            </div>
            <div className="form-tip-card">
              <strong>Clear Instructions</strong>
              <p>Give aftercare instructions to patient</p>
            </div>
          </div>

          <div className="form-sidebar-section">
            <div className="form-sidebar-title">📊 STATISTICS</div>
            <div className="form-sidebar-item">
              <span>👥 Patients:</span>
              <strong>{patients.length}</strong>
            </div>
            <div className="form-sidebar-item">
              <span>🔍 Filtered:</span>
              <strong>{filteredPatients.length}</strong>
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminDischargePage;
