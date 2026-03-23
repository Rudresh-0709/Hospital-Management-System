import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import {
  assignVisitorBadge,
  getAdminNewVisitorOverview,
  searchVisitorBadges,
} from '../../services/adminApi';
import { getPatientFullName, getPatientSearchName } from '../../utils/patientName';
import '../../styles/modern-form-migrate.css';

function AdminNewVisitorPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [badges, setBadges] = useState([]);
  const [admitId, setAdmitId] = useState('');
  const [form, setForm] = useState({ patient_id: '', contact_number: '' });
  const [selectedBadge, setSelectedBadge] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    const response = await getAdminNewVisitorOverview();

    if (!response.ok) {
      setError(response.data?.message || 'Failed to load new visitor overview');
      setPatients([]);
      setLoading(false);
      return;
    }

    const nextPatients = response.data.patients || [];
    setPatients(nextPatients);
    setForm((prev) => ({
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

  const onSearchBadges = async (event) => {
    event.preventDefault();
    if (!form.patient_id && !form.contact_number) {
      setError('Please provide Patient ID or Mobile Number.');
      return;
    }

    setError('');
    setSuccess('');

    const response = await searchVisitorBadges(form);
    if (!response.ok) {
      setBadges([]);
      setAdmitId('');
      setSelectedBadge('');
      setError(response.data?.message || 'Failed to search badges');
      return;
    }

    const nextBadges = response.data.badges || [];
    setBadges(nextBadges);
    setAdmitId(String(response.data.admit_id || ''));
    setSelectedBadge(nextBadges[0]?.badge_id ? String(nextBadges[0].badge_id) : '');
    setSuccess(response.data?.message || 'Badges loaded');
  };

  const onAssignBadge = async (event) => {
    event.preventDefault();
    if (!selectedBadge || !admitId) {
      setError('Please load badges and select a badge first.');
      return;
    }

    setError('');
    setSuccess('');
    const response = await assignVisitorBadge({
      badge_id: selectedBadge,
      admit_id: admitId,
    });

    if (!response.ok) {
      setError(response.data?.message || 'Failed to assign badge');
      return;
    }

    setSuccess(response.data?.message || 'Visit recorded successfully.');
  };

  return (
    <AdminShell title="New Visitor">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Visitor Badge Allocation</h1>
              <p className="form-subtitle">Search active admissions and assign a visitor badge.</p>
            </div>
          </div>

          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading active patients...</span></div>}
          {!loading && error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}
          {!loading && success && <div className="form-alert success"><span className="form-alert-icon">OK</span><span>{success}</span></div>}

          {!loading && patients.length > 0 && (
            <section className="form-section">
              <div className="form-section-header"><h3 className="form-section-title">Find Patient And Badge</h3></div>
              <form onSubmit={onSearchBadges}>
                <div className="form-field-row">
                  <div>
                    <label className="form-label" htmlFor="visitor_patient_id">Patient ID (preferred)</label>
                    <input
                      id="visitor_patient_id"
                      className="form-input"
                      value={form.patient_id}
                      onChange={(e) => setForm({ ...form, patient_id: e.target.value.trim() })}
                      placeholder="e.g. 1024"
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="visitor_contact_number">Mobile Number (backup)</label>
                    <input
                      id="visitor_contact_number"
                      className="form-input"
                      value={form.contact_number}
                      onChange={(e) => setForm({ ...form, contact_number: e.target.value.trim() })}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>
                <div className="form-button-group right">
                  <button type="submit" className="form-button primary">Search Badges</button>
                </div>
              </form>

              {badges.length > 0 && (
                <form onSubmit={onAssignBadge}>
                  <div className="form-field-row full">
                    <div>
                      <label className="form-label required" htmlFor="visitor_badge">Select Badge ID</label>
                      <select
                        id="visitor_badge"
                        className="form-select"
                        value={selectedBadge}
                        onChange={(e) => setSelectedBadge(e.target.value)}
                        required
                      >
                        {badges.map((badge, idx) => (
                          <option key={`${badge.badge_id}-${idx}`} value={badge.badge_id}>Badge ID: {badge.badge_id}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-button-group right">
                    <button type="submit" className="form-button success">Assign Badge</button>
                  </div>
                </form>
              )}
            </section>
          )}

          {!loading && !patients.length && (
            <section className="form-section">
              <div className="form-empty"><p>No admitted patients found for visitor registration.</p></div>
            </section>
          )}
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Active Patients</h3></div>
            <input
              className="form-input"
              placeholder="Search by patient id or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div style={{ overflowY: 'auto', marginTop: '14px', maxHeight: '520px' }}>
              <table className="form-table">
                <thead>
                  <tr>
                    <th>Admit ID</th>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient, idx) => (
                    <tr key={`${patient.admit_id || patient.patient_id}-${idx}`}>
                      <td>{patient.admit_id}</td>
                      <td>{patient.patient_id}</td>
                      <td>{getPatientFullName(patient)}</td>
                      <td>{patient.contact_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredPatients.length && <p className="muted mt-12">No matching patients found.</p>}
            </div>
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Visitor Flow</div>
            <div className="form-sidebar-item">1. Search patient</div>
            <div className="form-sidebar-item">2. Load available badges</div>
            <div className="form-sidebar-item">3. Assign selected badge</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminNewVisitorPage;
