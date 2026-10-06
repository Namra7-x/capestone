import { Component } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ToastContainer } from './components/UI/ToastContainer.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';

class AppErrorBoundary extends Component {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong.' };
  }

  componentDidCatch(error, info) {
    console.error('Application render error:', error, info);
  }

  handleRetry = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      return (
        <div className="loading-screen" style={{ flexDirection: 'column', gap: 12, padding: 24 }}>
          <strong>Something went wrong</strong>
          <span style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 560 }}>
            {this.state.message}
          </span>
          <button className="btn btn-secondary" onClick={this.handleRetry}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-screen"><span className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function GuestOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="loading-screen"><span className="spinner" /></div>;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Routes>
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/" element={<RequireAuth><DashboardPage view="inbox" /></RequireAuth>} />
        <Route path="/today" element={<RequireAuth><DashboardPage view="today" /></RequireAuth>} />
        <Route path="/upcoming" element={<RequireAuth><DashboardPage view="upcoming" /></RequireAuth>} />
        <Route path="/completed" element={<RequireAuth><DashboardPage view="completed" /></RequireAuth>} />
        <Route path="/high-priority" element={<RequireAuth><DashboardPage view="high" /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </AppErrorBoundary>
  );
}
