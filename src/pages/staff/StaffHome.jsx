import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChildrenApi, AttendanceApi, TimeEntriesApi } from '../../services/api';
import { Link } from 'react-router-dom';

export default function StaffHome() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [timeEntry, setTimeEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const [cRes, aRes, tRes] = await Promise.all([
        ChildrenApi.getAll(),
        AttendanceApi.getAll(),
        TimeEntriesApi.getAll()
      ]);
      
      const kids = cRes.data || [];
      // For a real app, filter kids by staff assignment. 
      // Here we assume staff sees all kids or a subset. We'll show all for demo.
      setChildren(kids);

      const daysAtt = (aRes.data || []).filter(a => a.date === todayStr);
      const dict = {};
      daysAtt.forEach(a => { dict[a.childId] = a; });
      setAttendance(dict);

      // Find if staff is currently clocked in
      const myEntries = (tRes.data || []).filter(t => t.staffId === user?.id);
      const openEntry = myEntries.find(t => t.type === 'in' && !t.clockOut);
      setTimeEntry(openEntry || null);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { Object.keys(user || {}).length > 0 && loadData(); }, [user]);

  const handleClockToggle = async () => {
    try {
      if (timeEntry) {
        // Clock out
        await TimeEntriesApi.create({ staffId: user.id, type: 'out', timestamp: new Date().toISOString() });
      } else {
        // Clock in
        await TimeEntriesApi.create({ staffId: user.id, type: 'in', timestamp: new Date().toISOString() });
      }
      loadData();
    } catch (err) { alert('Error updating time entry'); }
  };

  const updateStatus = async (childId, status) => {
    try {
      const payload = { childId, date: todayStr, status };
      if (status === 'Present' && attendance[childId]?.status !== 'Present') {
        payload.checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      await AttendanceApi.create(payload); // Actually marks attendance
      loadData();
    } catch (err) { alert('Failed to mark'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)', padding: 25, borderRadius: 16, color: 'white', marginBottom: 25, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 5px 0' }}>Hi, {user?.name?.split(' ')[0] || 'Staff'}! 👋</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Here is your daily overview</p>
        
        <div style={{ display: 'flex', gap: 15, marginTop: 20 }}>
          <button 
            onClick={handleClockToggle}
            style={{ 
              background: timeEntry ? '#F44336' : 'white', 
              color: timeEntry ? 'white' : '#2e7d32', 
              border: 'none', padding: '12px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', flex: 1,
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            {timeEntry ? '⏹️ Clock Out' : '▶️ Clock In'}
          </button>
          <Link to="/staff/shifts" className="btn" style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            📅 My Schedule
          </Link>
        </div>
      </div>

      <h3 style={{ margin: '0 0 15px 0', color: '#444' }}>Quick Attendance (Today)</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children.length === 0 ? <p className="empty-state">No children assigned.</p> : children.map(child => {
            const att = attendance[child._id] || { status: 'Unmarked' };
            const isPresent = att.status === 'Present';
            
            return (
              <div key={child._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: 15, borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ width: 45, height: 45, borderRadius: 25, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👶</div>
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{child.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: isPresent ? '#4caf50' : '#888' }}>
                      {isPresent ? `In: ${att.checkIn}` : 'Not checked in'}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => updateStatus(child._id, isPresent ? 'Absent' : 'Present')}
                  style={{ padding: '8px 15px', border: 'none', borderRadius: 8, cursor: 'pointer', background: isPresent ? '#e8f5e9' : '#f5f5f5', color: isPresent ? '#2e7d32' : '#666', fontWeight: 'bold' }}
                >
                  {isPresent ? '✓ Present' : 'Mark In'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
