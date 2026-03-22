import { useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { createStaff } from '../../services/adminApi';

const initialForm = {
  staff_first_name: '',
  staff_last_name: '',
  role: '',
  department: '',
  contact_number: '',
  email: '',
  hire_date: '',
  address: '',
  shift: '',
};

function AdminNewStaffPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const response = await createStaff(form);
    setSubmitting(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to add staff member');
      return;
    }

    setSuccess(response.data?.message || 'Staff member added successfully.');
    setForm(initialForm);
  };

  return (
    <AdminShell title="Add Staff Member">
      <section className="card">
        <h3 className="card-title">Staff Details</h3>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <form onSubmit={onSubmit}>
          <div className="split-grid">
            <div>
              <label className="field-label" htmlFor="staff_first_name">First Name:</label>
              <input
                id="staff_first_name"
                className="field"
                value={form.staff_first_name}
                onChange={(e) => setForm({ ...form, staff_first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="staff_last_name">Last Name:</label>
              <input
                id="staff_last_name"
                className="field"
                value={form.staff_last_name}
                onChange={(e) => setForm({ ...form, staff_last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <label className="field-label" htmlFor="staff_role">Role:</label>
          <input
            id="staff_role"
            className="field"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
          />

          <label className="field-label" htmlFor="staff_department">Department:</label>
          <input
            id="staff_department"
            className="field"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />

          <label className="field-label" htmlFor="staff_contact_number">Contact Number:</label>
          <input
            id="staff_contact_number"
            className="field"
            value={form.contact_number}
            onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
          />

          <label className="field-label" htmlFor="staff_email">Email:</label>
          <input
            id="staff_email"
            className="field"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label className="field-label" htmlFor="staff_hire_date">Hire Date:</label>
          <input
            id="staff_hire_date"
            className="field"
            type="date"
            value={form.hire_date}
            onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
          />

          <label className="field-label" htmlFor="staff_address">Address:</label>
          <textarea
            id="staff_address"
            className="field"
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <label className="field-label" htmlFor="staff_shift">Shift:</label>
          <input
            id="staff_shift"
            className="field"
            value={form.shift}
            onChange={(e) => setForm({ ...form, shift: e.target.value })}
          />

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Add Staff'}
          </button>
        </form>
      </section>
    </AdminShell>
  );
}

export default AdminNewStaffPage;
