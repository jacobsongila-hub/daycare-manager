import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout" dir={lang === 'he' ? 'rtl' : 'ltr'} style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <header className="app-header" style={{ background: 'var(--gradient-primary)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="header-logo" style={{ fontSize: '1.5rem' }}>🏠</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 'bold' }}>Daycare Manager</h1>
            <div style={{ fontSize: '0.75rem', display: 'flex', gap: '5px', alignItems: 'center', opacity: 0.9, color: 'white' }}>
               <span style={{ fontWeight: 600 }}>Main Portal</span>
               <div className="status-indicator" style={{ background: 'none', border: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center' }}>
                  <span className="status-dot"></span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bottom-nav" style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', padding: '8px', gap: '8px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', backgroundColor: 'white', borderRadius: '12px 12px 0 0', boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ flex: '0 0 auto', padding: '8px 12px', minWidth: '70px', borderRadius: '8px' }}
          >
            <span className="nav-icon" style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.75rem' }}>{t(item.label.toLowerCase()) || item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="page-content" style={{ padding: '16px', paddingBottom: '80px' }}>
        <Outlet />
      </main>
    </div>
  );
}
