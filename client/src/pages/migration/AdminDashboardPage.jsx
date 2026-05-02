import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin-dashboard-ejs.css';

const sidebarItems = [
  { label: 'Command Center', href: '/admin/dashboard', active: true },
  { label: 'Patient Registry', href: '/admin/patients' },
  { label: 'Staff Directory', href: '/admin/newstaff' },
  { label: 'Inventory', href: '/admin/equipment' },
  { label: 'Pharmacy', href: '/admin/pharmacy' },
  { label: 'Analytics', href: '/dashboard' }
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

function AdminDashboardPage() {
  const { user, logout } = useAuth();

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


