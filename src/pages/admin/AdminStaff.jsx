import React, { useState, useEffect } from 'react';
import { StaffApi } from '../../services/api';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await StaffApi.getAll();
      setStaff(res.data || []);
    } catch (err) {
      console.error('Error loading staff', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      if (editStaff) await StaffApi.update(editStaff._id, data);
      else await StaffApi.create(data);
      setShowModal(false);
      loadData();
    } catch (err) { alert('Error saving staff'); }
  };

  const handleToggleStatus = async (worker) => {
    // Only simulating status toggle in the Staff profile, user account suspend is in UserManagement
    const newStatus = worker.role === 'Suspended' ? 'Staff' : 'Suspended';
    try {
      await StaffApi.update(worker._id, { role: newStatus });
      loadData();
    } catch(err) { alert('Error updating status'); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this staff profile?')) return;
    try {
      await StaffApi.delete(id);
      loadData();
    } catch(e) { alert('Delete failed'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>👩‍🏫 Staff Directory</h2>
          <p style={{ margin: 0, color: '#666' }}>Manage employee profiles and statuses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditStaff(null); setShowModal(true); }}>➕ Add Staff Member</button>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {staff.length === 0 ? <p className="empty-state">No staff listed.</p> : staff.map(worker => (
            <div key={worker._id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 15, position: 'relative', opacity: worker.role === 'Suspended' ? 0.6 : 1 }}>
              
              <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem', background: '#eee', width: 60, height: 60, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#1565c0' }}>{worker.name}</h3>
                  <div style={{ color: '#888', fontSize: '0.9rem' }}>{worker.role}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#444' }}>
                <div>📧 {worker.email || 'No email provided'}</div>
                <div>📞 {worker.phone || 'No phone provided'}</div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 15, borderTop: '1px solid #f0f0f0' }}>
                <button className="btn" style={{ flex: 1, padding: '8px 10px', fontSize: '0.85rem' }} onClick={() => { setEditStaff(worker); setShowModal(true); }}>✏️ Edit</button>
                <button className="btn" style={{ flex: 1, padding: '8px 10px', fontSize: '0.85rem', color: worker.role === 'Suspended' ? '#4caf50' : '#f44336' }} onClick={() => handleToggleStatus(worker)}>
                  {worker.role === 'Suspended' ? '✓ Reactivate' : '⏸ Suspend'}
                </button>
                <button className="btn" style={{ padding: '8px 10px', color: '#f44336' }} onClick={() => handleDelete(worker._id)}>🗑️</button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Staff Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <h3>{editStaff ? 'Edit Staff Profile' : 'Add New Staff Member'}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input name="name" defaultValue={editStaff?.name} placeholder="Full Name" required className="input" />
              <input name="email" defaultValue={editStaff?.email} type="email" placeholder="Email Address" className="input" />
              <input name="phone" defaultValue={editStaff?.phone} type="tel" placeholder="Phone Number" className="input" />
              <select name="role" defaultValue={editStaff?.role || 'Staff'} className="input">
                <option value="Staff">Regular Staff</option>
                <option value="Lead Teacher">Lead Teacher</option>
                <option value="Assistant">Assistant</option>
                <option value="Suspended">Suspended</option>
              </select>
              
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#1565c0' }}>Save Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
