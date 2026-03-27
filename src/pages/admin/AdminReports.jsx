import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { AttendanceApi, ChildrenApi, StaffApi, TimeEntriesApi } from '../../services/api';

export default function AdminReports() {
  const { addToast } = useNotification();
  const [reportType, setReportType] = useState('attendance');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const setPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const generateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (reportType === 'attendance') {
        const [aRes, cRes] = await Promise.all([
          AttendanceApi.getAll().catch(() => ({ data: [] })),
          ChildrenApi.getAll().catch(() => ({ data: [] }))
        ]);
        const kids = Array.isArray(cRes.data) ? cRes.data : [];
        const atts = (Array.isArray(aRes.data) ? aRes.data : []).filter(a => a.date >= startDate && a.date <= endDate);
        
        const summary = kids.map(k => {
          const myAtts = atts.filter(a => a.childId === k._id);
          const present = myAtts.filter(a => a.status === 'Present').length;
          const absences = myAtts.filter(a => a.status === 'Absent' || a.status === 'Late' || a.status === 'Sick');
          const absentCount = myAtts.filter(a => a.status === 'Absent' || a.status === 'Sick').length;
          
          const issues = absences.map(a => `${a.date}: ${a.status}${a.reason ? ` (${a.reason})` : ''}`).join(', ');

          return { 
            name: k.name, 
            present, 
            absent: absentCount, 
            totalDays: myAtts.length, 
            attendanceRate: myAtts.length > 0 ? Math.round((present / myAtts.length) * 100) : 0,
            issues: issues || 'Perfect Attendance' 
          };
        });
        setReportData({ type: 'Detailed Attendance Performance', data: summary });

      } else if (reportType === 'staffHours') {
        const [tRes, sRes] = await Promise.all([
          TimeEntriesApi.getAll().catch(() => ({ data: [] })),
          StaffApi.getAll().catch(() => ({ data: [] }))
        ]);
        const staff = Array.isArray(sRes.data) ? sRes.data : [];
        const times = (Array.isArray(tRes.data) ? tRes.data : []).filter(t => t.clockIn >= startDate && t.clockIn <= (endDate + 'T23:59:59'));
        
        const summary = staff.map(s => {
          const myTimes = times.filter(t => t.staffId === s._id);
          let totalMinutes = 0;
          myTimes.forEach(t => {
            if (t.clockIn && t.clockOut) {
              totalMinutes += (new Date(t.clockOut) - new Date(t.clockIn)) / 60000;
            }
          });
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.round(totalMinutes % 60);
          return { name: s.name, role: s.role, shifts: myTimes.length, timeStr: `${hours}h ${minutes}m`, rawMinutes: totalMinutes };
        });
        setReportData({ type: 'Staff Productivity & Hours', data: summary });
      } else {
        const cRes = await ChildrenApi.getAll().catch(() => ({ data: [] }));
        const kids = Array.isArray(cRes.data) ? cRes.data : [];
        const summary = kids.map(k => ({ name: k.name, dob: k.dob || 'N/A', allergies: k.allergies || 'None', medical: k.medicalInfo || 'None' }));
        setReportData({ type: 'Children Master List - Comprehensive', data: summary });
      }
    } catch (err) {
      addToast('Error generating report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <style>{`
        @media print { .no-print { display: none !important; } .print-only { display: block !important; } body { background: white !important; } }
        .preset-btn { background: #fff; border: 1px solid #ddd; padding: 5px 12px; borderRadius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .preset-btn:hover { background: #f0f0f0; border-color: #bbb; }
      `}</style>
      
      <div className="no-print" style={{ background: 'linear-gradient(135deg, #fb8c00, #f57c00)', padding: '30px', borderRadius: 20, color: 'white', marginBottom: 25, boxShadow: '0 10px 20px rgba(251, 140, 0, 0.2)' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>📊 Reports Center</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Generate weekly/monthly insights and exports.</p>
      </div>

      <div className="no-print" style={{ background: 'white', padding: '25px', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <form onSubmit={generateReport}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>Report Type</label>
              <select className="input" value={reportType} onChange={e => setReportType(e.target.value)} style={{ padding: '12px' }}>
                <option value="attendance">Detailed Attendance Summary</option>
                <option value="childList">Children Master List (Medical/DOB)</option>
                <option value="staffHours">Staff Hours & Activity</option>
              </select>
            </div>
            {reportType !== 'childList' && (
              <>
                <div style={{ minWidth: 150 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>Start Date</label>
                  <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ padding: '11px' }} />
                </div>
                <div style={{ minWidth: 150 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 600, color: '#444' }}>End Date</label>
                  <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} required style={{ padding: '11px' }} />
                </div>
              </>
            )}
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 25px', background: '#e65100', height: 48, fontWeight: 700 }}>
              {loading ? 'Processing...' : 'Generate Report'}
            </button>
          </div>
          {reportType !== 'childList' && (
            <div style={{ display: 'flex', gap: 10, marginTop: 15, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>Presets:</span>
              <button type="button" className="preset-btn" onClick={() => setPreset(7)}>Last 7 Days</button>
              <button type="button" className="preset-btn" onClick={() => setPreset(14)}>Last 14 Days</button>
              <button type="button" className="preset-btn" onClick={() => setPreset(30)}>Last 30 Days (Monthly)</button>
            </div>
          )}
        </form>
      </div>

      {reportData && (
        <div style={{ background: 'white', padding: '40px', borderRadius: 16, border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, borderBottom: '2px solid #f5f5f5', paddingBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, color: '#333' }}>Daycare Management System</h1>
              <div style={{ color: '#e65100', fontWeight: 700, marginTop: 5, fontSize: '1.1rem' }}>{reportData.type.toUpperCase()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Generated: <strong>{new Date().toLocaleString()}</strong></div>
              {reportType !== 'childList' && <div style={{ fontSize: '0.9rem', color: '#666' }}>Period: <strong>{startDate}</strong> to <strong>{endDate}</strong></div>}
              <button className="btn no-print" onClick={handlePrint} style={{ marginTop: 15, background: '#1565c0', color: 'white', fontWeight: 700, padding: '8px 20px' }}>🖨️ Print / Save PDF</button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', textAlign: 'left' }}>
                {reportType === 'attendance' && (
                  <><th style={{ padding: 15, borderBottom: '2px solid #eee' }}>Child Name</th><th style={{ padding: 15, borderBottom: '2px solid #eee', textAlign: 'center' }}>Present</th><th style={{ padding: 15, borderBottom: '2px solid #eee', textAlign: 'center' }}>Absent</th><th style={{ padding: 15, borderBottom: '2px solid #eee', textAlign: 'center' }}>Rate (%)</th><th style={{ padding: 15, borderBottom: '2px solid #eee' }}>Exceptions & Reasons</th></>
                )}
                {reportType === 'childList' && (
                  <><th style={{ padding: 15, borderBottom: '2px solid #eee' }}>Child Name</th><th style={{ padding: 15, borderBottom: '2px solid #eee' }}>Date of Birth</th><th style={{ padding: 15, borderBottom: '2px solid #eee' }}>Allergies</th><th style={{ padding: 15, borderBottom: '2px solid #eee' }}>Medical Info</th></>
                )}
                {reportType === 'staffHours' && (
                  <><th style={{ padding: 15, borderBottom: '2px solid #eee' }}>Staff Member</th><th style={{ padding: 15, borderBottom: '2px solid #eee' }}>Role</th><th style={{ padding: 15, borderBottom: '2px solid #eee', textAlign: 'center' }}>Updates</th><th style={{ padding: 15, borderBottom: '2px solid #eee', textAlign: 'right' }}>Total Time</th></>
                )}
              </tr>
            </thead>
            <tbody>
              {reportData.data.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.2s' }}>
                  {reportType === 'attendance' && (
                    <><td style={{ padding: 15 }}><strong>{row.name}</strong></td><td style={{ padding: 15, textAlign: 'center', color: '#4caf50', fontWeight: 700 }}>{row.present}</td><td style={{ padding: 15, textAlign: 'center', color: '#f44336', fontWeight: 700 }}>{row.absent}</td><td style={{ padding: 15, textAlign: 'center', fontWeight: 800 }}>{row.attendanceRate}%</td><td style={{ padding: 15, fontSize: '0.85rem', color: row.issues === 'Perfect Attendance' ? '#999' : '#d32f2f' }}>{row.issues}</td></>
                  )}
                  {reportType === 'childList' && (
                    <><td style={{ padding: 15 }}><strong>{row.name}</strong></td><td style={{ padding: 15 }}>{row.dob}</td><td style={{ padding: 15, color: row.allergies !== 'None' ? '#d32f2f' : '#666', fontWeight: row.allergies !== 'None' ? 700 : 400 }}>{row.allergies}</td><td style={{ padding: 15, fontSize: '0.85rem' }}>{row.medical}</td></>
                  )}
                  {reportType === 'staffHours' && (
                    <><td style={{ padding: 15 }}><strong>{row.name}</strong></td><td style={{ padding: 15 }}><span style={{ fontSize: '0.8rem', background: '#eee', padding: '3px 8px', borderRadius: 4 }}>{row.role}</span></td><td style={{ padding: 15, textAlign: 'center' }}>{row.shifts}</td><td style={{ padding: 15, textAlign: 'right', fontWeight: 700, color: '#1565c0' }}>{row.timeStr}</td></>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 50, textAlign: 'center', fontSize: '0.85rem', color: '#bbb', paddingTop: 20, borderTop: '1px solid #eee' }}>
            This document is a computer-generated summary of official daycare records.
          </div>
        </div>
      )}
    </div>
  );
}
