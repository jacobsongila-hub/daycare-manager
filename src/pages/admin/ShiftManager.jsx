import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { ShiftRequestsApi, StaffApi } from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';

export default function ShiftManager() {
  const { addToast } = useNotification();
  const [requests, setRequests] = useState([]);
  const [staffInfo, setStaffInfo] = useState({});
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([ShiftRequestsApi.getAll(), StaffApi.getAll()]);
      const reqs = rRes.data || [];
      const stf = sRes.data || [];

      const dict = {};
      stf.forEach(s => { dict[s._id] = s.name; });
      setStaffInfo(dict);
      
      setRequests(reqs);
    } catch (err) {
      console.error('Error loading shift requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await ShiftRequestsApi.update(id, { status });
      loadData();
    } catch (err) { addToast('Error updating shift request', 'error'); }
  };

  const deleteRequest = async (id) => {
    if(!(await confirm('Delete this request?', 'Confirm Delete', true))) return;
    try {
      await ShiftRequestsApi.delete(id);
      loadData();
    } catch (err) { addToast('Error deleting', 'error'); }
  };

  const filtered = requests.filter(r => filter === 'All' || r.status === filter);

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>Shift Requests</h2>
      
      <div style={{ display: 'flex', gap: 10, marginBottom: 25 }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
          <button 
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f} {f === 'Pending' && requests.filter(r => r.status === 'Pending').length > 0 && `(${requests.filter(r => r.status === 'Pending').length})`}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {filtered.length === 0 ? <p className="empty-state">No requests found.</p> : filtered.map(req => (
            <div key={req._id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ width: 40, height: 40, background: '#eee', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                <div>
                  <h3 style={{ margin: 0 }}>{staffInfo[req.staffId] || 'Unknown Staff'}</h3>
                  <div style={{ color: '#555', fontSize: '0.9rem', marginTop: 5 }}>
                    📅 {req.date} | ⏰ {req.start} - {req.end}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                {req.status === 'Pending' && (
                  <>
                    <button className="btn" style={{ background: '#4CAF50', color: 'white' }} onClick={() => updateStatus(req._id, 'Approved')}>✓ Approve</button>
                    <button className="btn" style={{ background: '#F44336', color: 'white' }} onClick={() => updateStatus(req._id, 'Rejected')}>✗ Reject</button>
                  </>
                )}
                <button className="btn" style={{ border: 'none', background: 'none' }} onClick={() => deleteRequest(req._id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
