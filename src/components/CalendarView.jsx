import { useNotification } from '../context/NotificationContext';

export default function CalendarView({ readOnly = false }) {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editEvent, setEditEvent] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await CalendarEventsApi.getAll();
      setEvents(res.data || []);
    } catch (err) {
      console.error('Error loading events', err);
      addToast('Failed to load calendar events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 0 = Sunday

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (dayStr) => {
    if (readOnly) return;
    const existing = events.find(e => e.date === dayStr);
    setEditEvent(existing || null);
    setSelectedDate(dayStr);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.date = selectedDate;

    try {
      if (editEvent) {
        await CalendarEventsApi.update(editEvent._id, data);
        addToast('Event updated', 'success');
      } else {
        await CalendarEventsApi.create(data);
        addToast('Event saved', 'success');
      }
      setShowModal(false);
      loadData();
    } catch(err) { 
      addToast('Error saving event', 'error'); 
    }
  };

  const handleDelete = async () => {
    if(!editEvent) return;
    if(!window.confirm('Clear event for this day?')) return;
    try {
      await CalendarEventsApi.delete(editEvent._id);
      addToast('Event removed', 'success');
      setShowModal(false);
      loadData();
    } catch(err) { 
      addToast('Error deleting event', 'error'); 
    }
  };

  // Render Grid
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null); // padding
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={handlePrevMonth} className="btn" style={{ padding: '8px 15px' }}>◀</button>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{monthNames[month]} {year}</h3>
        <button onClick={handleNextMonth} className="btn" style={{ padding: '8px 15px' }}>▶</button>
      </div>

      {/* Days of Week */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, textAlign: 'center', fontWeight: 'bold', color: '#888', marginBottom: 10, fontSize: '0.8rem', textTransform: 'uppercase' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Grid */}
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px 0' }}>
          {days.map((d, i) => {
            if (!d) return <div key={`pad-${i}`} style={{ background: 'transparent' }} />;
            
            const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const event = events.find(e => e.date === dayStr);
            const isToday = dayStr === new Date().toISOString().split('T')[0];

            // CONSECUTIVE LOGIC
            const prevDayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d-1).padStart(2,'0')}`;
            const nextDayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d+1).padStart(2,'0')}`;
            const hasPrev = event && events.find(e => e.date === prevDayStr && e.type === event.type);
            const hasNext = event && events.find(e => e.date === nextDayStr && e.type === event.type);

            return (
              <div 
                key={dayStr} 
                onClick={() => handleDayClick(dayStr)}
                style={{ 
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', padding: 5, borderRadius: event ? (hasPrev && hasNext ? '0' : hasPrev ? '0 8px 8px 0' : hasNext ? '8px 0 0 8px' : '8px') : '8px', 
                  cursor: readOnly ? 'default' : 'pointer',
                  border: isToday ? '2px solid #2196f3' : '1px solid #f5f5f5',
                  background: event ? (event.color || '#2196f3') : 'white',
                  color: event ? 'white' : '#333',
                  margin: event ? '0' : '2px',
                  transition: 'transform 0.1s',
                  zIndex: isToday ? 2 : 1,
                  position: 'relative'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{d}</div>
                {event && !hasPrev && (
                  <div style={{ fontSize: '0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 'auto', background: 'rgba(0,0,0,0.15)', padding: '2px 4px', borderRadius: 4, fontWeight: 700 }}>
                    {event.type}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Modal */}
      {showModal && !readOnly && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
             <h3>Event for {selectedDate}</h3>
             <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
               <select name="type" defaultValue={editEvent?.type || 'Event'} required className="input">
                 <option value="Event">📅 Event</option>
                 <option value="Holiday">🔴 Holiday</option>
                 <option value="Half Day">🟡 Half Day</option>
                 <option value="Closed">⚪ Closed</option>
                 <option value="Open">🟢 Open</option>
               </select>
               <input name="note" defaultValue={editEvent?.note} placeholder="Event Note (e.g. Field Trip)" className="input" />
               <select name="color" defaultValue={editEvent?.color || '#2196f3'} required className="input">
                 <option value="#2196f3">Blue (Standard)</option>
                 <option value="#f44336">Red (Holiday/Closed)</option>
                 <option value="#ff9800">Orange (Event)</option>
                 <option value="#4caf50">Green (Open)</option>
               </select>

               <div className="modal-actions">
                 {editEvent && <button type="button" className="btn" style={{ color: '#f44336' }} onClick={handleDelete}>Delete</button>}
                 <div style={{ flex: 1 }} />
                 <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                 <button type="submit" className="btn btn-primary">Save</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* List view below calendar */}
      <div style={{ marginTop: 25 }}>
        <h4 style={{ color: '#555', marginBottom: 10 }}>Upcoming Events in {monthNames[month]}</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length === 0 ? (
            <p style={{ color: '#888', fontSize: '0.9rem', fontStyle: 'italic' }}>No events scheduled.</p>
          ) : (
            events.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).map(e => (
              <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 10, background: '#f9f9f9', borderRadius: 8 }}>
                 <div style={{ background: e.color, width: 15, height: 15, borderRadius: '50%' }} />
                 <div>
                   <strong style={{ fontSize: '1rem' }}>{e.date} | {e.type}</strong>
                   {e.note && <div style={{ fontSize: '0.85rem', color: '#666' }}>{e.note}</div>}
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
