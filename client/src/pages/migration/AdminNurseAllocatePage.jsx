import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/migration/AdminShell';
import {
  assignNurse,
  getAvailableNurses,
  getNurseAllocationOverview,
} from '../../services/adminApi';
import { getPatientFullName } from '../../utils/patientName';
import '../../styles/modern-form-migrate.css';

function AdminNurseAllocatePage() {
  const [searchParams] = useSearchParams();
  const preselectedAdmitId = searchParams.get('admit_id') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedAdmitId, setSelectedAdmitId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [nurses, setNurses] = useState([]);
  const [loadingNurses, setLoadingNurses] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    setError('');
    const response = await getNurseAllocationOverview();
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load patient allocation list');
      setPatients([]);
      setLoading(false);
      return;
    }

    setPatients(response.data.patients || []);
    if (response.data.flashMessage) {
      setSuccess(response.data.flashMessage);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (preselectedAdmitId) {
      findNurses(preselectedAdmitId, 'Selected Patient');
    }
  }, [preselectedAdmitId]);

  const findNurses = async (admitId, patientName = '') => {
    setSelectedAdmitId(admitId);
    setSelectedPatientName(patientName);
    setLoadingNurses(true);
    setError('');
    setSuccess('');

    const response = await getAvailableNurses(admitId);
    setLoadingNurses(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to load available nurses');
      setNurses([]);
      return;
    }

    setNurses(response.data.nurses || []);
  };

  const onAllocate = async (nurseid) => {
    const response = await assignNurse({ admit_id: selectedAdmitId, nurseid });
    if (!response.ok) {
      setError(response.data?.message || 'Failed to allocate nurse');
      return;
    }

    setSuccess(response.data?.message || 'Nurse allocated successfully!');
    setNurses([]);
    setSelectedAdmitId('');
    setSelectedPatientName('');
    await loadPatients();
  };

  return (
    <AdminShell title="Nurse Allocation">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Nurse Allocation</h1>
              <p className="form-subtitle">Assign available nurses to admitted patients based on ward requirements.</p>
            </div>
          </div>

          {error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}
          {success && <div className="form-alert success"><span className="form-alert-icon">✓</span><span>{success}</span></div>}
          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading patients...</span></div>}

          {!loading && (
            <section className="form-section">
              <div className="form-section-header"><h3 className="form-section-title">Patients Requiring Nurse ({patients.length})</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table className="form-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Reason</th>
                      <th>Room</th>
                      <th>Doctor</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length > 0 ? patients.map((patient, idx) => (
                      <tr key={`${patient.admit_id || idx}-${idx}`} style={selectedAdmitId === String(patient.admit_id) ? { background: '#f0f7ff' } : {}}>
                        <td style={{ fontWeight: 600 }}>{getPatientFullName(patient)}</td>
                        <td>{patient.reason_for_admission || '-'}</td>
                        <td>{patient.room_number || '-'}</td>
                        <td>{patient.doctor_assigned || '-'}</td>
                        <td>
                          <button
                            className="form-button primary"
                            type="button"
                            onClick={() => findNurses(patient.admit_id, getPatientFullName(patient))}
                            style={{ padding: '6px 16px', fontSize: '12px' }}
                          >
                            Find Nurse
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--form-text-muted)' }}>All patients have nurses assigned. 🎉</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {selectedAdmitId && (
            <section className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">
                  Available Nurses {selectedPatientName ? `for ${selectedPatientName}` : ''}
                </h3>
              </div>

              {loadingNurses && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Searching available nurses...</span></div>}

              {!loadingNurses && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="form-table">
                    <thead>
                      <tr>
                        <th>Nurse Name</th>
                        <th>Specialization</th>
                        <th>Shift</th>
                        <th>Role</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nurses.length > 0 ? nurses.map((nurse, idx) => (
                        <tr key={`${nurse.nurse_id || idx}-${idx}`}>
                          <td style={{ fontWeight: 600 }}>{nurse.name}</td>
                          <td>{nurse.specialization || '-'}</td>
                          <td>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: nurse.shift === 'Morning' ? '#d1fae5' : nurse.shift === 'Evening' ? '#fef3c7' : '#ede9fe',
                              color: nurse.shift === 'Morning' ? '#0ea05e' : nurse.shift === 'Evening' ? '#f59e0b' : '#7c3aed',
                            }}>
                              {nurse.shift}
                            </span>
                          </td>
                          <td>{nurse.role || '-'}</td>
                          <td>{nurse.remarks || '-'}</td>
                          <td>
                            <button
                              className="form-button success"
                              type="button"
                              onClick={() => onAllocate(nurse.nurse_id)}
                              style={{ padding: '6px 16px', fontSize: '12px' }}
                            >
                              Allocate
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--form-text-muted)' }}>No available nurses found for this allocation.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Allocation Stats</h3></div>
            <div className="form-summary-grid">
              <div className="form-summary-card"><div className="form-summary-label">Unassigned</div><div className="form-summary-value">{patients.length}</div></div>
              <div className="form-summary-card success"><div className="form-summary-label">Available</div><div className="form-summary-value">{nurses.length}</div></div>
            </div>
          </section>

          {selectedAdmitId && (
            <section className="form-section">
              <div className="form-section-header"><h3 className="form-section-title">Selected Patient</h3></div>
              <div className="form-info-card">
                <strong>{selectedPatientName || 'Patient'}</strong>
                <p>Admit ID: {selectedAdmitId}</p>
              </div>
            </section>
          )}

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Workflow</h3></div>
            <div className="form-tip-card">
              <strong>Step 1</strong>
              <p>Click "Find Nurse" next to a patient to see available nurses.</p>
            </div>
            <div className="form-tip-card">
              <strong>Step 2</strong>
              <p>Review nurse specializations and shifts for best match.</p>
            </div>
            <div className="form-tip-card">
              <strong>Step 3</strong>
              <p>Click "Allocate" to assign the nurse. They'll be marked unavailable.</p>
            </div>
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Allocation</div>
            <div className="form-sidebar-item">👩‍⚕️ Find available nurses</div>
            <div className="form-sidebar-item">🔗 Match to patients</div>
            <div className="form-sidebar-item">✅ Auto-mark unavailable</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminNurseAllocatePage;
