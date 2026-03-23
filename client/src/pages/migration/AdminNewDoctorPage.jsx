import { useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { createDoctor } from '../../services/adminApi';
import '../../styles/modern-form-migrate.css';

const initialForm = {
  doctor_name: '',
  speciality: '',
  doctor_in: '',
  doctor_out: '',
  doctor_password: '',
};

function AdminNewDoctorPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const response = await createDoctor(form);
    setSubmitting(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to add doctor');
      return;
    }

    setSuccess(response.data?.message || 'Doctor added successfully.');
    setForm(initialForm);
  };

  return (
    <AdminShell title="New Doctor">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">Doctor Onboarding</h1>
              <p className="form-subtitle">Create a doctor profile with schedule and credentials.</p>
            </div>
          </div>

          {error && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{error}</span></div>}
          {success && <div className="form-alert success"><span className="form-alert-icon">OK</span><span>{success}</span></div>}

          <section className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">Professional Details</h3>
            </div>

            <form onSubmit={onSubmit}>
              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="doctor_name">Doctor Name</label>
                  <input
                    id="doctor_name"
                    className="form-input"
                    value={form.doctor_name}
                    onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label required" htmlFor="doctor_speciality">Speciality</label>
                  <input
                    id="doctor_speciality"
                    className="form-input"
                    value={form.speciality}
                    onChange={(e) => setForm({ ...form, speciality: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-field-row">
                <div>
                  <label className="form-label required" htmlFor="doctor_in">Check-In Time</label>
                  <input
                    id="doctor_in"
                    className="form-input"
                    type="time"
                    value={form.doctor_in}
                    onChange={(e) => setForm({ ...form, doctor_in: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label required" htmlFor="doctor_out">Check-Out Time</label>
                  <input
                    id="doctor_out"
                    className="form-input"
                    type="time"
                    value={form.doctor_out}
                    onChange={(e) => setForm({ ...form, doctor_out: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-field-row full">
                <div>
                  <label className="form-label required" htmlFor="doctor_password">Doctor Password</label>
                  <input
                    id="doctor_password"
                    className="form-input"
                    type="password"
                    value={form.doctor_password}
                    onChange={(e) => setForm({ ...form, doctor_password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-button-group right">
                <button className="form-button secondary" type="button" onClick={() => setForm(initialForm)}>Discard</button>
                <button className="form-button success" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">Onboarding Checklist</h3>
            </div>
            <div className="form-tip-card"><strong>Identity</strong><p>Verify doctor name and license externally.</p></div>
            <div className="form-tip-card"><strong>Schedule</strong><p>Validate check-in and check-out consistency.</p></div>
            <div className="form-tip-card"><strong>Security</strong><p>Set temporary password and force reset at first login.</p></div>
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">Doctor</div>
            <div className="form-sidebar-item">Profile type: Staff clinician</div>
            <div className="form-sidebar-item">System: Admin registration</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminNewDoctorPage;
