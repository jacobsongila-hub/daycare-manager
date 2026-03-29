import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEventsApi, ShiftRequestsApi, TimeEntriesApi, StaffApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useConfirm } from '../context/ConfirmContext';

export default function CalendarView({ readOnly = false }) {
  const [events, setEvents] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const { confirm } = useConfirm();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editEvent, setEditEvent] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, sRes, tRes, stRes] = await Promise.all([
        CalendarEventsApi.getAll().catch(() => ({ data: [] })),
        ShiftRequestsApi.getAll().catch(() => ({ data: [] })),
        TimeEntriesApi.getAll().catch(() => ({ data: [] })),
        StaffApi.getAll().catch(() => ({ data: [] }))
      ]);
      
      setEvents(Array.isArray(eRes.data) ? eRes.data : []);
      setStaff(Array.isArray(stRes.data) ? stRes.data : []);
      
      const approvedShifts = (Array.isArray(sRes.data) ? sRes.data : []).filter(s => s.status === 'Approved');
      const confirmedTime = (Array.isArray(tRes.data) ? tRes.data : []).filter(t => t.confirmed);
      
      const mergedShifts = [
        ...approvedShifts.map(s => ({ ...s, type: 'Planned Shift', isPlanned: true })),
        ...confirmedTime.map(t => ({ 
          ...t, 
          date: t.clockIn?.split('T')[0], 
          type: 'Actual Shift', 
          isActual: true,
          displayTime: `${new Date(t.clockIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${t.clockOut ? new Date(t.clockOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}`
        }))
      ];
      setShifts(mergedShifts);
    } catch (err) {
      addToast(t('errorLoadingCalendar') || 'Failed to load calendar data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => { loadData(); }, [loadData]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

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
        addToast(t('eventUpdated') || 'Event updated', 'success');
      } else {
        await CalendarEventsApi.create(data);
        addToast(t('eventSaved') || 'Event saved', 'success');
      }
      setShowModal(false);
      loadData();
    } catch(err) { addToast(t('errorSaving') || 'Error saving event', 'error'); }
  };

  const handleDelete = async () => {
    if(!editEvent) return;
    if(!(await confirm(t('confirmDelete') || 'Clear event for this day?', 'Confirm Delete', true))) return;
    try {
      await CalendarEventsApi.delete(editEvent._id);
      addToast(t('eventDeleted') || 'Event removed', 'success');
      setShowModal(false);
      loadData();
    } catch(err) { addToast(t('errorDeleting') || 'Error deleting event', 'error'); }
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="btn">◀</button>
        <h3 style={{ margin: 0 }}>{t(monthNames[month].toLowerCase()) || monthNames[month]} {year}</h3>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="btn">▶</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, textAlign: 'center', fontWeight: 'bold', color: '#888', marginBottom: 10, fontSize: '0.75rem' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {days.map((d, i) => {
            if (!d) return <div key={`pad-${i}`} />;
            
            const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const event = events.find(e => e.date === dayStr);
            const dayShifts = shifts.filter(s => s.date === dayStr);
            const isToday = dayStr === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={dayStr} 
                onClick={() => handleDayClick(dayStr)}
                style={{ 
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', padding: 4, borderRadius: 8, 
                  cursor: readOnly ? 'default' : 'pointer',
                  border: isToday ? '2px solid #2196f3' : '1px solid #eee',
                  background: event ? (event.color || '#2196f3') : 'white',
                  color: event ? 'white' : '#1a1a1a',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: isToday ? '0 0 10px rgba(33, 150, 243, 0.3)' : 'none',
                  transition: 'transform 0.1s'
                }}
                className="calendar-day"
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 2 }}>{d}</div>
                
                {/* General Note Indicator */}
                {event && (
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 700, 
                      background: 'rgba(0,0,0,0.1)', 
                      padding: '2px 4px', 
                      borderRadius: 4, 
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {event.type}
                    </div>
                    {event.note && (
                      <div style={{ fontSize: '0.6rem', opacity: 0.9, lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.note}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {dayShifts.slice(0, 3).map((s, idx) => (
                    <div key={idx} style={{ 
                      width: 6, height: 6, borderRadius: '50%', 
                      background: s.isActual ? '#4caf50' : '#ff9800',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }} title={staff.find(st => st._id === s.staffId)?.name} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {showModal && !readOnly && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
             <h3>{t('eventFor') || 'Event for'} {selectedDate}</h3>
             <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
               <select name="type" defaultValue={editEvent?.type || 'Event'} required className="input">
                 <option value="Event">📅 {t('event') || 'Event'}</option>
                 <option value="Holiday">🔴 {t('holiday') || 'Holiday'}</option>
                 <option value="Closed">⚪ {t('closed') || 'Closed'}</option>
                 <option value="Open">🟢 {t('open') || 'Open'}</option>
               </select>
               <input name="note" defaultValue={editEvent?.note} placeholder={t('eventNote') || "Event Note"} className="input" />
               <select name="color" defaultValue={editEvent?.color || '#2196f3'} required className="input">
                 <option value="#2196f3">Blue</option>
                 <option value="#f44336">Red</option>
                 <option value="#4caf50">Green</option>
               </select>
               <div className="modal-actions">
                 {editEvent && <button type="button" className="btn" style={{ color: '#f44336' }} onClick={handleDelete}>{t('delete')}</button>}
                 <button type="button" className="btn" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                 <button type="submit" className="btn btn-primary">{t('save')}</button>
               </div>
             </form>
          </div>
        </div>
      )}

      <div style={{ marginTop: 25, borderTop: '1px solid #eee', paddingTop: 15 }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: 10 }}>{t('scheduleFor') || 'Schedule for'} {monthNames[month]}</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).map(e => (
             <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: '#f9f9f9', borderRadius: 8, fontSize: '0.85rem' }}>
                <div style={{ background: e.color, width: 10, height: 10, borderRadius: '50%' }} />
                <span>{e.date}: <strong>{e.type}</strong> {e.note && `- ${e.note}`}</span>
             </div>
          ))}
          {shifts.filter(s => s.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).map((s, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: s.isActual ? '#e8f5e9' : '#f3e5f5', borderRadius: 8, fontSize: '0.85rem' }}>
                <span>{s.isActual ? '✅' : '🕙'} {s.date}: <strong>{staff.find(st => st._id === s.staffId)?.name}</strong> {s.isActual ? `(Worked: ${s.displayTime})` : `(Planned: ${s.start}-${s.end})`}</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
