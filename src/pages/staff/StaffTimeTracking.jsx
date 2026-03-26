import { useState, useEffect, useCallback } from 'react';
import { getStaff, clockIn, clockOut, getTimeEntries, confirmTimesheet } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function StaffTimeTracking() {
  const { user } = useAuth();
  const now = useClock();
  const [myStaffId, setMyStaffId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, er] = await Promise.all([
        getStaff().catch(() => ({ data: [] })),
        getTimeEntries().catch(() => ({ data: [] })),
      ]);
      const staffList = sr.data?.data ?? sr.data ?? [];
      const allEntries = er.data?.data ?? er.data ?? [];

      // Find this user's staff record by email match
      const me = Array.isArray(staffList)
        ? staffList.find(s => s.email === user?.email) ?? staffList[0]
        : null;

      if (me) {
        setMyStaffId(me.id ?? me._id);
        const myEntries = Array.isArray(allEntries)
          ? allEntries.filter(e => (e.staffId ?? e.staff_id) === (me.id ?? me._id))
          : [];
        setEntries(myEntries);
      }
    } catch {
      setError('Failed to load time data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const handleClockIn = async () => {
    setActioning(true); setError('');
    try {
      await clockIn(myStaffId);
      showSuccess('✅ Clocked in!');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock in.');
    } finally { setActioning(false); }
  };

  const handleClockOut = async () => {
    setActioning(true); setError('');
    try {
      await clockOut(myStaffId);
      showSuccess('✅ Clocked out!');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock out.');
    } finally { setActioning(false); }
  };

  const timeDisplay = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateDisplay = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Time</div>
          <div className="page-subtitle">Your clock in / out</div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="clock-panel" style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)' }}>
        <div className="clock-time">{timeDisplay}</div>
        <div className="clock-date">{dateDisplay}</div>
        <div className="clock-buttons">
          <button className="btn-clock-in" onClick={handleClockIn} disabled={actioning || !myStaffId}>
            ▶ Clock In
          </button>
          <button className="btn-clock-in" onClick={handleClockOut} disabled={actioning || !myStaffId}>
            ■ Clock Out
          </button>
        </div>
      </div>

      <div className="section-label">My Recent Entries</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏱️</div>
          <div className="empty-title">No entries yet</div>
          <div className="empty-sub">Clock in to start tracking your time</div>
        </div>
      ) : (
        entries.slice().reverse().map((entry, i) => {
          const isConfirmed = entry.confirmed || entry.status === 'confirmed';
          return (
            <div key={entry.id ?? entry._id ?? i} className="time-entry">
              <div className="time-entry-header">
                <div className="time-entry-name">{formatDate(entry.clockIn ?? entry.timestamp ?? entry.created_at)}</div>
                <span className={`badge ${isConfirmed ? 'badge-confirmed' : 'badge-pending'}`}>
                  {isConfirmed ? '✓ Confirmed' : 'Pending'}
                </span>
              </div>
              <div className="time-row">
                {entry.clockIn && <span>▶ In: {formatTime(entry.clockIn)}</span>}
                {entry.clockOut && <span>■ Out: {formatTime(entry.clockOut)}</span>}
                {entry.type && <span className={`badge badge-${entry.type}`}>{entry.type}</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
