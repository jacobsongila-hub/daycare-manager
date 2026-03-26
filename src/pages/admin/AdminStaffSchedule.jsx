import React, { useState, useEffect } from 'react';
import { ShiftRequestsApi, StaffApi } from '../../services/api';

export default function AdminStaffSchedule() {
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState({});
  const [loading, setLoading] = useState(true);

  // Set week view based on today
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day; // Adjust to Sunday
    return new Date(today.setDate(diff));
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shRes, stfRes] = await Promise.all([ShiftRequestsApi.getAll(), StaffApi.getAll()]);
      
      const stf = stfRes.data || [];
      const dict = {};
      stf.forEach(s => { dict[s._id] = s.name; });
      setStaff(dict);

      // Only care about Approved shifts for the schedule
      const approved = (shRes.data || []).filter(s => s.status === 'Approved');
      setShifts(approved);

    } catch (err) {
      console.error('Error loading schedule', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const changeWeek = (offset) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (offset * 7));
    setCurrentWeekStart(newStart);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
       const d = new Date(currentWeekStart);
       d.setDate(d.getDate() + i);
       days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e88e5, #1565c0)', padding: 25, borderRadius: 16, color: 'white', marginBottom: 25 }}>
        <h2 style={{ margin: '0 0 5px 0' }}>🗓️ Staff Weekly Schedule</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Approved staff shifts plotted on a timeline.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="btn" onClick={() => changeWeek(-1)}>◀ Prev Week</button>
        <h3 style={{ margin: 0 }}>
          {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
        </h3>
        <button className="btn" onClick={() => changeWeek(1)}>Next Week ▶</button>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <table style={{ minWidth: 800, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: 15, borderBottom: '2px solid #ddd', textAlign: 'left', width: 150 }}>Staff Member</th>
                {weekDays.map((d, i) => (
                  <th key={i} style={{ padding: 15, borderBottom: '2px solid #ddd', textAlign: 'center' }}>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}<br/>
                    <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal' }}>{d.getDate()}/{d.getMonth()+1}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(staff).map(staffId => {
                const staffName = staff[staffId];
                return (
                  <tr key={staffId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 15, fontWeight: 'bold' }}>👤 {staffName}</td>
                    {weekDays.map((d, i) => {
                       const dStr = d.toISOString().split('T')[0];
                       const myShifts = shifts.filter(s => s.staffId === staffId && s.date === dStr);
                       
                       return (
                         <td key={i} style={{ padding: 10, textAlign: 'center', verticalAlign: 'top' }}>
                            {myShifts.length === 0 ? <span style={{ color: '#ccc' }}>-</span> : (
                               myShifts.map((sh, idx) => (
                                 <div key={idx} style={{ background: '#e3f2fd', color: '#1565c0', padding: '5px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 4 }}>
                                   {sh.start} - {sh.end}
                                 </div>
                               ))
                            )}
                         </td>
                       );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
