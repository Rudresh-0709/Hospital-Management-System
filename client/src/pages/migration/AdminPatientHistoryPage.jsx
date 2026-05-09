import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminPatientHistory } from '../../services/adminApi';
import { getPatientFullName } from '../../utils/patientName';
import '../../styles/modern-form-migrate.css';

const defaultFilters = {
  gender: '',
  ward_preference: '',
  sort: '',
};

function AdminPatientHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState('');

  const loadHistory = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    const response = await getAdminPatientHistory(nextFilters);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load patient history');
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(response.data.patientdetails || []);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory(defaultFilters);
  }, []);

  const onApply = async (event) => {
    event.preventDefault();
    await loadHistory(filters);
  };

  const onReset = () => {
    setFilters(defaultFilters);
    setSearch('');
    loadHistory(defaultFilters);
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const name = getPatientFullName(row).toLowerCase();
      return (
        name.includes(term)
        || String(row.doctor_assigned || '').toLowerCase().includes(term)
        || String(row.room_number || '').toLowerCase().includes(term)
      );
    });
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const discharged = rows.filter((r) => r.discharge_date).length;
    const active = total - discharged;
    return { total, discharged, active };
  }, [rows]);

  return (
    <AdminShell title="Patient History">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Patient History</h1>
              <p className="form-subtitle">View comprehensive admission records with filtering and sorting options.</p>
            </div>
          </div>

          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading patient history...</span></div>}
          {!loading && error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Filters</h3></div>
            <form onSubmit={onApply}>
              <div className="form-field-row three">
                <div>
                  <label className="form-label" htmlFor="history_gender">Gender</label>
                  <select id="history_gender" className="form-select" value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="male">male</option>
                    <option value="female">female</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="history_ward">Ward Preference</label>
                  <select id="history_ward" className="form-select" value={filters.ward_preference} onChange={(e) => setFilters({ ...filters, ward_preference: e.target.value })}>
                    <option value="">All Wards</option>
                    <option value="General">General</option>
                    <option value="Private">Private</option>
                    <option value="ICU">ICU</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="history_sort">Sort By</label>
                  <select id="history_sort" className="form-select" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                    <option value="">Default</option>
                    <option value="admission_date_asc">Admission Date ↑</option>
                    <option value="admission_date_desc">Admission Date ↓</option>
                    <option value="discharge_date_asc">Discharge Date ↑</option>
                    <option value="discharge_date_desc">Discharge Date ↓</option>
                  </select>
                </div>
              </div>
              <div className="form-button-group right">
                <button className="form-button secondary" type="button" onClick={onReset}>Reset</button>
                <button className="form-button primary" type="submit">Apply Filters</button>
              </div>
            </form>
          </section>

          {!loading && !error && (
            <section className="form-section">
              <div className="form-section-header"><h3 className="form-section-title">Records ({filteredRows.length})</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table className="form-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>DOB</th>
                      <th>Gender</th>
                      <th>Contact</th>
                      <th>Doctor</th>
                      <th>Ward</th>
                      <th>Room</th>
                      <th>Admitted</th>
                      <th>Discharged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr key={`${row.patient_id || idx}-${idx}`}>
                        <td>{getPatientFullName(row)}</td>
                        <td>{row.dob ? String(row.dob).slice(0, 10) : '-'}</td>
                        <td>{row.gender || '-'}</td>
                        <td>{row.contact_number || '-'}</td>
                        <td>{row.doctor_assigned || '-'}</td>
                        <td>{row.ward_preference || '-'}</td>
                        <td>{row.room_number || '-'}</td>
                        <td>{row.admission_date ? String(row.admission_date).slice(0, 10) : '-'}</td>
                        <td>
                          {row.discharge_date
                            ? <span style={{ color: 'var(--form-status-success)' }}>{String(row.discharge_date).slice(0, 10)}</span>
                            : <span style={{ color: 'var(--form-status-warning)', fontWeight: 600 }}>Active</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredRows.length && <p className="muted" style={{ marginTop: 12, textAlign: 'center' }}>No matching patient records found.</p>}
              </div>
            </section>
          )}
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Overview</h3></div>
            <div className="form-summary-grid">
              <div className="form-summary-card"><div className="form-summary-label">Total</div><div className="form-summary-value">{stats.total}</div></div>
              <div className="form-summary-card success"><div className="form-summary-label">Active</div><div className="form-summary-value">{stats.active}</div></div>
              <div className="form-summary-card secondary"><div className="form-summary-label">Discharged</div><div className="form-summary-value">{stats.discharged}</div></div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Quick Search</h3></div>
            <input
              className="form-input"
              placeholder="Search by name, doctor, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="form-tip-card" style={{ marginTop: 12 }}>
              <strong>Tip</strong>
              <p>Use the filters above to narrow results by gender, ward, or sort order. Quick search works on the current filtered dataset.</p>
            </div>
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">History</div>
            <div className="form-sidebar-item">📋 Full admission records</div>
            <div className="form-sidebar-item">🔍 Filter by gender/ward</div>
            <div className="form-sidebar-item">📊 Sort by dates</div>
            <div className="form-sidebar-item">🟢 Active vs discharged</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminPatientHistoryPage;
