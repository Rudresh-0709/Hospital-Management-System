import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginPatient } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';
import '../../styles/patient-login-ejs.css';

function PatientLoginPage() {
  const navigate = useNavigate();
  const { refreshStatus } = useAuth();
  const [form, setForm] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const response = await loginPatient(form);
    setLoading(false);

    if (!response.ok) {
      setError(response.data?.message || 'Login failed');
      return;
    }

    await refreshStatus();
    navigate('/migrate/patient/dashboard');
  };

  return (
    <div className="migrate-patient-login">
      <div className="shape shape-1" />
      <div className="shape shape-2" />
      <div className="main-container">
        <div className="image-section">
          <img
            src="/png/patientpng/medical_login_illustration.png"
            alt="Medical illustration"
            className="illustration"
          />
        </div>
        <div className="form-section">
          <div className="form-content">
            <div className="header">
              <h2>Welcome Back</h2>
              <p>Please enter your details to access your portal</p>
            </div>

            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="patient_name">Patient Name</label>
                <input
                  id="patient_name"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="patient_password">Password</label>
                <input
                  id="patient_password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {error && (
                <div className="alert alert-danger">
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="aux-links">
              <Link to="/migrate">Back to migration home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientLoginPage;
