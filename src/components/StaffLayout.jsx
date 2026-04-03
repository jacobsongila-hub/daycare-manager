import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import DesktopSidebar from './DesktopSidebar';

export default function StaffLayout() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/staff', icon: '🏠', label: t('dashboard'), end: true },
    { to: '/staff/attendance', icon: '✅', label: t('attendance') },
    { to: '/staff/notes', icon: '📝', label: t('notes') },
    { to: '/staff/time', icon: '⏱️', label: t('timeTracking') },
    { to: '/staff/shifts', icon: '📅', label: t('myshifts') },
    { to: '/staff/calendar', icon: '🗓️', label: t('calendar') },
    { to: '/staff/docs', icon: '📄', label: t('mydocs') },
    { to: '/staff/profile', icon: '👤', label: t('profile') },
    { to: '/logout', icon: '🚪', label: t('logout'), action: true, onClick: handleLogout },
  ];

  return (
    <div className="app-layout">
      <DesktopSidebar 
        items={navItems} 
        title="Little Ones" 
        logo="👩‍🏫" 
        onLogout={handleLogout} 
        t={t} 
      />

      <header className="app-header" style={{ background: 'var(--gradient-primary)' }}>
        <div className="header-left">
          <span className="header-logo">👩‍🏫</span>
          <div>
            <h1 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>Daycare Manager</h1>
            <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>Staff Portal</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span> {t('logout')}
        </button>
      </header>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          item.action ? (
            <button key="logout" onClick={handleLogout} className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        ))}
      </nav>

      <main className="page-content"><Outlet /></main>
    </div>
  );
}
