import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import DesktopSidebar from './DesktopSidebar';

export default function StaffLayout() {
  const { logout } = useAuth();
  const { t, lang } = useLanguage();
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
    <div className="app-layout" dir={lang === 'he' ? 'rtl' : 'ltr'} style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <DesktopSidebar 
        items={navItems} 
        title="Little Ones" 
        logo="👩‍🏫" 
        onLogout={handleLogout} 
        t={t} 
      />

      <header className="app-header" style={{ background: 'var(--gradient-primary)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="header-logo" style={{ fontSize: '1.5rem' }}>👩‍🏫</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 'bold' }}>Daycare Manager</h1>
            <div style={{ fontSize: '0.75rem', display: 'flex', gap: '5px', alignItems: 'center', opacity: 0.9, color: 'white' }}>
               <span style={{ fontWeight: 600 }}>Staff Portal</span>
               <div className="status-indicator" style={{ background: 'none', border: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center' }}>
                  <span className="status-dot"></span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bottom-nav" style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', padding: '8px', gap: '8px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', backgroundColor: 'white', borderRadius: '12px 12px 0 0', boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        {navItems.map((item) => (
          item.action ? (
            <button key="logout" onClick={handleLogout} className="nav-item" style={{ flex: '0 0 auto', padding: '8px 12px', minWidth: '70px', borderRadius: '8px' }}>
              <span className="nav-icon" style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.75rem' }}>{item.label}</span>
            </button>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ flex: '0 0 auto', padding: '8px 12px', minWidth: '70px', borderRadius: '8px' }}>
              <span className="nav-icon" style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.75rem' }}>{item.label}</span>
            </NavLink>
          )
        ))}
      </nav>

      <main className="page-content" style={{ padding: '16px', paddingBottom: '80px' }}><Outlet /></main>
    </div>
  );
}
