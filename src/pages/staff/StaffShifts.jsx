import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShiftRequestsApi } from '../../services/api';

export default function StaffShifts() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ShiftRequestsApi.getAll();
      const myReqs = (res.data || []).filter(r => r.staffId === user?.id);
      setRequests(myReqs);
    } catch (err) {
      console.error('Error loading shift requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { Object.keys(user || {}).length > 0 && loadData(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      await ShiftRequestsApi.create({
        staffId: user?.id,
        date: data.date,
        start: data.start,
        end: data.end,
        status: 'Pending'
      });
      e.target.reset();
      loadData();
    } catch (err) { alert('Error requesting shift time'); }
  };

  const deleteRequest = async (id) => {
    if(!window.confirm('Delete this request?')) return;
    try {
      await ShiftRequestsApi.delete(id);
      loadData();
    } catch (err) { alert('Error deleting'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>My Shift Requests</h2>

      <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Request Time Off / Swap</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: 5, display: 'block' }}>Date</label>
              <input type="date" name="date" required className="input" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: 5, display: 'block' }}>Start Time</label>
              <input type="time" name="start" required className="input" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: '#666', marginBottom: 5, display: 'block' }}>End Time</label>
              <input type="time" name="end" required className="input" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Submit Request</button>
        </form>
      </div>

      <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>My Request History</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {requests.length === 0 ? <p className="empty-state">No requests made yet.</p> : requests.map(req => (
            <div key={req._id} style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>📅 {req.date}</div>
                  <div style={{ color: '#555', fontSize: '0.9rem', marginTop: 5 }}>
                    ⏰ {req.start} - {req.end}
                  </div>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                  {req.status === 'Pending' && (
                    <button className="btn" style={{ border: 'none', background: 'none' }} onClick={() => deleteRequest(req._id)}>🗑️</button>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
