import { useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { addEquipment } from '../../services/adminApi';
import '../../styles/modern-form-migrate.css';

function AdminNewEquipmentPage() {
  const [form, setForm] = useState({ equipment_name: '', count: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const response = await addEquipment(form);
    setSaving(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to add equipment');
      return;
    }

    setSuccess(response.data?.message || 'Equipment added successfully.');
    setForm({ equipment_name: '', count: 1 });
  };

  return (
    <AdminShell title="Add New Equipment">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Add Equipment</h1>
              <p className="form-subtitle">Register a new equipment type and initial stock quantity.</p>
            </div>
          </div>

          {error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}
          {success && <div className="form-alert success"><span className="form-alert-icon">OK</span><span>{success}</span></div>}

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Equipment Record</h3></div>
            <form onSubmit={onSubmit}>
              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="equipment_name">Equipment Name</label>
                  <input
                    id="equipment_name"
                    className="form-input"
                    value={form.equipment_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, equipment_name: e.target.value }))}
                    required
                  />
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
                <button className="form-button secondary" type="button" onClick={() => setForm({ equipment_name: '', count: 1 })}>Discard</button>
                <button className="form-button success" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Equipment'}</button>
              </div>
            </form>
          </section>
        </div>
        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Notes</h3></div>
            <div className="form-tip-card"><strong>Naming</strong><p>Use standardized equipment names for inventory search.</p></div>
            <div className="form-tip-card"><strong>Count</strong><p>Enter only currently available stock in storage.</p></div>
          </section>
        </aside>
        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Equipment</div>
            <div className="form-sidebar-item">Action: Create inventory record</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminNewEquipmentPage;
