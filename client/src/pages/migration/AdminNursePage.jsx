import { useEffect, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { addNurse, getAdminNurseFormData } from '../../services/adminApi';
import '../../styles/modern-form-migrate.css';

function AdminNursePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formMeta, setFormMeta] = useState({ shifts: [], roles: [] });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    specialization: '',
    shift: 'Morning',
    ward_assigned: '',
    role: 'Head Nurse',
  });

  useEffect(() => {
    async function load() {
      const response = await getAdminNurseFormData();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load form metadata');
        setLoading(false);
        return;
      }

      const shifts = response.data?.shifts || ['Morning', 'Evening', 'Night'];
      const roles = response.data?.roles || ['Head Nurse', 'Assistant Nurse', 'Trainee Nurse'];
      setFormMeta({ shifts, roles });
      setForm((prev) => ({ ...prev, shift: shifts[0] || prev.shift, role: roles[0] || prev.role }));
      setLoading(false);
    }

    load();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const response = await addNurse(form);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to add nurse');
      return;
    }

    setSuccess(response.data?.message || 'Nurse hired successfully');
    setForm((prev) => ({
      ...prev,
      name: '',
      email: '',
      phone_number: '',
      specialization: '',
      ward_assigned: '',
    }));
  };

  return (
    <AdminShell title="New Nurse">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Nurse Onboarding</h1>
              <p className="form-subtitle">Create a nurse profile and assign initial shift and ward.</p>
            </div>
          </div>

          {loading && <div className="form-alert info"><span className="form-alert-icon">i</span><span>Loading form...</span></div>}
          {!loading && error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}
          {!loading && success && <div className="form-alert success"><span className="form-alert-icon">OK</span><span>{success}</span></div>}

          {!loading && (
            <section className="form-section">
              <div className="form-section-header"><h3 className="form-section-title">Nurse Details</h3></div>
              <form onSubmit={onSubmit}>
                <div className="form-field-row">
                  <div>
                    <label className="form-label required" htmlFor="name">Full Name</label>
                    <input className="form-input" id="name" name="name" value={form.name} onChange={onChange} required />
                  </div>
                  <div>
                    <label className="form-label required" htmlFor="email">Email Address</label>
                    <input className="form-input" id="email" name="email" type="email" value={form.email} onChange={onChange} required />
                  </div>
                </div>

                <div className="form-field-row">
                  <div>
                    <label className="form-label required" htmlFor="phone_number">Phone Number</label>
                    <input className="form-input" id="phone_number" name="phone_number" value={form.phone_number} onChange={onChange} required />
                  </div>
                  <div>
                    <label className="form-label required" htmlFor="specialization">Specialization</label>
                    <input className="form-input" id="specialization" name="specialization" value={form.specialization} onChange={onChange} required />
                  </div>
                </div>

                <div className="form-field-row three">
                  <div>
                    <label className="form-label" htmlFor="shift">Shift</label>
                    <select className="form-select" id="shift" name="shift" value={form.shift} onChange={onChange}>
                      {formMeta.shifts.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="ward_assigned">Assigned Ward</label>
                    <input className="form-input" id="ward_assigned" name="ward_assigned" value={form.ward_assigned} onChange={onChange} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="role">Role</label>
                    <select className="form-select" id="role" name="role" value={form.role} onChange={onChange}>
                      {formMeta.roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-button-group right">
                  <button className="form-button secondary" type="button" onClick={() => setForm((prev) => ({ ...prev, name: '', email: '', phone_number: '', specialization: '', ward_assigned: '' }))}>Discard</button>
                  <button className="form-button success" type="submit">Hire Nurse</button>
                </div>
              </form>
            </section>
          )}
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Metadata</h3></div>
            <div className="form-tip-card"><strong>Available Shifts</strong><p>{formMeta.shifts.join(', ') || 'None'}</p></div>
            <div className="form-tip-card"><strong>Available Roles</strong><p>{formMeta.roles.join(', ') || 'None'}</p></div>
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Nurse</div>
            <div className="form-sidebar-item">Submission: Admin HR workflow</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminNursePage;
