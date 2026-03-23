import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookAppointment, getAppointmentFormData } from '../../services/appointmentApi';

function AppointmentBookPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    appointee_name: '',
    appointee_email: '',
    doctor_name: '',
    appointee_contact: '',
    appointment_date: '',
    appointment_time: '',
    purpose: '',
  });

  useEffect(() => {
    async function load() {
      const response = await getAppointmentFormData();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load doctors');
        setLoading(false);
        return;
      }

      const doctorList = response.data?.doctors || [];
      setDoctors(doctorList);
      if (doctorList.length) {
        setForm((prev) => ({ ...prev, doctor_name: doctorList[0].doctor_name }));
      }
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
    const response = await bookAppointment(form);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to submit appointment');
      return;
    }

    setSuccess(response.data?.message || 'Appointment request submitted successfully');
    setForm((prev) => ({
      ...prev,
      appointee_name: '',
      appointee_email: '',
      appointee_contact: '',
      appointment_date: '',
      appointment_time: '',
      purpose: '',
    }));
  };

  return (
    <div className="migrate-ejs">
      <div className="page">
        <section className="section">
          <div className="heading">
            <h1 className="heading-title">Book Appointment</h1>
          </div>
          <div className="card" style={{ marginTop: 8 }}>
            <div className="nav-row">
              <Link to="/">Home</Link>
              <a href="/appointmentbook">Legacy Appointment Book (EJS)</a>
            </div>
          </div>

          <section className="card">
            <h3 className="card-title">Appointment Details</h3>
            {loading && <p className="muted">Loading form...</p>}
            {!loading && error && <p className="error">{error}</p>}
            {!loading && success && <p className="success">{success}</p>}

            {!loading && (
              <form onSubmit={onSubmit}>
                <label className="field-label" htmlFor="appointee_name">Patient Name</label>
                <input className="field" id="appointee_name" name="appointee_name" value={form.appointee_name} onChange={onChange} required />

                <label className="field-label" htmlFor="appointee_email">Patient Email Address</label>
                <input className="field" id="appointee_email" name="appointee_email" type="email" value={form.appointee_email} onChange={onChange} required />

                <label className="field-label" htmlFor="doctor_name">Doctor Assigned</label>
                <select id="doctor_name" name="doctor_name" value={form.doctor_name} onChange={onChange} required>
                  {doctors.length > 0 ? doctors.map((doctor) => (
                    <option key={doctor.doctor_id} value={doctor.doctor_name}>{doctor.doctor_name}</option>
                  )) : <option value="">No doctors available</option>}
                </select>

                <label className="field-label" htmlFor="appointee_contact">Contact Number</label>
                <input className="field" id="appointee_contact" name="appointee_contact" value={form.appointee_contact} onChange={onChange} required />

                <label className="field-label" htmlFor="appointment_date">Appointment Date</label>
                <input className="field" id="appointment_date" name="appointment_date" type="date" value={form.appointment_date} onChange={onChange} required />

                <label className="field-label" htmlFor="appointment_time">Appointment Time</label>
                <input className="field" id="appointment_time" name="appointment_time" type="time" value={form.appointment_time} onChange={onChange} required />

                <label className="field-label" htmlFor="purpose">Purpose of Visit</label>
                <textarea id="purpose" name="purpose" rows={3} value={form.purpose} onChange={onChange} required />

                <button className="btn" type="submit">Schedule Appointment</button>
              </form>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}

export default AppointmentBookPage;
