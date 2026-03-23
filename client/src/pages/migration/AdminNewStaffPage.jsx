import { useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { createStaff } from '../../services/adminApi';
import '../../styles/modern-form-migrate.css';

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
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Staff Onboarding</h1>
              <p className="form-subtitle">Register a new staff profile and assign operational details.</p>
            </div>
          </div>

          {error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}
          {success && <div className="form-alert success"><span className="form-alert-icon">OK</span><span>{success}</span></div>}

          <section className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">Staff Details</h3>
            </div>

            <form onSubmit={onSubmit}>
              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="staff_first_name">First Name</label>
                  <input id="staff_first_name" className="form-input" value={form.staff_first_name} onChange={(e) => setForm({ ...form, staff_first_name: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label required" htmlFor="staff_last_name">Last Name</label>
                  <input id="staff_last_name" className="form-input" value={form.staff_last_name} onChange={(e) => setForm({ ...form, staff_last_name: e.target.value })} required />
                </div>
              </div>

              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="staff_role">Role</label>
                  <input id="staff_role" className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="staff_department">Department</label>
                  <input id="staff_department" className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>

              <div className="form-field-row three">
                <div>
                  <label className="form-label" htmlFor="staff_contact_number">Contact Number</label>
                  <input id="staff_contact_number" className="form-input" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" htmlFor="staff_email">Email</label>
                  <input id="staff_email" className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" htmlFor="staff_hire_date">Hire Date</label>
                  <input id="staff_hire_date" className="form-input" type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
                </div>
              </div>

              <div className="form-field-row">
                <div>
                  <label className="form-label" htmlFor="staff_shift">Shift</label>
                  <input id="staff_shift" className="form-input" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} />
                </div>
                <div>
                  <label className="form-label" htmlFor="staff_address">Address</label>
                  <textarea id="staff_address" className="form-textarea" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>

              <div className="form-button-group right">
                <button className="form-button secondary" type="button" onClick={() => setForm(initialForm)}>Discard</button>
                <button className="form-button success" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Staff'}</button>
              </div>
            </form>
          </section>
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">Guidance</h3>
            </div>
            <div className="form-tip-card"><strong>Role Mapping</strong><p>Ensure role and department align with roster policy.</p></div>
            <div className="form-tip-card"><strong>Contact Data</strong><p>Prefer official work email and verified phone numbers.</p></div>
            <div className="form-tip-card"><strong>Shift Planning</strong><p>Set shift values consistent with scheduling standards.</p></div>
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Staff</div>
            <div className="form-sidebar-item">Scope: Admin onboarding</div>
            <div className="form-sidebar-item">Record type: Workforce profile</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminNewStaffPage;
