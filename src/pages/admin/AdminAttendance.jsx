import React, { useState, useEffect } from 'react';
import { ChildrenApi, AttendanceApi, markAttendance } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminAttendance() {
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonData, setReasonData] = useState({ childId: null, status: null });
  const { addToast } = useNotification();
  const { t } = useLanguage();

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        ChildrenApi.getAll().catch(() => ({ data: [] })),
        AttendanceApi.getAll().catch(() => ({ data: [] }))
      ]);
      const kids = cRes.data || [];
      const atts = aRes.data || [];
      setChildren(kids);
      const daysAtt = atts.filter(a => a.date === date);
      const dict = {};
      daysAtt.forEach(a => { dict[a.childId] = a; });
      setAttendance(dict);
    } catch (err) {
      addToast(t('errorLoadingAttendance') || 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [date]);

  const updateStatus = async (childId, newStatus, reason = null) => {
    // Late or Absent requires a reason
    if ((newStatus === 'Absent' || newStatus === 'Late') && !reason) {
      setReasonData({ childId, status: newStatus });
      setShowReasonModal(true);
      return;
    }

    try {
      const payload = { childId, date, status: newStatus, reason };
      if (newStatus === 'Present' && attendance[childId]?.status !== 'Present') {
        payload.checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (newStatus === 'Absent') {
        payload.checkIn = '';
        payload.checkOut = '';
      }
      
      const res = await markAttendance(payload); 
      setAttendance(prev => ({ ...prev, [childId]: res.data }));
      addToast(`${t('statusUpdated') || 'Updated'}: ${newStatus}`, 'success');
      setShowReasonModal(false);
    } catch(err) { 
      addToast(t('errorUpdating') || 'Error updating status', 'error'); 
    }
  };

  const markAll = async (status) => {
    if (!window.confirm(t('confirmMarkAll') || `Mark all as ${status}?`)) return;
    try {
      await Promise.all(children.map(child => {
        if (attendance[child._id]?.status === status) return Promise.resolve();
        return markAttendance({ childId: child._id, date, status });
      }));
      addToast(t('allMarked') || 'All marked', 'success');
      loadData();
    } catch (err) {
      addToast(t('errorMarkingAll') || 'Error marking all', 'error');
    }
  };

  const handleReasonSubmit = (e) => {
    e.preventDefault();
    const reason = e.target.reason.value;
    updateStatus(reasonData.childId, reasonData.status, reason);
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>{t('attendance')}</h2>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="input" 
          style={{ width: 'auto', padding: '8px 15px' }} 
        />
      </div>

      {/* Global Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn" style={{ background: '#e8f5e9', color: '#2e7d32' }} onClick={() => markAll('Present')}>✅ {t('markAllPresent')}</button>
        <button className="btn" style={{ background: '#ffebee', color: '#c62828' }} onClick={() => markAll('Absent')}>❌ {t('markAllAbsent')}</button>
        <button className="btn" onClick={loadData}>🔄 {t('refresh')}</button>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children.length === 0 ? <p className="empty-state">No children found.</p> : children.map(child => {
            const att = attendance[child._id] || { status: 'Unmarked' };
            const isPresent = att.status === 'Present';
            const isAbsent = att.status === 'Absent';
            const isLate = att.status === 'Late';
            
            return (
              <div key={child._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '15px 20px', borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 25, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden' }}>
                    {child.avatar ? <img src={child.avatar} alt={child.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👶'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{child.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                      {att.status === 'Unmarked' ? t('notMarked') : (
                        <span>
                          {isPresent && att.checkIn && `In: ${att.checkIn}`} 
                          {isAbsent && `${t('absent')} ${att.reason ? `- ${att.reason}` : ''}`}
                          {isLate && `${t('late') || 'Late'} ${att.reason ? `- ${att.reason}` : ''}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, background: '#f5f5f5', padding: 4, borderRadius: 8 }}>
                  <button 
                    onClick={() => updateStatus(child._id, 'Present')}
                    style={{ padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', background: isPresent ? '#4caf50' : 'transparent', color: isPresent ? 'white' : '#666', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    {t('present')}
                  </button>
                  <button 
                    onClick={() => updateStatus(child._id, 'Late')}
                    style={{ padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', background: isLate ? '#ff9800' : 'transparent', color: isLate ? 'white' : '#666', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    {t('late') || 'Late'}
                  </button>
                  <button 
                    onClick={() => updateStatus(child._id, 'Absent')}
                    style={{ padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', background: isAbsent ? '#f44336' : 'transparent', color: isAbsent ? 'white' : '#666', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    {t('absent')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <h3>{t('reason')} - {reasonData.status}</h3>
            <p style={{ color: '#666', marginBottom: 20 }}>Select a reason for the child being {reasonData.status.toLowerCase()}.</p>
            <form onSubmit={handleReasonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <select name="reason" required className="input" autoFocus>
                <option value="">{t('selectReason') || 'Select Reason...'}</option>
                <option value="Sick">{t('sick')} 🤒</option>
                <option value="Vacation">{t('vacation')} ✈️</option>
                <option value="Dr's Appointment">{t('doctor')} 🏥</option>
                <option value="Personal">{t('personal')} 👨‍👩‍👧</option>
                <option value="Other">{t('other')} 📝</option>
              </select>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowReasonModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
