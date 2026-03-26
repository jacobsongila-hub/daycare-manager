import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/staff', icon: '🏠', label: 'Home', end: true },
  { to: '/staff/time', icon: '⏱️', label: 'My Time' },
];

export default function StaffLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <header className="app-header" style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)' }}>
        <div className="header-left">
          <span className="header-logo">👤</span>
          <div>
            <h1 style={{ fontSize: 16 }}>Daycare Manager</h1>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>Staff Portal</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>⎋ Sign Out</button>
      </header>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="page-content"><Outlet /></main>
    </div>
  );
}
