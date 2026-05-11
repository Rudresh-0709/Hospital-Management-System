import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminAnalytics } from '../../services/adminApi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import '../../styles/admin-dashboard-ejs.css';

const sidebarItems = [
  { label: 'Command Center', href: '/admin/dashboard', active: true },
  { label: 'Patient Registry', href: '/admin/patients' },
  { label: 'Staff Directory', href: '/admin/newstaff' },
  { label: 'Inventory', href: '/admin/equipment' },
  { label: 'Pharmacy', href: '/admin/pharmacy' },
  { label: 'Admin AI', href: '/admin/ai' }
];

const adminModules = [
  {
    title: 'New Patient',
    description: 'Initialize intake protocols and digital health record synchronization.',
    href: '/admin/patients',
    tag: 'Patients'
  },
  {
    title: 'Admit Patient',
    description: 'Assign ward, bed, and attending clinical staff members.',
    href: '/admin/admit',
    tag: 'Inpatient'
  },
  {
    title: 'Discharge Patient',
    description: 'Finalize billing, pharmacy handovers, and discharge summaries.',
    href: '/admin/discharge',
    tag: 'Inpatient'
  },
  {
    title: 'Patient History',
    description: 'Timeline view of diagnostics, treatments, and interventions.',
    href: '/admin/patienthistory',
    tag: 'Patients'
  },
  {
    title: 'Add Visitor',
    description: 'Register facility access for temporary visitor authorization.',
    href: '/admin/newvisitor',
    tag: 'Visitors'
  },
  {
    title: 'Visitor List',
    description: 'Real-time log of all non-staff personnel within the north wing.',
    href: '/admin/visit-history',
    tag: 'Visitors'
  },
  {
    title: 'New Doctor',
    description: 'Credentialing and access provisioning for medical professionals.',
    href: '/admin/newdoctor',
    tag: 'Staff'
  },
  {
    title: 'New Staff',
    description: 'Onboard nursing, technical, and administrative sanctuary personnel.',
    href: '/admin/newstaff',
    tag: 'Staff'
  },
  {
    title: 'Inventory',
    description: 'Supply chain oversight for medical equipment and surgical consumables.',
    href: '/admin/equipment',
    tag: 'Reports'
  },
  {
    title: 'Visit QR',
    description: 'Generate encrypted gate-pass codes for scheduled visitor sessions.',
    href: '/admin/visitqr',
    tag: 'Visitors'
  },
  {
    title: 'Visit History',
    description: 'Audit trail of facility access events and security timestamps.',
    href: '/admin/visit-history',
    tag: 'Visitors'
  },
  {
    title: 'Pharmacy (Legacy)',
    description: 'Read-only access to archived prescription records.',
    href: '/admin/pharmacy',
    tag: 'Legacy'
  }
];

const PIE_COLORS = ['#0d8a72', '#e74c3c'];
const BAR_COLORS = ['#0d8a72', '#14a38b', '#1abc9c', '#26d4a5', '#41e8b7', '#72f0cb', '#a3f7dd'];

function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminAnalytics();
        if (res.ok) setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    })();
  }, []);

  const bedOccupancyData = analytics ? [
    { name: 'Available', value: analytics.availableRooms || 0 },
    { name: 'Occupied', value: analytics.occupiedRooms || 0 },
  ] : [];

  const specialityData = analytics?.doctorsBySpeciality?.map(d => ({
    name: d.speciality || 'General',
    count: d.count,
  })) || [];

  const equipmentData = analytics?.equipmentItems?.map(e => ({
    name: e.equipment_name,
    count: e.count,
  })) || [];

  const admissionsData = analytics?.recentAdmissions?.map(a => ({
    date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    admissions: a.count,
  })) || [];

  return (
    <div className="migrate-admin-dashboard sanctuary-layout">
      <aside className="sanctuary-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">+</div>
          <div>
            <h1>Sanctuary Health</h1>
            <p>North Wing Admin</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Admin modules">
          {sidebarItems.map((item) => (
            <a href={item.href} className={item.active ? 'active' : ''} key={item.label}>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-cta">
          <a href="/admin/admit">+ Admit Patient</a>
        </div>

        <div className="sidebar-footer">
          <Link to="/portal">System Status</Link>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="sanctuary-main">
        <header className="admin-topbar">
          <div className="topbar-title">
            <p>Clinical</p>
            <h2>Sanctuary</h2>
          </div>

          <div className="topbar-search">
            <input type="text" placeholder="Search Command Center..." aria-label="Search command center" />
          </div>

          <div className="topbar-actions">
            <button type="button" className="alert-btn">Emergency Alert</button>
            <div className="admin-chip">
              <div>
                <strong>{user?.name || 'Admin User'}</strong>
                <span>{user?.role || 'Medical Officer'}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="admin-dashboard-hero">
          <p className="hero-kicker">Hospital Command Center</p>
          <h3>Mastering Clinical Operational Excellence.</h3>
          <p className="hero-subtitle">
            Manage patients, staff, visitors, and facility operations in one unified,
            high-performance ecosystem designed for modern healthcare operations.
          </p>

          <div className="hero-stats">
            <div className="hero-stat-card">
              <span className="stat-value">12</span>
              <span className="stat-label">Core Workflows</span>
            </div>
            <div className="hero-stat-card">
              <span className="stat-value">4</span>
              <span className="stat-label">Operational Domains</span>
            </div>
            <div className="hero-stat-card">
              <span className="stat-value">1</span>
              <span className="stat-label">Unified Dashboard</span>
            </div>
          </div>
        </section>

        {/* ═══════════ ANALYTICS PANEL ═══════════ */}
        <section className="analytics-panel">
          <div className="analytics-panel-header">
            <h4>Live Analytics</h4>
            <span className="analytics-live-badge">● Live</span>
          </div>

          {analyticsLoading ? (
            <div className="analytics-loading">Loading analytics data...</div>
          ) : !analytics ? (
            <div className="analytics-loading">Unable to load analytics.</div>
          ) : (
            <>
              {/* ── Stat Cards ── */}
              <div className="analytics-stat-cards">
                <div className="a-stat-card a-stat-patients">
                  <div className="a-stat-icon">👥</div>
                  <div className="a-stat-info">
                    <span className="a-stat-value">{analytics.totalPatients}</span>
                    <span className="a-stat-label">Total Patients</span>
                  </div>
                  <div className="a-stat-sub">
                    <span className="a-sub-admitted">{analytics.admittedPatients} admitted</span>
                    <span className="a-sub-discharged">{analytics.dischargedPatients} discharged</span>
                  </div>
                </div>

                <div className="a-stat-card a-stat-rooms">
                  <div className="a-stat-icon">🏥</div>
                  <div className="a-stat-info">
                    <span className="a-stat-value">{analytics.totalRooms}</span>
                    <span className="a-stat-label">Rooms / Beds</span>
                  </div>
                  <div className="a-stat-sub">
                    <span className="a-sub-available">{analytics.availableRooms} available</span>
                    <span className="a-sub-occupied">{analytics.occupiedRooms} occupied</span>
                  </div>
                </div>

                <div className="a-stat-card a-stat-doctors">
                  <div className="a-stat-icon">🩺</div>
                  <div className="a-stat-info">
                    <span className="a-stat-value">{analytics.totalDoctors}</span>
                    <span className="a-stat-label">Doctors</span>
                  </div>
                  <div className="a-stat-sub">
                    <span>{specialityData.length} specialities</span>
                  </div>
                </div>

                <div className="a-stat-card a-stat-equipment">
                  <div className="a-stat-icon">⚙️</div>
                  <div className="a-stat-info">
                    <span className="a-stat-value">{analytics.totalEquipment}</span>
                    <span className="a-stat-label">Equipment Types</span>
                  </div>
                  <div className="a-stat-sub">
                    <span>Inventory tracked</span>
                  </div>
                </div>

                <div className="a-stat-card a-stat-pharmacy">
                  <div className="a-stat-icon">💊</div>
                  <div className="a-stat-info">
                    <span className="a-stat-value">{analytics.totalPrescriptions}</span>
                    <span className="a-stat-label">Prescriptions</span>
                  </div>
                  <div className="a-stat-sub">
                    <span>Total issued</span>
                  </div>
                </div>
              </div>

              {/* ── Charts Row ── */}
              <div className="analytics-charts-row">
                {/* 7-Day Admissions */}
                <div className="analytics-chart-card">
                  <h5>7-Day Admissions</h5>
                  {admissionsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={admissionsData}>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5f7274' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5f7274' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#f3f5f7', border: '1px solid #d9dee2', borderRadius: 10, fontSize: 13 }}
                        />
                        <Bar dataKey="admissions" fill="#0d8a72" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-chart-data">No recent admissions data</p>
                  )}
                </div>

                {/* Bed Occupancy Pie */}
                <div className="analytics-chart-card">
                  <h5>Bed Occupancy</h5>
                  {bedOccupancyData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={bedOccupancyData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {bedOccupancyData.map((entry, idx) => (
                            <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: 12, fontFamily: "'Outfit', sans-serif" }}
                        />
                        <Tooltip
                          contentStyle={{ background: '#f3f5f7', border: '1px solid #d9dee2', borderRadius: 10, fontSize: 13 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-chart-data">No room data available</p>
                  )}
                </div>
              </div>

              {/* ── Second Charts Row ── */}
              <div className="analytics-charts-row">
                {/* Doctors by Speciality */}
                <div className="analytics-chart-card">
                  <h5>Doctors by Speciality</h5>
                  {specialityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={specialityData} layout="vertical">
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#5f7274' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#5f7274' }} axisLine={false} tickLine={false} width={110} />
                        <Tooltip
                          contentStyle={{ background: '#f3f5f7', border: '1px solid #d9dee2', borderRadius: 10, fontSize: 13 }}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {specialityData.map((_, idx) => (
                            <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-chart-data">No doctor data available</p>
                  )}
                </div>

                {/* Top Equipment */}
                <div className="analytics-chart-card">
                  <h5>Top Equipment (by count)</h5>
                  {equipmentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={equipmentData} layout="vertical">
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#5f7274' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#5f7274' }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip
                          contentStyle={{ background: '#f3f5f7', border: '1px solid #d9dee2', borderRadius: 10, fontSize: 13 }}
                        />
                        <Bar dataKey="count" fill="#14a38b" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-chart-data">No equipment data available</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        <section className="modules-header">
          <h4>Operational Modules</h4>
          <div className="module-filters">
            <button type="button" className="selected">All Systems</button>
            <button type="button">Critical Only</button>
          </div>
        </section>

        <section className="admin-links-grid" aria-label="Operational modules">
          {adminModules.map((action) => (
            <a className="admin-link-card" href={action.href} key={action.title}>
              <span className="admin-link-tag">{action.tag}</span>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <span className="admin-link-cta">Open module -&gt;</span>
            </a>
          ))}
        </section>

        <footer className="admin-footer-note">
          <p>2026 Clinical Sanctuary Systems. HIPAA Compliant Interface.</p>
          <span>Mainframe Active</span>
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
