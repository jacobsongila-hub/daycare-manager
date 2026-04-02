import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ParentLayout() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/parent', icon: '🏠', label: 'Home', end: true },
    { to: '/parent/calendar', icon: '📅', label: t('calendar') },
    { to: '/parent/photos', icon: '📸', label: 'Photos' },
    { to: '/parent/docs', icon: '📄', label: t('mydocs') },
    { to: '/parent/profile', icon: '👤', label: t('profile') },
    { to: '/logout', icon: '🚪', label: t('logout'), action: true },
  ];

  return (
    <div className="app-layout">
      <header className="app-header" style={{ background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)' }}>
        <div className="header-left">
          <span className="header-logo">👨‍👩‍👧</span>
          <div>
            <h1 style={{ fontSize: 16 }}>Daycare Manager</h1>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>Parent Portal</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>⎋ {t('logout')}</button>
      </header>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          item.action ? (
            <button key="logout" onClick={handleLogout} className="nav-item" style={{ border: 'none', background: 'none' }}>
              <span className="nav-icon">{item.icon}</span>
              <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
            </button>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span style={{ fontSize: '0.7rem' }}>{item.label}</span>
            </NavLink>
          )
        ))}
      </nav>

      <main className="page-content"><Outlet /></main>
    </div>
  );
}
