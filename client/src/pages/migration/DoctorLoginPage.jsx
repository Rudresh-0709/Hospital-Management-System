import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginDoctor } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

function DoctorLoginPage() {
  const navigate = useNavigate();
  const { refreshStatus } = useAuth();
  const [form, setForm] = useState({ doctor_name: '', doctor_password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const response = await loginDoctor(form);
    setLoading(false);

    if (!response.ok) {
      setError(response.data?.message || 'Login failed');
      return;
    }

    await refreshStatus();
    navigate('/doctor/dashboard');
  };

  return (
    <div className="migrate-ejs login-page doctor-login">
      <div className="page">
        <section className="section">
          <div className="heading">
            <h1 className="heading-title">Doctor Login</h1>
          </div>
          <div className="card">
            <h3 className="card-title">Login Details</h3>
            <form onSubmit={onSubmit}>
              <label className="field-label" htmlFor="doctor_name">Doctor name:</label>
              <input
                id="doctor_name"
                className="field"
                placeholder="Doctor name"
                value={form.doctor_name}
                onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
              />
              <label className="field-label" htmlFor="doctor_password">Password:</label>
              <input
                id="doctor_password"
                className="field"
                type="password"
                placeholder="Password"
                value={form.doctor_password}
                onChange={(e) => setForm({ ...form, doctor_password: e.target.value })}
              />
              {error && <div className="error">{error}</div>}
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            </form>
            <div className="nav-row">
              <Link to="/portal">Back to migration home</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DoctorLoginPage;


