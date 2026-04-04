import React, { useState, useEffect } from 'react';
import { ChildrenApi, AttendanceApi, markAttendance } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmContext';
import Modal from '../../components/Modal';

export default function AdminAttendance() {
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonData, setReasonData] = useState({ childId: null, status: null });
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const { confirm } = useConfirm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        ChildrenApi.getAll().catch(() => ({ data: [] })),
        AttendanceApi.getAll().catch(() => ({ data: [] }))
      ]);
      const kids = Array.isArray(cRes.data) ? cRes.data : [];
      const atts = Array.isArray(aRes.data) ? aRes.data : [];
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
    if ((newStatus === 'Absent' || newStatus === 'Late') && !reason) {
      setReasonData({ childId, status: newStatus });
      setShowReasonModal(true);
      return;
    }

    try {
      const payload = { childId, date, status: newStatus, reason };
      if (newStatus === 'Present' && attendance[childId]?.status !== 'Present') {
        payload.checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      
      const res = await markAttendance(payload); 
      setAttendance(prev => ({ ...prev, [childId]: res.data }));
      addToast(`${t('statusUpdated') || 'Updated'}: ${newStatus}`, 'success');
      setShowReasonModal(false);
    } catch(err) { 
      addToast(t('errorUpdating') || 'Error updating status', 'error'); 
    }
  };

  const requestMarkAll = async (status) => {
    const msg = t('confirmMarkAllMsg')?.replace('{{status}}', t(status.toLowerCase()) || status) || `Mark all children as ${status}?`;
    if (!(await confirm(msg, t('confirmMarkAll') || 'Confirm Bulk Update', status === 'Absent'))) return;

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
    const reasonSelection = e.target.reason.value;
    updateStatus(reasonData.childId, reasonData.status, reasonSelection);
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #00796B, #4DB6AC)', padding: '30px', borderRadius: 20, color: 'white', marginBottom: 25, boxShadow: '0 8px 25px rgba(0, 121, 107, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>📅 {t('attendance')}</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>{t('attendanceDesc') || 'Track children status and check-in times.'}</p>
        </div>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="input" 
          style={{ width: 'auto', padding: '12px 20px', fontWeight: 800, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white' }} 
        />
      </div>

      {/* Global Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.5fr', gap: 15, marginBottom: 25 }}>
        <button onClick={() => requestMarkAll('Present')} style={{ padding: '18px', borderRadius: 16, border: 'none', background: '#e8f5e9', color: '#2e7d32', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
           ✅ {t('markAllPresent') || 'Mark All Present'}
        </button>
        <button onClick={() => requestMarkAll('Absent')} style={{ padding: '18px', borderRadius: 16, border: 'none', background: '#ffebee', color: '#c62828', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>
           ❌ {t('markAllAbsent') || 'Mark All Absent'}
        </button>
        <button onClick={loadData} style={{ padding: '18px', borderRadius: 16, border: 'none', background: '#f5f5f5', color: '#666', fontWeight: 800, cursor: 'pointer' }}>
           🔄
        </button>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children.length === 0 ? (
            <div className="empty-state" style={{ background: 'white', padding: 60, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
               <div style={{ fontSize: '3rem', marginBottom: 15 }}>👶</div>
               <p style={{ color: '#999', fontWeight: 600 }}>{t('noChildren') || 'No children found in the database.'}</p>
            </div>
          ) : children.map(child => {
            const att = attendance[child._id] || { status: 'Unmarked' };
            const status = att.status;
            
            return (
              <div key={child._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderLeft: `6px solid ${status === 'Present' ? '#4caf50' : (status === 'Late' ? '#ff9800' : (status === 'Absent' ? '#f44336' : '#eee'))}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 55, height: 55, borderRadius: 12, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden' }}>
                    {child.avatar ? <img src={child.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👶'}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.15rem' }}>{child.name}</h4>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: status === 'Present' ? '#2e7d32' : (status === 'Absent' ? '#c62828' : '#e65100') }}>
                      {status === 'Unmarked' ? <span style={{ color: '#aaa' }}>{t('pendingDots') || 'Pending...'}</span> : (
                        <span>
                           {status === 'Present' && `🕒 ${att.checkIn || '—'}`}
                           {status === 'Absent' && `❌ ${t('absent')} ${att.reason ? `(${att.reason})` : ''}`}
                           {status === 'Late' && `⚠️ ${t('late')} ${att.reason ? `(${att.reason})` : ''}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, background: '#f8f8f8', padding: '6px', borderRadius: 14 }}>
                  {['Present', 'Late', 'Absent'].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(child._id, s)}
                      style={{
                        padding: '10px 15px',
                        borderRadius: 10,
                        border: 'none',
                        background: status === s ? (s === 'Present' ? '#4caf50' : (s === 'Late' ? '#ff9800' : '#f44336')) : 'transparent',
                        color: status === s ? 'white' : '#666',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {t(s.toLowerCase()) || s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REASON MODAL */}
      <Modal 
        isOpen={showReasonModal} 
        onClose={() => setShowReasonModal(false)}
        title={`${t('reason') || 'Set Reason'} - ${reasonData.status}`}
      >
        <form onSubmit={handleReasonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
           <div>
              <label className="form-label">{t('selectReason') || 'Why is the child late/absent?'}</label>
              <select name="reason" className="input" autoFocus required>
                 <option value="Sick">{t('sick') || 'Sick'} 🤒</option>
                 <option value="Vacation">{t('vacation') || 'Vacation'} ✈️</option>
                 <option value="Family">{t('familyReason') || 'Family Reason'} 🏠</option>
                 <option value="Other">{t('other') || 'Other'} 📝</option>
              </select>
           </div>
           <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '15px' }}>
              {t('confirmStatus') || 'Confirm Status'}
           </button>
        </form>
      </Modal>
    </div>
  );
}
