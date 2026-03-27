import React, { useState, useEffect } from 'react';
import { ChildrenApi, AttendanceApi, markAttendance } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function AdminAttendance() {
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([ChildrenApi.getAll(), AttendanceApi.getAll()]);
      const kids = cRes.data || [];
      const atts = aRes.data || [];
      
      setChildren(kids);
      
      // Filter attendance for selected date
      const daysAtt = atts.filter(a => a.date === date);
      const dict = {};
      daysAtt.forEach(a => { dict[a.childId] = a; });
      setAttendance(dict);

    } catch (err) {
      console.error('Error loading attendance', err);
      addToast('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [date]);

  const updateStatus = async (childId, newStatus) => {
    try {
      const payload = { childId, date, status: newStatus };
      if (newStatus === 'Present' && attendance[childId]?.status !== 'Present') {
        payload.checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (newStatus === 'Absent') {
        payload.checkIn = '';
        payload.checkOut = '';
      }
      
      const res = await markAttendance(payload); 
      setAttendance(prev => ({ ...prev, [childId]: res.data }));
      addToast(`Status updated: ${newStatus}`, 'success');
      // No need to reload all data if we update local state correctly
    } catch(err) { 
      console.error(err);
      addToast('Error updating status', 'error'); 
    }
  };

  const markAll = async (status) => {
    try {
      setLoading(true);
      for(let child of children) {
        if(attendance[child._id]?.status !== status) {
          await markAttendance({ childId: child._id, date, status });
        }
      }
      addToast(`All children marked as ${status}`, 'success');
      loadData();
    } catch(err) {
      addToast('Error marking multiple children', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Attendance</h2>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="input" 
          style={{ width: 'auto', padding: '8px 15px' }} 
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn" style={{ background: '#e8f5e9', color: '#2e7d32' }} onClick={() => markAll('Present')}>✅ Mark All Present</button>
        <button className="btn" style={{ background: '#ffebee', color: '#c62828' }} onClick={() => markAll('Absent')}>❌ Mark All Absent</button>
        <button className="btn" onClick={loadData}>🔄 Refresh</button>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children.map(child => {
            const att = attendance[child._id] || { status: 'Unmarked' };
            const isPresent = att.status === 'Present';
            const isAbsent = att.status === 'Absent';
            
            return (
              <div key={child._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '15px 20px', borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 25, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    {child.avatar ? <img src={child.avatar} alt="avatar" style={{width:50, height:50, borderRadius:25, objectFit:'cover'}} /> : '👶'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{child.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                      {att.status === 'Unmarked' ? 'Not marked today' : (
                        <span>
                          {isPresent && att.checkIn && `In: ${att.checkIn}`} 
                          {isPresent && att.checkOut && ` | Out: ${att.checkOut}`}
                          {isAbsent && 'Absent'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 10, background: '#f5f5f5', padding: 4, borderRadius: 8 }}>
                  <button 
                    onClick={() => updateStatus(child._id, 'Present')}
                    style={{ flex: 1, padding: '8px 15px', border: 'none', borderRadius: 6, cursor: 'pointer', background: isPresent ? '#4caf50' : 'transparent', color: isPresent ? 'white' : '#666', fontWeight: isPresent ? 'bold' : 'normal' }}
                  >
                    Present
                  </button>
                  <button 
                    onClick={() => updateStatus(child._id, 'Absent')}
                    style={{ flex: 1, padding: '8px 15px', border: 'none', borderRadius: 6, cursor: 'pointer', background: isAbsent ? '#f44336' : 'transparent', color: isAbsent ? 'white' : '#666', fontWeight: isAbsent ? 'bold' : 'normal' }}
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
