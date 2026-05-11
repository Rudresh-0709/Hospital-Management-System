import { useEffect, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { getEquipmentOverview, updateEquipment } from '../../services/adminApi';
import Toast from '../../components/migration/Toast';
import '../../styles/modern-form-migrate.css';

function AdminUpdateEquipmentPage() {
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState([]);
  const [form, setForm] = useState({ equipment_name: '', count: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: '', text: '' });

  useEffect(() => {
    async function load() {
      const response = await getEquipmentOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load equipments');
        setLoading(false);
        return;
      }

      const list = response.data?.equipments || [];
      setEquipments(list);
      if (list.length > 0) {
        setForm({ equipment_name: list[0].equipment_name, count: 1 });
      }
      setLoading(false);
    }

    load();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setToast({ type: '', text: '' });

    const response = await updateEquipment(form);
    setSaving(false);

    if (!response.ok) {
      setToast({ type: 'error', text: response.data?.message || 'Failed to update equipment' });
      return;
    }

    setToast({ type: 'success', text: response.data?.message || 'Equipment updated successfully.' });
    setForm((prev) => ({ ...prev, count: 1 }));
  };

  return (
    <AdminShell title="Update Equipment">
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
              <h1 className="form-title">Update Equipment</h1>
              <p className="form-subtitle">Adjust quantity for an existing equipment record.</p>
            </div>
          </div>

          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading equipments...</span></div>}
          {!loading && error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}

          {!loading && (
            <section className="form-section">
              <div className="form-section-header"><h3 className="form-section-title">Inventory Adjustment</h3></div>
              <form onSubmit={onSubmit}>
                <div className="form-field-row">
                  <div>
                    <label className="form-label required" htmlFor="equipment_name">Equipment Name</label>
                    <select
                      id="equipment_name"
                      className="form-select"
                      value={form.equipment_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, equipment_name: e.target.value }))}
                      required
                    >
                      {equipments.map((equipment, idx) => (
                        <option key={`${equipment.equipment_name}-${idx}`} value={equipment.equipment_name}>
                          {equipment.equipment_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label required" htmlFor="count">Quantity</label>
                    <input
                      id="count"
                      className="form-input"
                      type="number"
                      min={1}
                      value={form.count}
                      onChange={(e) => setForm((prev) => ({ ...prev, count: Number(e.target.value) || 1 }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-button-group right">
                  <button className="form-button secondary" type="button" onClick={() => setForm((prev) => ({ ...prev, count: 1 }))}>Reset Count</button>
                  <button className="form-button primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Update Equipment'}</button>
                </div>
              </form>
            </section>
          )}
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Available Equipment</h3></div>
            {equipments.length > 0 ? equipments.slice(0, 12).map((item, idx) => (
              <div key={`${item.equipment_name}-${idx}`} className="form-tip-card">
                <strong>{item.equipment_name}</strong>
                <p>Current count in inventory list.</p>
              </div>
            )) : <div className="form-empty"><p>No equipment available.</p></div>}
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Inventory</div>
            <div className="form-sidebar-item">Records loaded: {equipments.length}</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminUpdateEquipmentPage;
