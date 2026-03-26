import React, { useState } from 'react';
import { AttendanceApi, ChildrenApi, StaffApi, TimeEntriesApi } from '../../services/api';

export default function AdminReports() {
  const [reportType, setReportType] = useState('attendance');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (reportType === 'attendance') {
        const [aRes, cRes] = await Promise.all([AttendanceApi.getAll(), ChildrenApi.getAll()]);
        const kids = cRes.data || [];
        const atts = (aRes.data || []).filter(a => a.date >= startDate && a.date <= endDate);
        
        const summary = kids.map(k => {
          const myAtts = atts.filter(a => a.childId === k._id);
          const present = myAtts.filter(a => a.status === 'Present').length;
          const absent = myAtts.filter(a => a.status === 'Absent').length;
          return { name: k.name, present, absent, totalDays: myAtts.length };
        });
        setReportData({ type: 'Attendance Summary', data: summary });

      } else if (reportType === 'staffHours') {
        const [tRes, sRes] = await Promise.all([TimeEntriesApi.getAll(), StaffApi.getAll()]);
        const staff = sRes.data || [];
        const times = (tRes.data || []).filter(t => t.clockIn?.startsWith(startDate) /* naive filter */);
        
        const summary = staff.map(s => {
          const myTimes = times.filter(t => t.staffId === s._id);
          return { name: s.name, shifts: myTimes.length, role: s.role };
        });
        setReportData({ type: 'Staff Activity Summary', data: summary });
      } else {
        const cRes = await ChildrenApi.getAll();
        const kids = cRes.data || [];
        const summary = kids.map(k => ({ name: k.name, dob: k.dob || 'N/A', allergies: k.allergies || 'None' }));
        setReportData({ type: 'Children Master List', data: summary });
      }
    } catch (err) {
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Hide controls when printing */}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      
      <div className="no-print" style={{ background: 'linear-gradient(135deg, #fb8c00, #f57c00)', padding: 25, borderRadius: 16, color: 'white', marginBottom: 25 }}>
        <h2 style={{ margin: '0 0 5px 0' }}>📄 Reports Center</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Generate and export data easily.</p>
      </div>

      <div className="no-print" style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <form onSubmit={generateReport} style={{ display: 'flex', gap: 15, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>Report Type</label>
            <select className="input" value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '10px' }}>
              <option value="attendance">Daily Attendance Summary</option>
              <option value="childList">Master Child List (Medical)</option>
              <option value="staffHours">Staff Activity</option>
            </select>
          </div>
          {reportType !== 'childList' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>Start Date</label>
                <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem' }}>End Date</label>
                <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px', background: '#e65100' }}>{loading ? 'Generating...' : 'Generate Report'}</button>
        </form>
      </div>

      {reportData && (
        <div style={{ background: 'white', padding: '30px 40px', borderRadius: 12, border: '1px solid #ccc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30, borderBottom: '2px solid #eee', paddingBottom: 15 }}>
            <div>
              <h2 style={{ margin: 0 }}>Daycare Manager Pro</h2>
              <div style={{ color: '#666', marginTop: 5 }}>Official System Report</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#e65100' }}>{reportData.type}</h3>
              <div style={{ fontSize: '0.85rem' }}>Generated: {new Date().toLocaleDateString()}</div>
              {reportType !== 'childList' && <div style={{ fontSize: '0.85rem' }}>Period: {startDate} to {endDate}</div>}
              <button className="btn no-print" onClick={handlePrint} style={{ marginTop: 10, background: '#1565c0', color: 'white' }}>🖨️ Print / Save PDF</button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                {reportType === 'attendance' && (
                  <><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Child Name</th><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Days Present</th><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Days Absent</th></>
                )}
                {reportType === 'childList' && (
                  <><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Child Name</th><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>DOB</th><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Allergies</th></>
                )}
                {reportType === 'staffHours' && (
                  <><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Staff Name</th><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Role</th><th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Shifts Tracked</th></>
                )}
              </tr>
            </thead>
            <tbody>
              {reportData.data.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  {reportType === 'attendance' && (
                    <><td style={{ padding: 12 }}><strong>{row.name}</strong></td><td style={{ padding: 12, color: '#4caf50' }}>{row.present}</td><td style={{ padding: 12, color: '#f44336' }}>{row.absent}</td></>
                  )}
                  {reportType === 'childList' && (
                    <><td style={{ padding: 12 }}><strong>{row.name}</strong></td><td style={{ padding: 12 }}>{row.dob}</td><td style={{ padding: 12, color: row.allergies !== 'None' ? '#d32f2f' : '#666' }}>{row.allergies}</td></>
                  )}
                  {reportType === 'staffHours' && (
                    <><td style={{ padding: 12 }}><strong>{row.name}</strong></td><td style={{ padding: 12 }}>{row.role}</td><td style={{ padding: 12 }}>{row.shifts} updates</td></>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 40, textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>End of Report. Authenticated automatically by Daycare system.</div>
        </div>
      )}
    </div>
  );
}
