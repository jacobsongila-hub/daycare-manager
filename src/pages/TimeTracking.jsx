import { useNotification } from '../context/NotificationContext';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  const now = useClock();
  const [staff, setStaff] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const { addToast } = useNotification();

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
      addToast('Failed to load records', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStaff, addToast]);

  useEffect(() => { load(); }, []);

  const handleClockIn = async () => {
    if (!selectedStaff) { addToast('Select staff member first', 'warning'); return; }
    setActioning(true);
    try {
      await clockIn(selectedStaff);
      addToast('Clocked in successfully', 'success');
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to clock in', 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedStaff) { addToast('Select staff member first', 'warning'); return; }
    setActioning(true);
    try {
      await clockOut(selectedStaff);
      addToast('Clocked out successfully', 'success');
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to clock out', 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleConfirm = async (entryId) => {
    try {
      await TimeEntriesApi.update(entryId, { confirmed: true });
      addToast('Timesheet confirmed', 'success');
      load();
    } catch (err) {
      addToast('Confirmation failed', 'error');
    }
  };

  // Stats for selected staff
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

  const timeDisplay = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateDisplay = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', color:'white', borderRadius: '0 0 24px 24px', textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{dateDisplay}</div>
        <div style={{ fontSize: '3rem', fontWeight: 800, margin: '10px 0' }}>{timeDisplay}</div>
        
        {staff.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 15 }}>
            <select
              className="input"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 15px', maxWidth: '80%', fontSize: '1rem', fontWeight: 600 }}
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
            >
              {staff.map(s => <option key={s._id} value={s._id} style={{ color: '#333' }}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ padding: '0 20px', display: 'flex', gap: 15, marginBottom: 25 }}>
        <div style={{ flex: 1, background: 'white', padding: 15, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', borderTop: '4px solid #4caf50' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4caf50' }}>{todayHours.toFixed(1)}h</div>
          <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Today</div>
        </div>
        <div style={{ flex: 1, background: 'white', padding: 15, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', borderTop: '4px solid #2196f3' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2196f3' }}>{weekHours.toFixed(1)}h</div>
          <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>This Week</div>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 30 }}>
        <button 
          onClick={handleClockIn} 
          disabled={actioning || !selectedStaff}
          style={{ background: '#4caf50', color: 'white', border: 'none', padding: '15px', borderRadius: 16, fontSize: '1rem', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, boxShadow: '0 6px 15px rgba(76, 175, 80, 0.2)' }}
        >
          <span style={{ fontSize: '1.5rem' }}>▶</span> Clock In
        </button>
        <button 
          onClick={handleClockOut} 
          disabled={actioning || !selectedStaff}
          style={{ background: '#f44336', color: 'white', border: 'none', padding: '15px', borderRadius: 16, fontSize: '1rem', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, boxShadow: '0 6px 15px rgba(244, 67, 54, 0.2)' }}
        >
          <span style={{ fontSize: '1.5rem' }}>■</span> Clock Out
        </button>
      </div>

      {/* RECENT ENTRIES */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#555', marginBottom: 15 }}>Recent Timesheets</h3>
        {loading ? <div className="spinner"></div> : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f5f5f5', borderRadius: 16, color: '#888' }}>
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>⏲️</div>
            <p>No time entries found yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.slice().reverse().slice(0, 10).map(entry => {
              const staffMember = staff.find(s => s._id === entry.staffId);
              const isConfirmed = entry.confirmed;
              const duration = calculateDiff(entry.clockIn, entry.clockOut);
              
              return (
                <div key={entry._id} style={{ background: 'white', padding: 15, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: isConfirmed ? '1px solid #e0e0e0' : '1px solid #ffe0b2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, color: '#333' }}>{staffMember?.name || 'Staff Member'}</div>
                    <div style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 6, background: isConfirmed ? '#e8f5e9' : '#fff3e0', color: isConfirmed ? '#2e7d32' : '#ef6c00', fontWeight: 700 }}>
                      {isConfirmed ? '✓ CONFIRMED' : 'PENDING'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                    <div>
                      📅 {formatDate(entry.clockIn)} <br/>
                      <span style={{ color: '#4caf50' }}>▶ {formatTime(entry.clockIn)}</span>
                      {entry.clockOut && <span style={{ color: '#f44336' }}> — ■ {formatTime(entry.clockOut)}</span>}
                    </div>
                    {entry.clockOut && (
                      <div style={{ textAlign: 'right', alignSelf: 'flex-end' }}>
                        <strong style={{ fontSize: '1rem', color: '#333' }}>{duration.toFixed(1)} hrs</strong>
                      </div>
                    )}
                  </div>
                  
                  {!isConfirmed && (
                    <button 
                      onClick={() => handleConfirm(entry._id)}
                      style={{ width: '100%', marginTop: 12, background: '#f5f5f5', border: '1px solid #ddd', padding: '8px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Verify Timesheet
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
