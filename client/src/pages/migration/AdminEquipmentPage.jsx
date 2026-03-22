import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { addEquipment, getEquipmentOverview, updateEquipment } from '../../services/adminApi';
import '../../styles/equipment-ejs.css';

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
      <section className="card equipment-card">
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <div className="toolbar">
          <h3 className="card-title card-title-tight">Equipment List</h3>
          <input
            className="field field-tight"
            placeholder="Search equipment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p className="muted">Loading equipments...</p>}

        {!loading && (
          <div className="table-wrap">
            <table className="equipment-table">
              <thead>
                <tr>
                  <th>Equipment Name</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map((equipment, idx) => (
                  <tr key={`${equipment.equipment_name}-${idx}`}>
                    <td>{equipment.equipment_name}</td>
                    <td>{equipment.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredEquipments.length && <p className="muted mt-12">No matching equipment found.</p>}
          </div>
        )}
      </section>

      <section className="card equipment-form-card">
        <h3 className="card-title">Add New Equipment</h3>
        <form onSubmit={onAddEquipment}>
          <div className="split-grid">
            <div>
              <label className="field-label" htmlFor="add_equipment_name">Equipment Name</label>
              <input
                id="add_equipment_name"
                className="field"
                value={addForm.equipment_name}
                onChange={(e) => setAddForm({ ...addForm, equipment_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="add_equipment_count">Quantity</label>
              <input
                id="add_equipment_count"
                className="field"
                type="number"
                min={1}
                value={addForm.count}
                onChange={(e) => setAddForm({ ...addForm, count: Number(e.target.value) || 1 })}
                required
              />
            </div>
          </div>
          <button className="btn" type="submit" disabled={savingAdd}>{savingAdd ? 'Saving...' : 'Add Equipment'}</button>
        </form>
      </section>

      <section className="card equipment-form-card">
        <h3 className="card-title">Update Equipment</h3>
        <form onSubmit={onUpdateEquipment}>
          <div className="split-grid">
            <div>
              <label className="field-label" htmlFor="update_equipment_name">Equipment Name</label>
              <select
                id="update_equipment_name"
                className="field"
                value={updateForm.equipment_name}
                onChange={(e) => setUpdateForm({ ...updateForm, equipment_name: e.target.value })}
                required
              >
                {equipments.map((equipment, idx) => (
                  <option key={`${equipment.equipment_name}-select-${idx}`} value={equipment.equipment_name}>
                    {equipment.equipment_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="update_equipment_count">Quantity</label>
              <input
                id="update_equipment_count"
                className="field"
                type="number"
                min={1}
                value={updateForm.count}
                onChange={(e) => setUpdateForm({ ...updateForm, count: Number(e.target.value) || 1 })}
                required
              />
            </div>
          </div>
          <button className="btn" type="submit" disabled={savingUpdate}>{savingUpdate ? 'Saving...' : 'Update Equipment'}</button>
        </form>
      </section>
    </AdminShell>
  );
}

export default AdminEquipmentPage;
