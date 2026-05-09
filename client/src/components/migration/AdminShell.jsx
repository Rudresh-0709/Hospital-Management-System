import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminShell({ title, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navGroups = [
    {
      title: 'Core',
      links: [
        { to: '', label: 'Migration Home' },
        { to: '/dashboard', label: 'Migration Dashboard' },
        { to: '/admin/dashboard', label: 'Admin Dashboard' },
      ],
    },
    {
      title: 'Patients',
      links: [
        { to: '/admin/patients', label: 'New Patient Registration' },
        { to: '/admin/admit', label: 'Admit Patient' },
        { to: '/admin/discharge', label: 'Discharge Patient' },
        { to: '/admin/patienthistory', label: 'Patient History' },
      ],
    },
    {
      title: 'Visits',
      links: [
        { to: '/admin/newvisitor', label: 'New Visitor' },
        { to: '/admin/visit-history', label: 'Visit History' },
        { to: '/admin/visitqr', label: 'Visit QR' },
      ],
    },
    {
      title: 'Staff',
      links: [
        { to: '/admin/newdoctor', label: 'New Doctor' },
        { to: '/admin/newstaff', label: 'New Staff' },
        { to: '/admin/nurse', label: 'New Nurse' },
        { to: '/admin/nurseallocate', label: 'Nurse Allocation' },
      ],
    },
    {
      title: 'Equipment',
      links: [
        { to: '/admin/equipment', label: 'Equipment Overview' },
        { to: '/admin/equipment/newequipment', label: 'Add Equipment' },
        { to: '/admin/equipment/updateequipment', label: 'Update Equipment' },
      ],
    },
    {
      title: 'Clinical Ops',
      links: [
        { to: '/admin/pharmacy', label: 'Pharmacy' },
        { to: '/admin/ai', label: 'Admin AI' },
        { to: '/chat', label: 'Chat' },
      ],
    },
  ];

  const [openGroup, setOpenGroup] = useState(null);

  const handleToggle = (groupTitle) => (e) => {
    e.preventDefault();
    setOpenGroup((prev) => (prev === groupTitle ? null : groupTitle));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.migrate-shell-nav-group')) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
          <details key={group.title} className="migrate-shell-nav-group" open={openGroup === group.title}>
            <summary onClick={handleToggle(group.title)}>{group.title}</summary>
            <div className="migrate-shell-nav-links">
              {group.links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  onClick={() => setOpenGroup(null)}
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

