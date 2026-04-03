import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import DesktopSidebar from './DesktopSidebar';

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
    { to: '/admin/settings', icon: '👤', label: t('profile') },
    { to: '/logout', icon: '🚪', label: t('logout'), action: true, onClick: handleLogout },
  ];

  return (
    <div className="app-layout">
      <DesktopSidebar 
        items={navItems} 
        title="Little Ones" 
        logo="👑" 
        onLogout={handleLogout} 
        t={t} 
      />

      <header className="app-header" style={{ background: 'var(--gradient-primary)' }}>
        <div className="header-left">
          <span className="header-logo">👑</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>{t('dashboard')}</h1>
            <div style={{ fontSize: 10, display: 'flex', gap: 5, alignItems: 'center', opacity: 0.8 }}>
               <span style={{ fontWeight: 700 }}>Owner Portal</span>
               <div className="status-indicator" style={{ background: 'none', border: 'none', padding: 0, margin: 0 }}>
                  <span className="status-dot"></span>
               </div>
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          {t('logout')}
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
