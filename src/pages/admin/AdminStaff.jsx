import React, { useState, useEffect } from 'react';
import { StaffApi, TimeEntriesApi, register } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClockedInOnly, setShowClockedInOnly] = useState(false);
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const { confirm } = useConfirm();

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        StaffApi.getAll().catch(() => ({ data: [] })),
        TimeEntriesApi.getAll().catch(() => ({ data: [] }))
      ]);
      const sortedStaff = (Array.isArray(sRes.data) ? sRes.data : []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setStaff(sortedStaff);
      setTimeEntries(Array.isArray(tRes.data) ? tRes.data : []);
    } catch (err) {
      addToast(t('errorLoadingStaff') || 'Failed to load staff directory', 'error');
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
      if (editStaff) {
        await StaffApi.update(editStaff._id, data);
        addToast(t('staffUpdated') || 'Staff profile updated', 'success');
      } else {
        // Create Staff Record
        const res = await StaffApi.create(data);
        const newStaff = res.data;

        // Auto-create login account if password provided
        if (data.password && data.email) {
          try {
            await register({
              name: data.name,
              email: data.email,
              password: data.password,
              role: 'staff'
            });
            addToast('Login account created for staff', 'success');
          } catch (regErr) {
            addToast('Staff added but failed to create login account', 'warning');
          }
        } else {
          addToast(t('staffAdded') || 'New staff member added', 'success');
        }
      }
      setShowModal(false);
      loadData();
    } catch (err) { 
      addToast(t('errorSaving') || 'Error saving staff profile', 'error'); 
    }
  };

  const handleToggleStatus = async (worker) => {
    const newStatus = worker.role === 'Suspended' ? 'Staff' : 'Suspended';
    try {
      await StaffApi.update(worker._id, { role: newStatus });
      addToast(`${t('statusUpdated') || 'Status updated'}: ${newStatus}`, 'success');
      loadData();
    } catch(err) { 
      addToast(t('errorUpdating') || 'Error updating status', 'error'); 
    }
  };

  const handleDelete = async (id) => {
    if(!(await confirm(t('confirmDelete') || 'Delete this staff member?', 'Confirm Delete', true))) return;
    try {
      await StaffApi.delete(id);
      addToast(t('staffDeleted') || 'Staff profile deleted', 'success');
      loadData();
    } catch(e) { 
      addToast(t('deleteFailed') || 'Delete failed', 'error'); 
    }
  };

  const isClockedIn = (staffId) => {
    return timeEntries.some(e => e.staffId === staffId && !e.clockOut);
  };

  const filteredStaff = staff.filter(s => !showClockedInOnly || isClockedIn(s._id));

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25, flexWrap: 'wrap', gap: 15 }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>👩‍🏫 {t('staff')}</h2>
          <p style={{ margin: 0, color: '#666' }}>Manage employee profiles and statuses.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn" 
            onClick={() => setShowClockedInOnly(!showClockedInOnly)}
            style={{ background: showClockedInOnly ? '#4caf50' : '#eee', color: showClockedInOnly ? 'white' : '#333', fontWeight: 'bold' }}
          >
            {showClockedInOnly ? `✓ ${t('clockedIn') || 'Clocked-In Only'}` : `👤 ${t('allStaff') || 'All Staff'}`}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditStaff(null); setShowModal(true); }}>
            ➕ {t('addStaff') || 'Add Staff'}
          </button>
        </div>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filteredStaff.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <p>{t('noStaffMatching') || 'No staff matching criteria.'}</p>
            </div>
          ) : filteredStaff.map(worker => {
            const inStatus = isClockedIn(worker._id);
            return (
              <div key={worker._id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 15, position: 'relative', opacity: worker.role === 'Suspended' ? 0.6 : 1 }}>
                
                {inStatus && (
                  <div style={{ position: 'absolute', top: 10, right: 10, background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800, border: '1px solid #c8e6c9' }}>
                    🟢 {t('clockInCaps') || 'CLOCKED IN'}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                  <div style={{ fontSize: '2.5rem', background: '#eee', width: 60, height: 60, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#1565c0' }}>{worker.name}</h3>
                    <div style={{ color: '#888', fontSize: '0.9rem' }}>{worker.role}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#444' }}>
                  <div>📧 {worker.email || t('noEmail') || 'No email'}</div>
                  <div>📞 {worker.phone || t('noPhone') || 'No phone'}</div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 15, borderTop: '1px solid #f0f0f0' }}>
                  <button className="btn" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => { setEditStaff(worker); setShowModal(true); }}>
                    {t('edit')}
                  </button>
                  <button className="btn" style={{ flex: 1, fontSize: '0.85rem', color: worker.role === 'Suspended' ? '#4caf50' : '#f44336' }} onClick={() => handleToggleStatus(worker)}>
                    {worker.role === 'Suspended' ? `✓ ${t('reactivate') || 'Reactivate'}` : `⏸ ${t('suspend') || 'Suspend'}`}
                  </button>
                  <button className="btn" style={{ color: '#f44336' }} onClick={() => handleDelete(worker._id)}>🗑️</button>
                </div>
                {worker.joinDate && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 5, textAlign: 'center' }}>📅 {t('joined') || 'Joined'}: {worker.joinDate}</div>}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <h3>{editStaff ? t('editStaff') : t('addStaff')}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input name="name" defaultValue={editStaff?.name} placeholder={t('fullName') || "Full Name"} required className="input" />
              <input name="email" defaultValue={editStaff?.email} type="email" placeholder={t('email') || "Email"} className="input" />
              <input name="phone" defaultValue={editStaff?.phone} type="tel" placeholder={t('phone') || "Phone"} className="input" />
              <select name="role" defaultValue={editStaff?.role || 'Staff'} className="input">
                <option value="Staff">Regular Staff</option>
                <option value="Lead Teacher">Lead Teacher</option>
                <option value="Assistant">Assistant</option>
                <option value="Suspended">Suspended</option>
              </select>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#666' }}>{t('joinDate') || 'Join Date'}</label>
                <input name="joinDate" defaultValue={editStaff?.joinDate} type="date" className="input" />
              </div>

              {!editStaff && (
                <div style={{ background: '#f5f7f9', padding: '15px', borderRadius: '12px', marginTop: '10px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>🔑 {t('loginAccount') || 'Login Account'}</h4>
                  <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: 10 }}>If you provide a password, an account will be created automatically.</p>
                  <input name="password" type="password" placeholder={t('password') || "Password (min. 6 chars)"} className="input" style={{ background: 'white' }} minLength={6} />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
