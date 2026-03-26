import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: '🏠', label: 'Home', end: true },
  { to: '/parents', icon: '👨‍👩‍👧', label: 'Parents' },
  { to: '/children', icon: '👶', label: 'Children' },
  { to: '/staff', icon: '👤', label: 'Staff' },
  { to: '/time-tracking', icon: '⏱️', label: 'Time' },
];

const pageTitles = {
  '/': 'Dashboard',
  '/parents': 'Parents',
  '/children': 'Children',
  '/staff': 'Staff',
  '/time-tracking': 'Time Tracking',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const title = pageTitles[currentPath] || 'Daycare Manager';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">🏠</span>
          <h1>{title}</h1>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span>⎋</span> Sign Out
        </button>
      </header>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
