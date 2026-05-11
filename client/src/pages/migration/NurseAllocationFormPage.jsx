import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/migration/AdminShell';
import { assignNurse, getAvailableNurses } from '../../services/adminApi';
import Toast from '../../components/migration/Toast';
import '../../styles/modern-form-migrate.css';

function NurseAllocationFormPage() {
  const [searchParams] = useSearchParams();
  const admit_id = searchParams.get('admit_id') || '';
  const [loading, setLoading] = useState(true);
  const [nurses, setNurses] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: '', text: '' });

  useEffect(() => {
    async function load() {
      if (!admit_id) {
        setError('admit_id is required in query string');
        setLoading(false);
        return;
      }

      const response = await getAvailableNurses(admit_id);
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load nurses');
        setLoading(false);
        return;
      }

      setNurses(response.data?.nurses || []);
      setLoading(false);
    }

    load();
  }, [admit_id]);

  const onAllocate = async (nurseid) => {
    setError('');
    setToast({ type: '', text: '' });
    const response = await assignNurse({ admit_id, nurseid });
    if (!response.ok) {
      setToast({ type: 'error', text: response.data?.message || 'Failed to allocate nurse' });
      return;
    }

    setToast({ type: 'success', text: response.data?.message || 'Nurse allocated successfully' });
    setNurses((prev) => prev.filter((nurse) => String(nurse.nurse_id) !== String(nurseid)));
  };

  return (
    <AdminShell title="Nurse Allocation Form">
      {toast.text && (
        <Toast
          type={toast.type}
          message={toast.text}
          onClose={() => setToast({ type: '', text: '' })}
        />
      )}
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Nurse Allocation</h1>
              <p className="form-subtitle">Assign an available nurse to the selected admission.</p>
            </div>
          </div>

          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading nurses...</span></div>}
          {!loading && error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}

          {!loading && (
            <section className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">Available Nurses {admit_id ? `(Admit ID: ${admit_id})` : ''}</h3>
              </div>
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
                        <td>{nurse.name}</td>
                        <td>{nurse.specialization}</td>
                        <td>{nurse.shift}</td>
                        <td>{nurse.role}</td>
                        <td>{nurse.remarks}</td>
                        <td><button className="form-button primary" type="button" onClick={() => onAllocate(nurse.nurse_id)}>Allocate</button></td>
                      </tr>
                    )) : <tr><td colSpan={6}>No nurses available at this moment.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Allocation Notes</h3></div>
            <div className="form-tip-card"><strong>Context</strong><p>Allocate based on specialization and shift fit.</p></div>
            <div className="form-tip-card"><strong>Tracking</strong><p>Allocated nurses are removed from this list immediately.</p></div>
          </section>
        </aside>
        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Current List</div>
            <div className="form-sidebar-item">Nurses available: {nurses.length}</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default NurseAllocationFormPage;
