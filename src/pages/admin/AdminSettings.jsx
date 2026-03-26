import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const { lang, setLang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>{t('settings')}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr)', gap: 20 }}>
        
        {/* Account Settings */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1565c0' }}>👤 Account Section</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <button className="btn" style={{ marginTop: 10 }}>Change Password</button>
        </div>

        {/* User Management Link */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#8e24aa' }}>👥 User Management</h3>
          <p style={{ color: '#666', marginBottom: 15 }}>Manage Staff and Parent accounts, assign roles, and suspend users.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>Go to User Management ➔</button>
        </div>

        {/* Language Settings */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#43a047' }}>🌐 Language Section</h3>
          <p style={{ color: '#666', marginBottom: 15 }}>Choose the application language. Hebrew will automatically switch the layout to RTL.</p>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className={`btn ${lang === 'en' ? 'btn-primary' : ''}`}
              onClick={() => setLang('en')}
              style={{ flex: 1 }}
            >
              🇺🇸 English
            </button>
            <button 
              className={`btn ${lang === 'he' ? 'btn-primary' : ''}`}
              onClick={() => setLang('he')}
              style={{ flex: 1 }}
            >
              🇮🇱 עברית (Hebrew)
            </button>
          </div>
        </div>

        {/* Data Migration */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#f44336' }}>📦 Data Migration</h3>
          <p style={{ color: '#666', marginBottom: 15 }}>Import or export all daycare data as JSON.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
              const a = document.createElement('a');
              a.href = dataStr;
              a.download = 'daycare_backup.json';
              a.click();
            }}>📥 Export Data</button>
            <button className="btn" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'application/json';
              input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const data = JSON.parse(ev.target.result);
                    Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
                    alert('Data imported successfully! Reloading...');
                    window.location.reload();
                  } catch(err) { alert('Invalid JSON file'); }
                };
                reader.readAsText(file);
              };
              input.click();
            }}>📤 Import Data</button>
          </div>
        </div>

      </div>
    </div>
  );
}
