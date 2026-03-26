import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/admin', icon: '🏠', label: t('dashboard'), end: true },
    { to: '/admin/attendance', icon: '✅', label: t('attendance') },
    { to: '/admin/families', icon: '👨‍👩‍👧', label: t('families') },
    { to: '/admin/staff', icon: '👩‍🏫', label: t('staff') },
    { to: '/admin/time-tracking', icon: '⏱️', label: t('timeTracking') },
    { to: '/admin/calendar', icon: '📅', label: t('calendar') },
    { to: '/admin/settings', icon: '⚙️', label: t('settings') },
  ];

  return (
    <div className="app-layout">
      <header className="app-header" style={{ background: 'linear-gradient(135deg, #1565c0, #2196f3)' }}>
        <div className="header-left">
          <span className="header-logo">👑</span>
          <div>
            <h1 style={{ fontSize: 16 }}>Daycare Manager</h1>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>Owner Portal</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>⎋ {t('logout')}</button>
      </header>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="page-content"><Outlet /></main>
    </div>
  );
}
