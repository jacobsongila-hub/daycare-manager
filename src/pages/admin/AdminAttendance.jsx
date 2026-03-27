import React, { useState, useEffect } from 'react';
import { ChildrenApi, AttendanceApi, markAttendance } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminAttendance() {
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonData, setReasonData] = useState({ childId: null, status: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, status: null });
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

  const requestMarkAll = (status) => {
    setConfirmModal({ isOpen: true, status });
  };

  const handleConfirmMarkAll = async () => {
    const status = confirmModal.status;
    setConfirmModal({ isOpen: false, status: null });
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
      <div className="page-header" style={{ marginBottom: 25 }}>
        <div>
          <h2 className="page-title">📅 {t('attendance')}</h2>
          <p className="page-subtitle">{t('attendanceProgress')}</p>
        </div>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="input" 
          style={{ width: 'auto', padding: '10px 18px', fontWeight: 600 }} 
        />
      </div>

      {/* Global Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 25, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" style={{ background: 'var(--success-light)', color: 'var(--success)', flex: 1, minWidth: 150 }} onClick={() => requestMarkAll('Present')}>✅ {t('markAllPresent')}</button>
        <button className="btn btn-secondary" style={{ background: 'var(--danger-light)', color: 'var(--danger)', flex: 1, minWidth: 150 }} onClick={() => requestMarkAll('Absent')}>❌ {t('markAllAbsent')}</button>
        <button className="btn btn-secondary" style={{ flex: 0.5, minWidth: 100 }} onClick={loadData}>🔄 {t('refresh')}</button>
      </div>

      {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children.length === 0 ? <p className="empty-state">{t('noEntries')}</p> : children.map(child => {
            const att = attendance[child._id] || { status: 'Unmarked' };
            const isPresent = att.status === 'Present';
            const isAbsent = att.status === 'Absent';
            const isLate = att.status === 'Late';
            
            return (
              <div key={child._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderLeft: isPresent ? '5px solid var(--success)' : (isLate ? '5px solid var(--warning)' : (isAbsent ? '5px solid var(--danger)' : '5px solid var(--border)')) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div className="avatar avatar-blue" style={{ width: 50, height: 50, fontSize: '1.4rem' }}>
                    {child.avatar ? <img src={child.avatar} alt={child.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👶'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--text)' }}>{child.name}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4, fontWeight: 600 }}>
                      {att.status === 'Unmarked' ? <span style={{ color: 'var(--text-light)' }}>{t('notMarked') || 'Not Marked'}</span> : (
                        <span style={{ color: isPresent ? 'var(--success)' : (isAbsent ? 'var(--danger)' : 'var(--warning)') }}>
                          {isPresent && att.checkIn && `🕒 ${att.checkIn}`} 
                          {isAbsent && `❌ ${t('absent')} ${att.reason ? `(${t(att.reason.toLowerCase()) || att.reason})` : ''}`}
                          {isLate && `⚠️ ${t('late') || 'Late'} ${att.reason ? `(${t(att.reason.toLowerCase()) || att.reason})` : ''}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', padding: 5, borderRadius: 12 }}>
                  <button 
                    onClick={() => updateStatus(child._id, 'Present')}
                    className="btn btn-sm"
                    style={{ background: isPresent ? 'var(--success)' : 'transparent', color: isPresent ? 'white' : 'var(--text-muted)', border: 'none', minWidth: 70, fontWeight: 700 }}
                  >
                    {t('present')}
                  </button>
                  <button 
                    onClick={() => updateStatus(child._id, 'Late')}
                    className="btn btn-sm"
                    style={{ background: isLate ? 'var(--warning)' : 'transparent', color: isLate ? 'white' : 'var(--text-muted)', border: 'none', minWidth: 70, fontWeight: 700 }}
                  >
                    {t('late') || 'Late'}
                  </button>
                  <button 
                    onClick={() => updateStatus(child._id, 'Absent')}
                    className="btn btn-sm"
                    style={{ background: isAbsent ? 'var(--danger)' : 'transparent', color: isAbsent ? 'white' : 'var(--text-muted)', border: 'none', minWidth: 70, fontWeight: 700 }}
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
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{t('reason')} - {t(reasonData.status?.toLowerCase()) || reasonData.status}</h3>
              <button className="modal-close" onClick={() => setShowReasonModal(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.95rem' }}>{t('selectReason')}</p>
            <form onSubmit={handleReasonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <select name="reason" required className="input" autoFocus>
                <option value="">{t('selectReason')}</option>
                <option value="Sick">{t('sick')} 🤒</option>
                <option value="Vacation">{t('vacation')} ✈️</option>
                <option value="Dr's Appointment">{t('doctor')} 🏥</option>
                <option value="Personal">{t('personal')} 👨‍👩‍👧</option>
                <option value="Other">{t('other')} 📝</option>
              </select>
              <div className="modal-actions" style={{ marginTop: 10, display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReasonModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={t('confirmMarkAll') || `Mark all as ${confirmModal.status}?`}
        message={`Are you sure you want to mark all children as ${confirmModal.status} for ${date}?`}
        onConfirm={handleConfirmMarkAll}
        onCancel={() => setConfirmModal({ isOpen: false, status: null })}
        confirmText="Yes, Mark All"
      />
    </div>
  );
}
