import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Icons } from '../../utils/icons.jsx';

const NAV_SECTIONS = [
  {
    label: 'Views',
    items: [
      { to: '/', end: true, label: 'Inbox', icon: Icons.inbox, view: 'inbox' },
      { to: '/today', label: 'Today', icon: Icons.today, view: 'today' },
      { to: '/upcoming', label: 'Upcoming', icon: Icons.upcoming, view: 'upcoming' },
      { to: '/completed', label: 'Completed', icon: Icons.completed, view: 'completed' },
    ],
  },
  {
    label: 'Filters',
    items: [
      { to: '/high-priority', label: 'High Priority', icon: Icons.flag, view: 'high' },
    ],
  },
];

export function Sidebar({ open, onClose, counts = {} }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out');
    navigate('/login');
  };

  return (
    <>
      {open && <div className="drawer-overlay" style={{ zIndex: 45 }} onClick={onClose} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">F</span>
          <span>Flowboard</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {counts[item.view] !== undefined && counts[item.view] > 0 && (
                    <span className="nav-count">{counts[item.view]}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className="user-chip" onClick={onClose}>
            <span className="avatar">{user?.username?.slice(0, 1) || '?'}</span>
            <span className="user-meta">
              <span className="user-name">{user?.username}</span>
              <span className="user-email">{user?.email}</span>
            </span>
          </NavLink>
          <button className="nav-item" onClick={handleLogout} style={{ marginTop: 4 }}>
            <span className="nav-icon">{Icons.logout}</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
