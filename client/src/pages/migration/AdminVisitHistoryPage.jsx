import { useEffect, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getAdminVisitHistory } from '../../services/adminApi';
import '../../styles/patient-history-ejs.css';

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

  return (
    <AdminShell title="Visit History">
      <section className="card migrate-history-card">
        <div className="migrate-history-scroll-wrapper">
          <h3 className="migrate-history-title">Visit History</h3>

          <form className="migrate-history-filter" onSubmit={onFilter}>
            <label htmlFor="visit_history_search">Search by Patient Name:</label>
            <input
              id="visit_history_search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Enter patient name"
            />

            <label htmlFor="visit_history_ward">Ward Preference:</label>
            <select
              id="visit_history_ward"
              value={filters.ward_preference}
              onChange={(e) => setFilters({ ...filters, ward_preference: e.target.value })}
            >
              <option value="">All</option>
              <option value="General">General</option>
              <option value="ICU">ICU</option>
              <option value="Private">Private</option>
            </select>

            <label htmlFor="visit_history_sort">Sort By:</label>
            <select
              id="visit_history_sort"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="visit_time_asc">Visit Time (Ascending)</option>
              <option value="visit_time_desc">Visit Time (Descending)</option>
            </select>

            <button type="submit">Filter</button>
          </form>

          {loading && <p className="muted">Loading visit history...</p>}
          {!loading && error && <p className="error">{error}</p>}

          {!loading && !error && (
            <div className="table-wrap">
              <table className="migrate-history-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Room Number</th>
                    <th>Ward Preference</th>
                    <th>Badge ID</th>
                    <th>Visit Time</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.length > 0 ? (
                    visits.map((visit, idx) => (
                      <tr key={`${visit.badge_id || idx}-${idx}`}>
                        <td>{visit.patient_name || '-'}</td>
                        <td>{visit.room_number || '-'}</td>
                        <td>{visit.ward_preference || '-'}</td>
                        <td>{visit.badge_id || '-'}</td>
                        <td>{visit.visit_time || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No visits found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminVisitHistoryPage;
