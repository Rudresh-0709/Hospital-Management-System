import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import {
  assignVisitorBadge,
  getAdminNewVisitorOverview,
  searchVisitorBadges,
} from '../../services/adminApi';

function AdminNewVisitorPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [badges, setBadges] = useState([]);
  const [admitId, setAdmitId] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '' });
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
      first_name: prev.first_name || nextPatients[0]?.first_name || '',
      last_name: prev.last_name || nextPatients[0]?.last_name || '',
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
      const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
      return fullName.includes(term) || String(patient.patient_id || '').includes(term);
    });
  }, [patients, search]);

  const onSearchBadges = async (event) => {
    event.preventDefault();
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
      <section className="card">
        <h3 className="card-title">Visitor Badge Allocation</h3>

        {loading && <p className="muted">Loading active patients...</p>}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && success && <p className="success">{success}</p>}

        {!loading && patients.length > 0 && (
          <form onSubmit={onSearchBadges}>
            <div className="split-grid">
              <div>
                <label className="field-label" htmlFor="visitor_first_name">First name:</label>
                <select
                  id="visitor_first_name"
                  className="field"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                >
                  {patients.map((patient, idx) => (
                    <option key={`${patient.admit_id || idx}-first`} value={patient.first_name}>{patient.first_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="visitor_last_name">Last name:</label>
                <select
                  id="visitor_last_name"
                  className="field"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                >
                  {patients.map((patient, idx) => (
                    <option key={`${patient.admit_id || idx}-last`} value={patient.last_name}>{patient.last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn">Search Badges</button>
          </form>
        )}

        {!loading && badges.length > 0 && (
          <form onSubmit={onAssignBadge} style={{ marginTop: 18 }}>
            <label className="field-label" htmlFor="visitor_badge">Select Badge ID:</label>
            <select
              id="visitor_badge"
              className="field"
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              required
            >
              {badges.map((badge, idx) => (
                <option key={`${badge.badge_id}-${idx}`} value={badge.badge_id}>Badge ID: {badge.badge_id}</option>
              ))}
            </select>
            <button type="submit" className="btn">Assign Badge</button>
          </form>
        )}

        {!loading && !patients.length && (
          <p className="muted">No admitted patients found for visitor registration.</p>
        )}
      </section>

      <section className="card">
        <div className="toolbar">
          <h3 className="card-title card-title-tight">Active Patients</h3>
          <input
            className="field field-tight"
            placeholder="Search by patient id or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Admit ID</th>
                <th>Patient ID</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, idx) => (
                <tr key={`${patient.admit_id || patient.patient_id}-${idx}`}>
                  <td>{patient.admit_id}</td>
                  <td>{patient.patient_id}</td>
                  <td>{patient.first_name} {patient.last_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredPatients.length && <p className="muted mt-12">No matching patients found.</p>}
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminNewVisitorPage;
