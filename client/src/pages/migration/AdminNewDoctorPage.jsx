import { useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { createDoctor } from '../../services/adminApi';

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
      <section className="card">
        <h3 className="card-title">Doctor Details</h3>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <form onSubmit={onSubmit}>
          <label className="field-label" htmlFor="doctor_name">Doctor Name:</label>
          <input
            id="doctor_name"
            className="field"
            value={form.doctor_name}
            onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
            required
          />

          <label className="field-label" htmlFor="doctor_speciality">Speciality:</label>
          <input
            id="doctor_speciality"
            className="field"
            value={form.speciality}
            onChange={(e) => setForm({ ...form, speciality: e.target.value })}
            required
          />

          <div className="split-grid">
            <div>
              <label className="field-label" htmlFor="doctor_in">Check-In Time:</label>
              <input
                id="doctor_in"
                className="field"
                type="time"
                value={form.doctor_in}
                onChange={(e) => setForm({ ...form, doctor_in: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="doctor_out">Check-Out Time:</label>
              <input
                id="doctor_out"
                className="field"
                type="time"
                value={form.doctor_out}
                onChange={(e) => setForm({ ...form, doctor_out: e.target.value })}
                required
              />
            </div>
          </div>

          <label className="field-label" htmlFor="doctor_password">Doctor Password:</label>
          <input
            id="doctor_password"
            className="field"
            type="password"
            value={form.doctor_password}
            onChange={(e) => setForm({ ...form, doctor_password: e.target.value })}
            required
          />

          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'New Doctor'}
          </button>
        </form>
      </section>
    </AdminShell>
  );
}

export default AdminNewDoctorPage;
