import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

function AdminLoginPage() {
  const navigate = useNavigate();
  const { refreshStatus } = useAuth();
  const [form, setForm] = useState({ admin_name: '', admin_password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const response = await loginAdmin(form);
    setLoading(false);

    if (!response.ok) {
      setError(response.data?.message || 'Login failed');
      return;
    }

    await refreshStatus();
    navigate('/migrate/admin/dashboard');
  };

  return (
    <div className="migrate-ejs login-page admin-login">
      <div className="page">
        <section className="section">
          <div className="heading">
            <h1 className="heading-title">Admin Login</h1>
          </div>
          <div className="card">
            <h3 className="card-title">Login Details</h3>
            <form onSubmit={onSubmit}>
              <label className="field-label" htmlFor="admin_name">Admin name:</label>
              <input
                id="admin_name"
                className="field"
                placeholder="Admin name"
                value={form.admin_name}
                onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
              />
              <label className="field-label" htmlFor="admin_password">Password:</label>
              <input
                id="admin_password"
                className="field"
                type="password"
                placeholder="Password"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
              />
              {error && <div className="error">{error}</div>}
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            </form>
            <div className="nav-row">
              <Link to="/migrate">Back to migration home</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminLoginPage;
