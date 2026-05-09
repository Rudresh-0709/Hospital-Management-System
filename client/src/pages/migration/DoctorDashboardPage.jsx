import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDoctorDashboardOverview } from '../../services/doctorApi';
import '../../styles/doctor-dashboard.css';

function DoctorDashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({
    doctordetails: null,
    patientdetails: [],
    appointments: [],
    nurses: [],
    notifications: [],
    chartLabels: [],
    chartData: [],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getDoctorDashboardOverview();
        if (!response.ok) {
          setError(response.data?.message || 'Failed to load doctor dashboard');
          setLoading(false);
          return;
        }
        setPayload({
          doctordetails: response.data.doctordetails || null,
          patientdetails: response.data.patientdetails || [],
          appointments: response.data.appointments || [],
          nurses: response.data.nurses || [],
          notifications: response.data.notifications || [],
          chartLabels: response.data.chartLabels || [],
          chartData: response.data.chartData || [],
        });
      } catch (err) {
        setError('Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) return <div style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: 40, color: '#ba1a1a', fontFamily: 'Inter, sans-serif' }}>{error}</div>;

  const { doctordetails, patientdetails, appointments, nurses, notifications } = payload;
  const availableNurses = nurses.filter(n => n.available === 1 || n.available === '1' || n.available === true);

  return (
    <div className="dd-root">
      <div className="dd-layout">

        {/* ===== SIDEBAR ===== */}
        <aside className="dd-sidebar">
          <div className="dd-sidebar-brand">
            <span className="material-symbols-outlined">medical_services</span>
            <div>
              <div className="dd-sidebar-brand-name">MedPulse</div>
              <div className="dd-sidebar-brand-sub">Medical Center</div>
            </div>
          </div>

          <nav className="dd-nav">
            <a className="dd-nav-link active" href="#">
              <span className="material-symbols-outlined">dashboard</span>
              <span>Dashboard</span>
            </a>
            <a className="dd-nav-link" href="#">
              <span className="material-symbols-outlined">group</span>
              <span>Patients</span>
            </a>
            <a className="dd-nav-link" href="#">
              <span className="material-symbols-outlined">calendar_today</span>
              <span>Schedule</span>
            </a>
            <a className="dd-nav-link" href="#">
              <span className="material-symbols-outlined">analytics</span>
              <span>Reports</span>
            </a>
            <a className="dd-nav-link" href="#">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </a>
          </nav>

          <div className="dd-sidebar-bottom">
            <button className="dd-btn-primary">New Appointment</button>
            <a className="dd-nav-link" href="#">
              <span className="material-symbols-outlined">help</span>
              <span>Help Center</span>
            </a>
            <button className="dd-nav-link" onClick={handleLogout} style={{ color: 'var(--error)' }}>
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <main className="dd-main">

          {/* Header */}
          <header className="dd-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div className="dd-search-wrap">
                <span className="material-symbols-outlined">search</span>
                <input className="dd-search-input" placeholder="Search patients, records..." type="text" />
              </div>
              <nav className="dd-header-nav">
                <a className="active" href="#">Overview</a>
                <a href="#">Emergency</a>
                <a href="#">On-Call</a>
              </nav>
            </div>
            <div className="dd-header-actions">
              <button className="dd-icon-btn">
                <span className="material-symbols-outlined">notifications</span>
                <span className="dd-notif-dot"></span>
              </button>
              <button className="dd-icon-btn">
                <span className="material-symbols-outlined">chat_bubble</span>
              </button>
              <div className="dd-divider"></div>
              <div className="dd-profile">
                <div className="dd-profile-info">
                  <p className="dd-profile-name">{doctordetails?.doctor_name || 'Doctor'}</p>
                  <p className="dd-profile-role">Physician</p>
                </div>
                <img
                  className="dd-profile-avatar"
                  alt="Doctor Profile"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHQm2skIv80uHa3o9ZsnBvEWrpfos8UkLM9VZNMomLq6lF2dZMIWXpKZlRycqFvYHvCEbdAxp4cTbKE7Np_wpZ0wFhhGVZ15saRnluhSKdk8tHpk3K1d6itGGkiwn4bmGaIxs-kqhr9OSOvy983SfRFAtCUTHnr4nx0QtfBQK4s7EOZIHbLekmovde4L-Izoeotiec5DFm8cGfiaLk2ORYGI4AWJkTiM5l_8Hye4GjwR3yDtURAB5G1ut8KkCXUXo3PU9B0O3h9Fs"
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="dd-content">

            {/* Hero / Welcome */}
            <section className="glass-card dd-hero">
              <div className="dd-hero-bg">
                <svg viewBox="0 0 100 100"><path d="M50 0 L100 50 L50 100 L0 50 Z" /></svg>
              </div>
              <div className="dd-hero-text">
                <h1 className="font-display">Good morning, {doctordetails?.doctor_name || 'Doctor'}.</h1>
                <p className="text-body-lg">
                  You have <span className="highlight">{appointments.length} appointments</span> scheduled for today.
                  Your first patient is arriving in 15 minutes.
                </p>
                <div className="dd-hero-actions">
                  <button className="dd-btn-filled">View Today's Schedule</button>
                  <button className="dd-btn-outline">Quick Summary</button>
                </div>
              </div>
              <div className="dd-hero-next" style={{ display: appointments.length > 0 ? 'flex' : 'none' }}>
                <span className="material-symbols-outlined">medical_information</span>
                <div>
                  <p className="dd-hero-next-label">Next Up</p>
                  <p className="dd-hero-next-name">
                    {appointments[0] ? `${appointments[0].appointee_name} — ${appointments[0].appointment_time}` : '—'}
                  </p>
                  <p className="dd-hero-next-detail">
                    {appointments[0]?.status || '—'}
                  </p>
                </div>
              </div>
            </section>

            {/* Metric Cards */}
            <section className="dd-metrics">
              <div className="glass-card dd-metric-card">
                <div>
                  <span className="material-symbols-outlined dd-metric-icon blue">groups</span>
                  <span className="dd-metric-badge blue">+4%</span>
                </div>
                <p className="dd-metric-label">Total Patients</p>
                <p className="dd-metric-value">{patientdetails.length}</p>
              </div>
              <div className="glass-card dd-metric-card">
                <div>
                  <span className="material-symbols-outlined dd-metric-icon green">calendar_month</span>
                  <span className="dd-metric-badge green">Today</span>
                </div>
                <p className="dd-metric-label">Appointments</p>
                <p className="dd-metric-value">{appointments.length}</p>
              </div>
              <div className="glass-card dd-metric-card">
                <div>
                  <span className="material-symbols-outlined dd-metric-icon emerald">volunteer_activism</span>
                  <span className="dd-metric-badge emerald">82%</span>
                </div>
                <p className="dd-metric-label">Healed Patients</p>
                <p className="dd-metric-value">10</p>
              </div>
              <div className="glass-card dd-metric-card">
                <div>
                  <span className="material-symbols-outlined dd-metric-icon teal">personal_injury</span>
                  <span className="dd-metric-badge teal">Active</span>
                </div>
                <p className="dd-metric-label">Surgeries</p>
                <p className="dd-metric-value">2</p>
              </div>
            </section>

            {/* Chart + Urgent Updates */}
            <section className="dd-chart-updates">
              <div className="glass-card dd-chart-card">
                <div className="dd-chart-header">
                  <div>
                    <h3 className="dd-chart-title font-display">Admission Trends</h3>
                    <p className="dd-chart-subtitle">Weekly intake overview</p>
                  </div>
                  <select className="dd-chart-select">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>
                <div className="dd-chart-area">
                  <svg preserveAspectRatio="none" viewBox="0 0 1000 300">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#b0f0d6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#b0f0d6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,250 Q150,200 300,230 T600,100 T1000,150 L1000,300 L0,300 Z" fill="url(#chartGradient)" />
                    <path className="chart-curve" d="M0,250 Q150,200 300,230 T600,100 T1000,150" fill="none" stroke="#006c49" strokeLinecap="round" strokeWidth="4" />
                  </svg>
                  <div className="dd-chart-labels">
                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                  </div>
                </div>
              </div>

              <div className="glass-card dd-updates-card">
                <div className="dd-updates-header">
                  <h3 className="dd-chart-title font-display">Urgent Updates</h3>
                  <span className="dd-live-badge">LIVE</span>
                </div>
                {notifications.length > 0 ? notifications.slice(0, 3).map((notif, idx) => (
                  <div key={idx} className="dd-update-item default">
                    <span className="material-symbols-outlined">notifications</span>
                    <div>
                      <p className="dd-update-title">{notif.type || 'Update'}</p>
                      <p className="dd-update-desc">{notif.message}</p>
                      <p className="dd-update-time">{notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Just now'}</p>
                    </div>
                  </div>
                )) : <p style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>No recent updates.</p>}
                <button className="dd-btn-text">See all activity</button>
              </div>
            </section>

            {/* Patients + Nurses */}
            <section className="dd-bottom-grid">
              <div className="glass-card">
                <div className="dd-section-header">
                  <h3 className="dd-section-title font-display">Recent Patients</h3>
                  <button className="dd-link-btn">View All</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="dd-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>ID / Gender</th>
                        <th>Room</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientdetails.length > 0 ? patientdetails.slice(-5).reverse().map((patient, idx) => (
                        <tr key={idx}>
                          <td className="name">{patient.first_name} {patient.last_name}</td>
                          <td className="muted">#{patient.patient_id} / {patient.gender}</td>
                          <td>{patient.room_number || '—'}</td>
                          <td>
                            <span className="dd-status-badge stable">
                              {patient.reason_for_admission || 'ADMITTED'}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>No recent patients</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card">
                <div className="dd-section-header">
                  <h3 className="dd-section-title font-display">Available Nurses</h3>
                  <button className="dd-link-btn">Shift Roster</button>
                </div>
                <div className="dd-nurse-grid">
                  {availableNurses.slice(0, 4).map((nurse, idx) => (
                    <div key={idx} className="dd-nurse-card">
                      <span className="material-symbols-outlined dd-nurse-icon">medical_services</span>
                      <div>
                        <p className="dd-nurse-name">{nurse.name}</p>
                        <div className="dd-nurse-status">
                          <span className="dd-status-dot available"></span>
                          <span className="dd-nurse-shift">{nurse.shift} Shift</span>
                        </div>
                      </div>
                      <button className="dd-nurse-action">
                        <span className="material-symbols-outlined">chat</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

export default DoctorDashboardPage;
