import { useState, useEffect, useCallback } from 'react';
import { getStaff, clockIn, clockOut, getTimeEntries, confirmTimesheet } from '../services/api';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function TimeTracking() {
  const now = useClock();
  const [staff, setStaff] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actioning, setActioning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sr, er] = await Promise.all([
        getStaff().catch(() => ({ data: [] })),
        getTimeEntries().catch(() => ({ data: [] })),
      ]);
      const s = sr.data?.data ?? sr.data ?? [];
      const e = er.data?.data ?? er.data ?? [];
      setStaff(Array.isArray(s) ? s : []);
      setEntries(Array.isArray(e) ? e : []);
      if (Array.isArray(s) && s.length > 0 && !selectedStaff) {
        setSelectedStaff(s[0].id ?? s[0]._id ?? '');
      }
    } catch (err) {
      setError('Failed to load time tracking data.');
    } finally {
      setLoading(false);
    }
  }, [selectedStaff]);

  useEffect(() => { load(); }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleClockIn = async () => {
    if (!selectedStaff) { setError('Select a staff member first.'); return; }
    setActioning(true);
    setError('');
    try {
      await clockIn(selectedStaff);
      showSuccess('✅ Clocked in successfully!');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock in.');
    } finally {
      setActioning(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedStaff) { setError('Select a staff member first.'); return; }
    setActioning(true);
    setError('');
    try {
      await clockOut(selectedStaff);
      showSuccess('✅ Clocked out successfully!');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock out.');
    } finally {
      setActioning(false);
    }
  };

  const handleConfirm = async (entryId) => {
    setError('');
    try {
      await confirmTimesheet(entryId);
      showSuccess('✅ Timesheet confirmed!');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm.');
    }
  };

  const timeDisplay = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateDisplay = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Time Tracking</div>
          <div className="page-subtitle">Clock in and out</div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="clock-panel">
        <div className="clock-time">{timeDisplay}</div>
        <div className="clock-date">{dateDisplay}</div>

        {staff.length > 0 && (
          <select
            className="form-select"
            style={{ marginBottom: 16, background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}
            value={selectedStaff}
            onChange={e => setSelectedStaff(e.target.value)}
          >
            {staff.map(s => (
              <option
                key={s.id ?? s._id}
                value={s.id ?? s._id}
                style={{ color: 'black', background: 'white' }}
              >
                {s.name} – {s.role ?? 'Staff'}
              </option>
            ))}
          </select>
        )}

        {staff.length === 0 && !loading && (
          <div style={{ marginBottom: 16, opacity: 0.8, fontSize: 14 }}>
            Add staff members first to track time.
          </div>
        )}

        <div className="clock-buttons">
          <button className="btn-clock-in" onClick={handleClockIn} disabled={actioning || !selectedStaff}>
            ▶ Clock In
          </button>
          <button className="btn-clock-in" onClick={handleClockOut} disabled={actioning || !selectedStaff}>
            ■ Clock Out
          </button>
        </div>
      </div>

      <div className="section-label">Recent Entries</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏱️</div>
          <div className="empty-title">No time entries yet</div>
          <div className="empty-sub">Clock in to start tracking</div>
        </div>
      ) : (
        entries.slice().reverse().map((entry, i) => {
          const staffMember = staff.find(s => (s.id ?? s._id) === (entry.staffId ?? entry.staff_id));
          const isConfirmed = entry.confirmed || entry.status === 'confirmed';
          return (
            <div key={entry.id ?? entry._id ?? i} className="time-entry">
              <div className="time-entry-header">
                <div className="time-entry-name">{staffMember?.name ?? entry.staffName ?? 'Staff'}</div>
                <span className={`badge ${isConfirmed ? 'badge-confirmed' : 'badge-pending'}`}>
                  {isConfirmed ? '✓ Confirmed' : 'Pending'}
                </span>
              </div>
              <div className="time-row">
                <span>📅 {formatDate(entry.clockIn ?? entry.timestamp ?? entry.created_at)}</span>
                {entry.clockIn && <span>▶ In: {formatTime(entry.clockIn)}</span>}
                {entry.clockOut && <span>■ Out: {formatTime(entry.clockOut)}</span>}
                {entry.type && <span className={`badge badge-${entry.type}`}>{entry.type}</span>}
              </div>
              {!isConfirmed && (
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ marginTop: 10 }}
                  onClick={() => handleConfirm(entry.id ?? entry._id)}
                >
                  ✓ Confirm Timesheet
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
