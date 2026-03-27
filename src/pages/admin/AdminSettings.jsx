import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const { addToast } = useNotification();
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
          <h3 style={{ margin: '0 0 15px 0', color: '#8e24aa' }}>👥 {t('userManagement') || 'User Management'}</h3>
          <p style={{ color: '#666', marginBottom: 15 }}>{t('userManagementDesc')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>{t('goToUserManagement')} ➔</button>
        </div>

        {/* Language Settings */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#43a047' }}>🌐 {t('languageSection')}</h3>
          <p style={{ color: '#666', marginBottom: 15 }}>{t('languageDesc')}</p>
          
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
          <h3 style={{ margin: '0 0 15px 0', color: '#f44336' }}>📦 {t('dataMigration')}</h3>
          <p style={{ color: '#666', marginBottom: 15 }}>{t('dataMigrationDesc')}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
              const a = document.createElement('a');
              a.href = dataStr;
              a.download = 'daycare_backup.json';
              a.click();
            }}>📥 {t('exportData')}</button>
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
                    addToast(t('dataImported') || 'Data imported successfully! Reloading...', 'success');
                    window.location.reload();
                  } catch(err) { addToast(t('invalidFile') || 'Invalid JSON file', 'error'); }
                };
                reader.readAsText(file);
              };
              input.click();
            }}>📤 {t('importData')}</button>
          </div>
        </div>

      </div>
    </div>
  );
}
