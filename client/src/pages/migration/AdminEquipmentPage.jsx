import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { addEquipment, getEquipmentOverview, updateEquipment } from '../../services/adminApi';
import '../../styles/modern-form-migrate.css';

function AdminEquipmentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [equipments, setEquipments] = useState([]);
  const [search, setSearch] = useState('');

  const [addForm, setAddForm] = useState({ equipment_name: '', count: 1 });
  const [updateForm, setUpdateForm] = useState({ equipment_name: '', count: 1 });
  const [savingAdd, setSavingAdd] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);

  const loadEquipments = async () => {
    setLoading(true);
    setError('');

    const response = await getEquipmentOverview();
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load equipments');
      setEquipments([]);
      setLoading(false);
      return;
    }

    const nextEquipments = response.data.equipments || [];
    setEquipments(nextEquipments);
    if (nextEquipments.length > 0 && !updateForm.equipment_name) {
      setUpdateForm((prev) => ({ ...prev, equipment_name: nextEquipments[0].equipment_name }));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEquipments();
  }, []);

  const filteredEquipments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return equipments;
    return equipments.filter((eq) => String(eq.equipment_name || '').toLowerCase().includes(term));
  }, [equipments, search]);

  const totalCount = useMemo(() => equipments.reduce((sum, eq) => sum + (eq.count || 0), 0), [equipments]);

  const onAddEquipment = async (event) => {
    event.preventDefault();
    setSavingAdd(true);
    setError('');
    setSuccess('');

    const response = await addEquipment(addForm);
    setSavingAdd(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to add equipment');
      return;
    }

    setSuccess(response.data?.message || 'Equipment added successfully.');
    setAddForm({ equipment_name: '', count: 1 });
    await loadEquipments();
  };

  const onUpdateEquipment = async (event) => {
    event.preventDefault();
    setSavingUpdate(true);
    setError('');
    setSuccess('');

    const response = await updateEquipment(updateForm);
    setSavingUpdate(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to update equipment');
      return;
    }

    setSuccess(response.data?.message || 'Equipment updated successfully.');
    await loadEquipments();
  };

  return (
    <AdminShell title="Hospital Equipments">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Equipment Overview</h1>
              <p className="form-subtitle">Manage hospital equipment inventory — add new items or update existing counts.</p>
            </div>
          </div>

          {error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}
          {success && <div className="form-alert success"><span className="form-alert-icon">✓</span><span>{success}</span></div>}
          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading equipment data...</span></div>}

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Add New Equipment</h3></div>
            <form onSubmit={onAddEquipment}>
              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="add_equipment_name">Equipment Name</label>
                  <input id="add_equipment_name" className="form-input" placeholder="e.g. Ventilator" value={addForm.equipment_name} onChange={(e) => setAddForm({ ...addForm, equipment_name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label required" htmlFor="add_equipment_count">Quantity</label>
                  <input id="add_equipment_count" className="form-input" type="number" min={1} value={addForm.count} onChange={(e) => setAddForm({ ...addForm, count: Number(e.target.value) || 1 })} required />
                </div>
              </div>
              <div className="form-button-group right">
                <button className="form-button success" type="submit" disabled={savingAdd}>{savingAdd ? 'Adding...' : 'Add Equipment'}</button>
              </div>
            </form>
          </section>

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Update Equipment Count</h3></div>
            <form onSubmit={onUpdateEquipment}>
              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="update_equipment_name">Select Equipment</label>
                  <select id="update_equipment_name" className="form-select" value={updateForm.equipment_name} onChange={(e) => setUpdateForm({ ...updateForm, equipment_name: e.target.value })} required>
                    {equipments.map((eq, idx) => (
                      <option key={`${eq.equipment_name}-${idx}`} value={eq.equipment_name}>{eq.equipment_name} (current: {eq.count})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label required" htmlFor="update_equipment_count">New Quantity</label>
                  <input id="update_equipment_count" className="form-input" type="number" min={1} value={updateForm.count} onChange={(e) => setUpdateForm({ ...updateForm, count: Number(e.target.value) || 1 })} required />
                </div>
              </div>
              <div className="form-button-group right">
                <button className="form-button primary" type="submit" disabled={savingUpdate}>{savingUpdate ? 'Updating...' : 'Update Equipment'}</button>
              </div>
            </form>
          </section>
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Inventory Stats</h3></div>
            <div className="form-summary-grid">
              <div className="form-summary-card"><div className="form-summary-label">Types</div><div className="form-summary-value">{equipments.length}</div></div>
              <div className="form-summary-card secondary"><div className="form-summary-label">Total Units</div><div className="form-summary-value">{totalCount}</div></div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Equipment List</h3></div>
            <input
              className="form-input"
              placeholder="Search equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {!loading && (
              <div style={{ overflowY: 'auto', marginTop: '12px', maxHeight: '400px' }}>
                <table className="form-table">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipments.map((eq, idx) => (
                      <tr key={`${eq.equipment_name}-${idx}`}>
                        <td style={{ fontWeight: 600 }}>{eq.equipment_name}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 700,
                            background: eq.count > 20 ? '#d1fae5' : eq.count > 5 ? '#fef3c7' : '#fee2e2',
                            color: eq.count > 20 ? '#0ea05e' : eq.count > 5 ? '#f59e0b' : '#dc2626',
                          }}>
                            {eq.count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredEquipments.length && <p className="muted" style={{ marginTop: 12, textAlign: 'center' }}>No matching equipment.</p>}
              </div>
            )}
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Equipment</div>
            <div className="form-sidebar-item">🩺 Add new items</div>
            <div className="form-sidebar-item">🔄 Update counts</div>
            <div className="form-sidebar-item">📦 Track inventory</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminEquipmentPage;
