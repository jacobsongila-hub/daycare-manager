import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function StaffProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header Profile Cover */}
      <div style={{ height: 120, background: 'linear-gradient(135deg, #2e7d32, #4caf50)', borderRadius: '16px 16px 0 0', position: 'relative' }}>
         <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, background: 'white', borderRadius: 40, border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            👩‍🏫
         </div>
      </div>
      
      <div style={{ background: 'white', padding: '50px 20px 20px', borderRadius: '0 0 16px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
         <h2 style={{ margin: '0 0 5px 0' }}>{user?.name || 'Staff Member'}</h2>
         <div style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '0.9rem' }}>• Active Employee Account</div>
      </div>

      {/* Details Box */}
      <div style={{ background: 'white', padding: 25, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Contact & Role Details</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 15 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>Registered Email</div>
            <div style={{ fontWeight: 500 }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>System Role</div>
            <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>

        <button className="btn" style={{ width: '100%', marginTop: 25, padding: 12 }}>✏️ Edit Profile Info</button>
      </div>

      {/* App Settings / Logout */}
      <div style={{ background: 'white', padding: 25, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Account Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn" style={{ display: 'flex', justifyContent: 'space-between' }}>
             <span>🔒 Change Password</span>
             <span>›</span>
          </button>
          <button className="btn" style={{ display: 'flex', justifyContent: 'space-between' }}>
             <span>🗣 Language & Regional Settings</span>
             <span>›</span>
          </button>
          <button className="btn" onClick={handleLogout} style={{ background: '#ffebee', color: '#c62828', display: 'flex', justifyContent: 'space-between', border: '1px solid #ffcdd2', marginTop: 10 }}>
             <span>🚪 Log Out</span>
             <span>›</span>
          </button>
        </div>
      </div>

    </div>
  );
}
