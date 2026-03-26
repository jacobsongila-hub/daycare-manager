import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStaff, clockIn, clockOut } from '../../services/api';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function StaffHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = useClock();
  const [myStaffId, setMyStaffId] = useState(null);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getStaff().then(res => {
      const staffList = res.data?.data ?? res.data ?? [];
      const me = Array.isArray(staffList)
        ? staffList.find(s => s.email === user?.email) ?? staffList[0]
        : null;
      if (me) setMyStaffId(me.id ?? me._id);
    }).catch(() => {});
  }, [user]);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const handleClockIn = async () => {
    if (!myStaffId) { setError('Staff record not found. Contact your admin.'); return; }
    setActioning(true); setError('');
    try { await clockIn(myStaffId); showSuccess('✅ Clocked in successfully!'); }
    catch (err) { setError(err.response?.data?.message || 'Failed to clock in.'); }
    finally { setActioning(false); }
  };

  const handleClockOut = async () => {
    if (!myStaffId) { setError('Staff record not found. Contact your admin.'); return; }
    setActioning(true); setError('');
    try { await clockOut(myStaffId); showSuccess('✅ Clocked out successfully!'); }
    catch (err) { setError(err.response?.data?.message || 'Failed to clock out.'); }
    finally { setActioning(false); }
  };

  const timeDisplay = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateDisplay = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div>
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #1b5e20, #2e7d32, #43a047)' }}>
        <div className="welcome-title">{greeting},</div>
        <div className="welcome-name">{user?.name || user?.email?.split('@')[0] || 'Staff'}</div>
        <div className="welcome-date">{dateDisplay}</div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="clock-panel" style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)' }}>
        <div className="clock-time">{timeDisplay}</div>
        <div className="clock-date">Tap to record your attendance</div>
        <div className="clock-buttons">
          <button className="btn-clock-in" onClick={handleClockIn} disabled={actioning}>
            {actioning ? '…' : '▶ Clock In'}
          </button>
          <button className="btn-clock-in" onClick={handleClockOut} disabled={actioning}>
            {actioning ? '…' : '■ Clock Out'}
          </button>
        </div>
      </div>

      <div className="section-label">Quick Links</div>
      <div
        className="dash-card"
        style={{ '--card-accent': '#43a047', cursor: 'pointer', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }}
        onClick={() => navigate('/staff/time')}
      >
        <span style={{ fontSize: 32 }}>⏱️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>My Time Entries</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>View your clock-in history</div>
        </div>
        <span className="dash-arrow">›</span>
      </div>
    </div>
  );
}
