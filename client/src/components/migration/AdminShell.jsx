import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminShell({ title, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navGroups = [
    {
      title: 'Core',
      links: [
        { to: '/migrate', label: 'Migration Home' },
        { to: '/migrate/dashboard', label: 'Migration Dashboard' },
        { to: '/migrate/admin/dashboard', label: 'Admin Dashboard' },
      ],
    },
    {
      title: 'Patients',
      links: [
        { to: '/migrate/admin/patients', label: 'New Patient Registration' },
        { to: '/migrate/admin/admit', label: 'Admit Patient' },
        { to: '/migrate/admin/discharge', label: 'Discharge Patient' },
        { to: '/migrate/admin/patienthistory', label: 'Patient History' },
      ],
    },
    {
      title: 'Visits',
      links: [
        { to: '/migrate/admin/newvisitor', label: 'New Visitor' },
        { to: '/migrate/admin/visit-history', label: 'Visit History' },
        { to: '/migrate/admin/visitqr', label: 'Visit QR' },
      ],
    },
    {
      title: 'Staff',
      links: [
        { to: '/migrate/admin/newdoctor', label: 'New Doctor' },
        { to: '/migrate/admin/newstaff', label: 'New Staff' },
        { to: '/migrate/admin/nurse', label: 'New Nurse' },
        { to: '/migrate/admin/nurseallocate', label: 'Nurse Allocation' },
      ],
    },
    {
      title: 'Equipment',
      links: [
        { to: '/migrate/admin/equipment', label: 'Equipment Overview' },
        { to: '/migrate/admin/equipment/newequipment', label: 'Add Equipment' },
        { to: '/migrate/admin/equipment/updateequipment', label: 'Update Equipment' },
      ],
    },
    {
      title: 'Clinical Ops',
      links: [
        { to: '/migrate/admin/pharmacy', label: 'Pharmacy' },
        { to: '/migrate/admin/ai', label: 'Admin AI' },
        { to: '/migrate/chat', label: 'Chat' },
      ],
    },
  ];

  const isGroupActive = (links) => links.some((link) => location.pathname.startsWith(link.to));

  return (
    <div className="migrate-ejs migrate-shell">
      <div className="migrate-shell-topbar">
        <div className="migrate-shell-brand">
          <div className="migrate-shell-brand-title">Clinical Sanctuary HMS</div>
          <div className="migrate-shell-brand-subtitle">Admin Migration Workspace</div>
        </div>
        <div className="migrate-shell-user">
          <span>
            {user?.name || 'Unknown'} ({user?.role || 'n/a'})
          </span>
          <button className="btn" type="button" onClick={logout}>Logout</button>
        </div>
      </div>

      <nav className="migrate-shell-nav" aria-label="Form pages navigation">
        {navGroups.map((group) => (
          <details key={group.title} className="migrate-shell-nav-group" open={isGroupActive(group.links)}>
            <summary>{group.title}</summary>
            <div className="migrate-shell-nav-links">
              {group.links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </details>
        ))}
      </nav>

      <div className="migrate-shell-titlebar">
        <h1>{title}</h1>
      </div>

      <main className="migrate-shell-content">{children}</main>
    </div>
  );
}

export default AdminShell;
