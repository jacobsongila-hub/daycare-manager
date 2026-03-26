import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin', icon: '🏠', label: 'Home', end: true },
  { to: '/admin/parents', icon: '👨‍👩‍👧', label: 'Parents' },
  { to: '/admin/children', icon: '👶', label: 'Children' },
  { to: '/admin/staff', icon: '👤', label: 'Staff' },
  { to: '/admin/time-tracking', icon: '⏱️', label: 'Time' },
  { to: '/admin/users', icon: '🔑', label: 'Users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <header className="app-header" style={{ background: 'linear-gradient(135deg, #1565c0, #2196f3)' }}>
        <div className="header-left">
          <span className="header-logo">👑</span>
          <div>
            <h1 style={{ fontSize: 16 }}>Daycare Manager</h1>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>Admin Portal</div>
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
