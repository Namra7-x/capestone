import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Sidebar } from '../components/Layout/Sidebar.jsx';
import { TopBar, MobileNav } from '../components/Layout/TopBar.jsx';
import { Icons } from '../utils/icons.jsx';
import { formatDate } from '../utils/date.js';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out');
    navigate('/login');
  };

  const setTheme = (t) => {
    if (t !== theme) {
      // toggleTheme flips; call appropriately
      if ((t === 'dark') !== (theme === 'dark')) toggleTheme();
    }
  };

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-area">
        <TopBar
          onOpenMenu={() => setSidebarOpen(true)}
          onOpenPalette={() => {}}
          onRefresh={() => {}}
        />

        <main className="page-content">
          <div className="page-header">
            <h1 className="page-title">Profile & Settings</h1>
            <p className="page-subtitle">Manage your account and preferences</p>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div className="profile-header">
              <span className="avatar">{user?.username?.slice(0, 1) || '?'}</span>
              <div>
                <div className="profile-name">{user?.username}</div>
                <div className="profile-email">{user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 3 }}>
                  Member since
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                  {user?.createdAt ? formatDate(user.createdAt) : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 3 }}>
                  User ID
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                  {user?.id}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Appearance</div>
            <div className="theme-toggle-group">
              <button
                className={`theme-option${theme === 'light' ? ' active' : ''}`}
                onClick={() => setTheme('light')}
              >
                {Icons.sun} Light
              </button>
              <button
                className={`theme-option${theme === 'dark' ? ' active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                {Icons.moon} Dark
              </button>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Security</div>
            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--success)' }}>{Icons.check}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Password security</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Your password is hashed with bcrypt and never stored in plain text.
                </div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Session</div>
            <button className="btn btn-secondary" onClick={handleLogout}>
              {Icons.logout} Log out
            </button>
          </div>
        </main>

        <MobileNav current="/profile" />
      </div>
    </div>
  );
}
