import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminVisitHistory } from '../../services/adminApi';
import '../../styles/modern-form-migrate.css';

const defaultFilters = {
  search: '',
  ward_preference: '',
  sort: 'visit_time_desc',
};

function AdminVisitHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [quickSearch, setQuickSearch] = useState('');

  const loadVisits = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    const response = await getAdminVisitHistory(nextFilters);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load visit history');
      setVisits([]);
      setLoading(false);
      return;
    }

    setVisits(response.data.visits || []);
    setLoading(false);
  };

  useEffect(() => {
    loadVisits(defaultFilters);
  }, []);

  const onFilter = async (event) => {
    event.preventDefault();
    await loadVisits(filters);
  };

  const onReset = () => {
    setFilters(defaultFilters);
    setQuickSearch('');
    loadVisits(defaultFilters);
  };

  const filteredVisits = useMemo(() => {
    const term = quickSearch.trim().toLowerCase();
    if (!term) return visits;
    return visits.filter((v) =>
      String(v.patient_name || '').toLowerCase().includes(term)
      || String(v.badge_id || '').toLowerCase().includes(term)
      || String(v.room_number || '').toLowerCase().includes(term)
    );
  }, [visits, quickSearch]);

  const stats = useMemo(() => {
    const total = visits.length;
    const wards = {};
    visits.forEach((v) => { wards[v.ward_preference || 'Unknown'] = (wards[v.ward_preference || 'Unknown'] || 0) + 1; });
    return { total, wards };
  }, [visits]);

  return (
    <AdminShell title="Visit History">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Visit History</h1>
              <p className="form-subtitle">Track visitor activity with badge-based entry records across all wards.</p>
            </div>
          </div>

          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading visit history...</span></div>}
          {!loading && error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Filters</h3></div>
            <form onSubmit={onFilter}>
              <div className="form-field-row three">
                <div>
                  <label className="form-label" htmlFor="visit_search">Patient Name</label>
                  <input id="visit_search" className="form-input" placeholder="Enter patient name" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" htmlFor="visit_ward">Ward Preference</label>
                  <select id="visit_ward" className="form-select" value={filters.ward_preference} onChange={(e) => setFilters({ ...filters, ward_preference: e.target.value })}>
                    <option value="">All Wards</option>
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="visit_sort">Sort By</label>
                  <select id="visit_sort" className="form-select" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
                    <option value="visit_time_asc">Visit Time (Ascending)</option>
                    <option value="visit_time_desc">Visit Time (Descending)</option>
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
              <div className="form-section-header"><h3 className="form-section-title">Visit Records ({filteredVisits.length})</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table className="form-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Room Number</th>
                      <th>Ward</th>
                      <th>Badge ID</th>
                      <th>Visit Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisits.length > 0 ? filteredVisits.map((visit, idx) => (
                      <tr key={`${visit.badge_id || idx}-${idx}`}>
                        <td style={{ fontWeight: 600 }}>{visit.patient_name || '-'}</td>
                        <td>{visit.room_number || '-'}</td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: visit.ward_preference === 'ICU' ? '#fee2e2' : visit.ward_preference === 'Private' ? '#ede9fe' : '#d1fae5',
                            color: visit.ward_preference === 'ICU' ? '#dc2626' : visit.ward_preference === 'Private' ? '#7c3aed' : '#0ea05e',
                          }}>
                            {visit.ward_preference || '-'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{visit.badge_id || '-'}</td>
                        <td>{visit.visit_time || '-'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--form-text-muted)' }}>No visits found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Overview</h3></div>
            <div className="form-summary-grid">
              <div className="form-summary-card"><div className="form-summary-label">Total Visits</div><div className="form-summary-value">{stats.total}</div></div>
              {Object.entries(stats.wards).slice(0, 2).map(([ward, count]) => (
                <div className="form-summary-card secondary" key={ward}><div className="form-summary-label">{ward}</div><div className="form-summary-value">{count}</div></div>
              ))}
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Quick Search</h3></div>
            <input
              className="form-input"
              placeholder="Search by patient, badge, room..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Visits</div>
            <div className="form-sidebar-item">🏥 Badge-based entry tracking</div>
            <div className="form-sidebar-item">🔍 Filter by ward type</div>
            <div className="form-sidebar-item">📅 Sort by visit time</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminVisitHistoryPage;
