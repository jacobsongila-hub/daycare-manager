import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StaffApi, TimeEntriesApi, clockIn, clockOut } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

function formatTime(iso, lang = 'en') {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso, lang = 'en') {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' });
}

function calculateDiff(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  return (e - s) / (1000 * 60 * 60);
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
  const { t, lang } = useLanguage();
  const now = useClock();
  const [staff, setStaff] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const { addToast } = useNotification();
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ staffId: '', date: new Date().toISOString().split('T')[0], start: '', end: '', preset: 'custom' });
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'detailed'

  const SHIFT_PRESETS = {
    full: { label: t('fullDay') || 'Full Day (07:45-17:00)', start: '07:45', end: '17:00' },
    morning: { label: t('halfMorning') || 'Morning (07:34-13:00)', start: '07:34', end: '13:00' },
    afternoon: { label: t('halfAfternoon') || 'Afternoon (12:30-17:00)', start: '12:30', end: '17:00' },
    custom: { label: t('custom') || 'Custom', start: '', end: '' }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, er] = await Promise.all([
        StaffApi.getAll().catch(() => ({ data: [] })),
        TimeEntriesApi.getAll().catch(() => ({ data: [] })),
      ]);
      const s = sr.data?.data ?? sr.data ?? [];
      const e = er.data?.data ?? er.data ?? [];
      setStaff(Array.isArray(s) ? s : []);
      setEntries(Array.isArray(e) ? e : []);
      if (Array.isArray(s) && s.length > 0 && !selectedStaff) {
        setSelectedStaff(s[0]._id ?? s[0].id ?? '');
      }
    } catch (err) {
      addToast(t('errorLoadingRecords'), 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStaff, addToast, t]);

  useEffect(() => { load(); }, [load]);

  const handleClockIn = async () => {
    if (!selectedStaff) return;
    setActioning(true);
    try {
      await clockIn(selectedStaff);
      addToast(t('clockInSuccess') || 'Clocked in successfully', 'success');
      load();
    } catch (err) {
      addToast(err.response?.data?.message || t('clockInFailed'), 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedStaff) return;
    setActioning(true);
    try {
      await clockOut(selectedStaff);
      addToast(t('clockOutSuccess') || 'Clocked out successfully', 'success');
      load();
    } catch (err) {
      addToast(err.response?.data?.message || t('clockOutFailed'), 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    setActioning(true);
    try {
      const start = `${manualForm.date}T${manualForm.start}:00.000Z`;
      const end = `${manualForm.date}T${manualForm.end}:00.000Z`;
      await TimeEntriesApi.create({ 
        staffId: manualForm.staffId || selectedStaff, 
        clockIn: start, 
        clockOut: end, 
        confirmed: true 
      });
      addToast(t('shiftRecorded') || 'Shift recorded', 'success');
      setShowManualModal(false);
      load();
    } catch (err) {
      addToast(t('recordFailed') || 'Failed to record shift', 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleConfirm = async (id) => {
    setActioning(true);
    try {
      await TimeEntriesApi.update(id, { confirmed: true });
      load();
    } catch (err) {
      addToast(t('errorVerifying'), 'error');
    } finally {
      setActioning(false);
    }
  };

  const staffEntries = useMemo(() => entries.filter(e => e.staffId === selectedStaff), [entries, selectedStaff]);
  
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Start of week (Sunday)
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);
    
    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayHours = staffEntries
      .filter(e => e.clockIn?.startsWith(todayStr))
      .reduce((total, e) => total + calculateDiff(e.clockIn, e.clockOut || new Date().toISOString()), 0);

    const weekHours = staffEntries
      .filter(e => new Date(e.clockIn) >= startOfWeek)
      .reduce((total, e) => total + calculateDiff(e.clockIn, e.clockOut || (e.clockIn.startsWith(todayStr) ? new Date().toISOString() : e.clockIn)), 0);

    const monthHours = staffEntries
      .filter(e => new Date(e.clockIn) >= startOfMonth)
      .reduce((total, e) => total + calculateDiff(e.clockIn, e.clockOut || (e.clockIn.startsWith(todayStr) ? new Date().toISOString() : e.clockIn)), 0);

    return { todayHours, weekHours, monthHours };
  }, [staffEntries]);

  const timeDisplay = now.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateDisplay = now.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page-container" style={{ paddingBottom: 100 }}>
      {/* HEADER SECTION */}
      <div style={{ background: 'linear-gradient(135deg, #1565c0, #1976d2)', padding: '40px 30px', borderRadius: 24, color: 'white', marginBottom: 25, boxShadow: '0 15px 35px rgba(21, 101, 192, 0.25)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, fontSize: '12rem', opacity: 0.1 }}>🕒</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 }}>{dateDisplay}</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, margin: '10px 0' }}>{timeDisplay}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 25 }}>
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>{t('currentlyViewing') || 'Currently Tracking'}:</span>
            <select
              className="input"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '10px 20px', width: 'auto', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
            >
              {staff.map(s => <option key={s._id} value={s._id} style={{ color: '#333' }}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 30 }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px', borderTop: '6px solid #43a047', borderRadius: 16 }}>
          <div style={{ color: '#43a047', fontSize: '2rem', fontWeight: 900 }}>{stats.todayHours.toFixed(1)} <small style={{ fontSize: '0.9rem' }}>{t('hoursShort') || 'h'}</small></div>
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginTop: 5, fontWeight: 700 }}>{t('today') || 'Today'}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px', borderTop: '6px solid #1976d2', borderRadius: 16 }}>
          <div style={{ color: '#1976d2', fontSize: '2rem', fontWeight: 900 }}>{stats.weekHours.toFixed(1)} <small style={{ fontSize: '0.9rem' }}>{t('hoursShort') || 'h'}</small></div>
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginTop: 5, fontWeight: 700 }}>{t('thisWeek') || 'This Week'}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px', borderTop: '6px solid #8e24aa', borderRadius: 16 }}>
          <div style={{ color: '#8e24aa', fontSize: '2rem', fontWeight: 900 }}>{stats.monthHours.toFixed(1)} <small style={{ fontSize: '0.9rem' }}>{t('hoursShort') || 'h'}</small></div>
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginTop: 5, fontWeight: 700 }}>{t('thisMonth') || 'This Month'}</div>
        </div>
      </div>

      {/* QUICK CLOCK ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
        <button 
          onClick={handleClockIn} 
          disabled={actioning}
          style={{ background: '#43a047', color: '#fff', border: 'none', padding: '25px', borderRadius: 20, fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 15px rgba(67, 160, 71, 0.3)', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <span style={{ fontSize: '2.5rem' }}>⏱️</span> {t('clockIn')}
        </button>
        <button 
          onClick={handleClockOut} 
          disabled={actioning}
          style={{ background: '#e53935', color: '#fff', border: 'none', padding: '25px', borderRadius: 20, fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 15px rgba(229, 57, 53, 0.3)', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <span style={{ fontSize: '2.5rem' }}>⏹️</span> {t('clockOut')}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: '#444', fontSize: '1.4rem' }}>{t('timeLog') || 'Time Log'}</h3>
        <button 
          onClick={() => setShowManualModal(true)}
          style={{ background: 'white', border: '2px dashed #ccc', padding: '8px 20px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, color: '#666' }}
        >
          ➕ {t('manualEntry') || 'Manual Entry'}
        </button>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {staffEntriesByMonth(staffEntries).map((monthGroup, idx) => (
            <div key={monthGroup.month} style={{ marginBottom: 20 }}>
              <div style={{ background: '#f5f5f5', padding: '10px 20px', borderRadius: 10, marginBottom: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem', color: '#555' }}>{monthGroup.month}</strong>
                <span style={{ color: '#1565c0', fontWeight: 800 }}>Total: {monthGroup.totalHours.toFixed(1)} {t('hoursShort') || 'hrs'}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {monthGroup.entries.map(e => {
                  const duration = calculateDiff(e.clockIn, e.clockOut);
                  return (
                    <div key={e._id} style={{ background: 'white', padding: '15px 20px', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.03)', borderLeft: `4px solid ${e.confirmed ? '#4caf50' : '#ff9800'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                         <div style={{ background: '#fcfcfc', padding: '8px', borderRadius: 8, textAlign: 'center', minWidth: 60, border: '1px solid #eee' }}>
                           <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888' }}>{new Date(e.clockIn).toLocaleDateString([], { weekday: 'short' })}</div>
                           <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{new Date(e.clockIn).getDate()}</div>
                         </div>
                         <div>
                           <div style={{ fontWeight: 600, color: '#444' }}>{formatTime(e.clockIn, lang)} → {formatTime(e.clockOut, lang)}</div>
                           {!e.confirmed && <span style={{ fontSize: '0.75rem', background: '#fff3e0', color: '#e65100', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{t('pendingApproval') || 'PENDING APPROVAL'}</span>}
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1565c0' }}>{duration.toFixed(1)} <small style={{ fontSize: '0.8rem' }}>{t('hoursShort') || 'h'}</small></div>
                        {!e.confirmed && <button onClick={() => handleConfirm(e._id)} style={{ background: '#eee', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', marginTop: 4 }}>{t('approve') || 'APPROVE'}</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {staffEntries.length === 0 && (
            <div className="empty-state" style={{ background: 'white', padding: '40px', borderRadius: 16 }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>⌛</div>
              <p style={{ color: '#888', fontWeight: 600 }}>No time entries found for this staff member.</p>
            </div>
          )}
        </div>
      )}

      {/* MANUAL ENTRY MODAL */}
      {showManualModal && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ maxWidth: 450, borderRadius: 24 }}>
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 20px 0' }}>Add Manual Shift</h3>
            <form onSubmit={handleManualEntry} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="input" value={manualForm.date} onChange={e => setManualForm({...manualForm, date: e.target.value})} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div>
                  <label className="form-label">Start Time</label>
                  <input type="time" className="input" value={manualForm.start} onChange={e => setManualForm({...manualForm, start: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <input type="time" className="input" value={manualForm.end} onChange={e => setManualForm({...manualForm, end: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn" style={{ flex: 1, background: '#eee' }} onClick={() => setShowManualModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// HEPLER
function staffEntriesByMonth(entries) {
  const groups = {};
  entries.forEach(e => {
    const d = new Date(e.clockIn);
    const month = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[month]) groups[month] = { month, entries: [], totalHours: 0 };
    groups[month].entries.push(e);
    groups[month].totalHours += calculateDiff(e.clockIn, e.clockOut);
  });
  
  return Object.values(groups).sort((a,b) => new Date(b.entries[0].clockIn) - new Date(a.entries[0].clockIn));
}
