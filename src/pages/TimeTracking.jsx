import React, { useState, useEffect, useCallback } from 'react';
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

  const SHIFT_PRESETS = {
    full: { label: t('fullDay'), start: '07:45', end: '17:00' },
    morning: { label: t('halfMorning'), start: '07:34', end: '13:00' },
    afternoon: { label: t('halfAfternoon'), start: '12:30', end: '17:00' },
    custom: { label: t('custom'), start: '', end: '' }
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
    if (!selectedStaff) { addToast(t('selectStaffFirst') || 'Select staff first', 'warning'); return; }
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
    if (!selectedStaff) { addToast(t('selectStaffFirst') || 'Select staff first', 'warning'); return; }
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
      addToast(t('timesheetVerified'), 'success');
      load();
    } catch (err) {
      addToast(t('errorVerifying'), 'error');
    } finally {
      setActioning(false);
    }
  };

  const onPresetChange = (preset) => {
    const p = SHIFT_PRESETS[preset];
    setManualForm(prev => ({ ...prev, preset, start: p.start, end: p.end }));
  };

  const staffEntries = entries.filter(e => (e.staffId === selectedStaff));
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHours = staffEntries
    .filter(e => e.clockIn?.startsWith(todayStr))
    .reduce((total, e) => total + calculateDiff(e.clockIn, e.clockOut || new Date().toISOString()), 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekHours = staffEntries
    .filter(e => new Date(e.clockIn) >= startOfWeek)
    .reduce((total, e) => total + calculateDiff(e.clockIn, e.clockOut || (e.clockIn.startsWith(todayStr) ? new Date().toISOString() : e.clockIn)), 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthHours = staffEntries
    .filter(e => new Date(e.clockIn) >= startOfMonth)
    .reduce((total, e) => total + calculateDiff(e.clockIn, e.clockOut || (e.clockIn.startsWith(todayStr) ? new Date().toISOString() : e.clockIn)), 0);

  const timeDisplay = now.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateDisplay = now.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ padding: '24px 20px', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color:'white', borderRadius: '0 0 24px 24px', textAlign: 'center', marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>{dateDisplay}</div>
        <div style={{ fontSize: '3.2rem', fontWeight: 800, margin: '12px 0', letterSpacing: -1 }}>{timeDisplay}</div>
        
        {staff.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 15 }}>
            <select
              className="input"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 14, padding: '12px 20px', maxWidth: '90%', fontSize: '1.1rem', fontWeight: 600, backdropFilter: 'blur(10px)' }}
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
            >
              {staff.map(s => <option key={s._id} value={s._id} style={{ color: '#333' }}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ padding: '0 20px', display: 'flex', gap: 10, marginBottom: 25 }}>
        <div className="card" style={{ flex: 1, textAlign: 'center', borderTop: '4px solid var(--success)', padding: 15 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{todayHours.toFixed(1)}h</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase', margin: '4px 0 0 0' }}>Today</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', borderTop: '4px solid var(--primary)', padding: 15 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{weekHours.toFixed(1)}h</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase', margin: '4px 0 0 0' }}>This Week</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', borderTop: '4px solid #9c27b0', padding: 15 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9c27b0' }}>{monthHours.toFixed(1)}h</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase', margin: '4px 0 0 0' }}>This Month</div>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 30 }}>
        <button 
          onClick={handleClockIn} 
          disabled={actioning || !selectedStaff}
          style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '20px', borderRadius: 20, fontSize: '1.1rem', fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(67, 160, 71, 0.3)', transition: 'transform 0.1s' }}
        >
          <span style={{ fontSize: '1.8rem' }}>▶</span> {t('clockIn')}
        </button>
        <button 
          onClick={handleClockOut} 
          disabled={actioning || !selectedStaff}
          style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '20px', borderRadius: 20, fontSize: '1.1rem', fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(229, 57, 53, 0.3)', transition: 'transform 0.1s' }}
        >
          <span style={{ fontSize: '1.8rem' }}>■</span> {t('clockOut')}
        </button>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 35 }}>
        <button 
          onClick={() => { setManualForm({ ...manualForm, staffId: selectedStaff }); setShowManualModal(true); }}
          className="btn" 
          style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#f8fafc', color: 'var(--text)', fontWeight: 700, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          ➕ {t('addUserAccount') || 'Add Manual Entry'}
        </button>
      </div>

      {/* RECENT ENTRIES */}
      <div style={{ padding: '0 20px' }}>
        <h3 className="section-label">{t('recentNotes') || 'Recent Timesheets'}</h3>
        {loading ? <div className="spinner"></div> : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⏲️</div>
            <p>{t('noEntries')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.slice().reverse().slice(0, 10).map(entry => {
              const staffMember = staff.find(s => s._id === entry.staffId);
              const isConfirmed = entry.confirmed;
              const duration = calculateDiff(entry.clockIn, entry.clockOut);
              
              return (
                <div key={entry._id} className="card" style={{ border: isConfirmed ? '1px solid var(--border)' : '2.5px solid #ffe0b2', padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{staffMember?.name || 'Staff Member'}</div>
                    <div className={`badge badge-${isConfirmed ? 'confirmed' : 'pending'}`}>
                      {isConfirmed ? `✓ ${t('confirmed')}` : t('pending')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    <div style={{ lineHeight: 1.5 }}>
                      📅 {formatDate(entry.clockIn, lang)} <br/>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>▶ {formatTime(entry.clockIn, lang)}</span>
                      {entry.clockOut && <span style={{ color: 'var(--danger)', fontWeight: 700 }}> — ■ {formatTime(entry.clockOut, lang)}</span>}
                    </div>
                    {entry.clockOut && (
                      <div style={{ textAlign: 'right', alignSelf: 'flex-end' }}>
                        <strong style={{ fontSize: '1.4rem', color: 'var(--text)', letterSpacing: -0.5 }}>{duration.toFixed(1)} {t('hours') || 'hrs'}</strong>
                      </div>
                    )}
                  </div>
                  
                  {!isConfirmed && entry.clockOut && (
                    <button 
                      onClick={() => handleConfirm(entry._id)}
                      className="btn btn-secondary"
                      style={{ width: '100%', marginTop: 18, fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary-dark)' }}
                      disabled={actioning}
                    >
                      {t('verifyTimesheet')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MANUAL ENTRY MODAL */}
      {showManualModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">{t('addUserAccount') || 'Manual Entry'}</h3>
            <form onSubmit={handleManualEntry} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
              <div>
                <label className="form-label">{t('fullNameReq')}</label>
                <select className="input" value={manualForm.staffId} onChange={e => setManualForm({...manualForm, staffId: e.target.value})} required>
                  <option value="">{t('selectStaff') || 'Select...'}</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">{t('date')}</label>
                  <input type="date" className="input" value={manualForm.date} onChange={e => setManualForm({...manualForm, date: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">{t('shift')}</label>
                  <select className="input" value={manualForm.preset} onChange={e => onPresetChange(e.target.value)}>
                    {Object.entries(SHIFT_PRESETS).map(([key, p]) => (
                      <option key={key} value={key}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">{t('clockIn')}</label>
                  <input type="time" className="input" value={manualForm.start} onChange={e => setManualForm({...manualForm, start: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">{t('clockOut')}</label>
                  <input type="time" className="input" value={manualForm.end} onChange={e => setManualForm({...manualForm, end: e.target.value})} required />
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowManualModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={actioning}>{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
