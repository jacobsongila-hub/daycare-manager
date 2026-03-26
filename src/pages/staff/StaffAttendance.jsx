import React, { useState, useEffect } from 'react';
import { ChildrenApi, AttendanceApi } from '../../services/api';

export default function StaffAttendance() {
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  // Default to today
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([ChildrenApi.getAll(), AttendanceApi.getAll()]);
      setChildren(cRes.data || []);
      
      const daysAtt = (aRes.data || []).filter(a => a.date === date);
      const dict = {};
      daysAtt.forEach(a => { dict[a.childId] = a; });
      setAttendance(dict);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [date]);

  const updateStatus = async (childId, newStatus) => {
    try {
      const payload = { childId, date, status: newStatus };
      if (newStatus === 'Present') {
        payload.checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const res = await AttendanceApi.create(payload); // mark route upserts correctly in backend
      setAttendance(prev => ({ ...prev, [childId]: res.data }));
      loadData();
    } catch(err) { alert('Update failed'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Complete Attendance Roster</h2>
        <input type="date" className="input" style={{ width: 150 }} value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div style={{ background: 'var(--card-bg)', padding: 15, borderRadius: 12, display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#4caf50', fontWeight: 'bold' }}>
             {Object.values(attendance).filter(a => a.status === 'Present').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Present</div>
        </div>
        <div style={{ width: 1, background: '#eee' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#f44336', fontWeight: 'bold' }}>
             {Object.values(attendance).filter(a => a.status === 'Absent').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Absent</div>
        </div>
        <div style={{ width: 1, background: '#eee' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', color: '#9e9e9e', fontWeight: 'bold' }}>
             {children.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Enrolled</div>
        </div>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {children.length === 0 ? <p className="empty-state">No children found.</p> : children.map(child => {
            const att = attendance[child._id] || { status: 'Unmarked' };
            const isPresent = att.status === 'Present';
            const isAbsent = att.status === 'Absent';
            
            return (
              <div key={child._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '15px 20px', borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ width: 45, height: 45, borderRadius: 25, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {child.avatar ? <img src={child.avatar} alt="avatar" style={{width: 45, height: 45, borderRadius: 25, objectFit: 'cover'}} /> : '👶'}
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
                  <button onClick={() => updateStatus(child._id, 'Present')} style={{ flex: 1, padding: '8px 15px', border: 'none', borderRadius: 6, cursor: 'pointer', background: isPresent ? '#4caf50' : 'transparent', color: isPresent ? 'white' : '#666', fontWeight: isPresent ? 'bold' : 'normal' }}>
                    Present
                  </button>
                  <button onClick={() => updateStatus(child._id, 'Absent')} style={{ flex: 1, padding: '8px 15px', border: 'none', borderRadius: 6, cursor: 'pointer', background: isAbsent ? '#f44336' : 'transparent', color: isAbsent ? 'white' : '#666', fontWeight: isAbsent ? 'bold' : 'normal' }}>
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
