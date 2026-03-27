import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Reminders() {
  const { addToast } = useNotification();
  const { confirm } = useConfirm();
  const { t, lang } = useLanguage();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');

  const loadData = () => {
    setLoading(true);
    const data = JSON.parse(localStorage.getItem('reminders') || '[]');
    setReminders(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newRem = { _id: Date.now().toString(), title: newTitle, completed: false, createdAt: new Date().toISOString() };
    const updated = [newRem, ...reminders];
    localStorage.setItem('reminders', JSON.stringify(updated));
    setNewTitle('');
    setReminders(updated);
    addToast(t('noteSaved') || 'Reminder added', 'success');
  };

  const toggleComplete = (reminder) => {
    const updated = reminders.map(r => r._id === reminder._id ? { ...r, completed: !r.completed } : r);
    localStorage.setItem('reminders', JSON.stringify(updated));
    setReminders(updated);
  };

  const handleDelete = async (id) => {
    if (!(await confirm(t('confirmDelete') || 'Delete this reminder?', 'Confirm Delete', true))) return;
    const updated = reminders.filter(r => r._id !== id);
    localStorage.setItem('reminders', JSON.stringify(updated));
    setReminders(updated);
    addToast(t('photoDeleted') || 'Reminder deleted', 'success');
  };

  const pending = reminders.filter(r => !r.completed);
  const completed = reminders.filter(r => r.completed);

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FFD54F, #FBC02D)', padding: '30px', borderRadius: 20, color: '#444', marginBottom: 25, boxShadow: '0 10px 20px rgba(251, 192, 45, 0.2)' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>📌 Quick Reminders</h2>
        <p style={{ margin: 0, opacity: 0.9, fontWeight: 600 }}>Sticky notes for things you need to remember.</p>
      </div>

      <div className="card" style={{ padding: '20px', borderRadius: 16, background: '#fff', marginBottom: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 15 }}>
          <input 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="I need to remember to..." 
            className="input" 
            style={{ flex: 1, padding: '15px', borderRadius: 12, border: '2px solid #eee', fontSize: '1.1rem' }} 
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 30px', background: '#FBC02D', color: '#444', fontWeight: 800, borderRadius: 12 }}>
            Add Note
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {loading ? <div className="spinner"></div> : (
          <>
            {pending.map((r, i) => (
              <div key={r._id} style={{ 
                background: i % 2 === 0 ? '#FFF9C4' : '#E1F5FE', 
                padding: '25px', 
                borderRadius: 4, 
                position: 'relative', 
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '2px 5px 10px rgba(0,0,0,0.1)',
                transform: `rotate(${i % 2 === 0 ? '-1deg' : '1.5deg'})`,
                transition: 'transform 0.2s',
                cursor: 'default'
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333', lineHeight: 1.4 }}>{r.title}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                  <button onClick={() => toggleComplete(r)} style={{ background: 'rgba(255,255,255,0.5)', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 800, color: '#2e7d32', fontSize: '0.85rem' }}>
                    DONE ✓
                  </button>
                  <button onClick={() => handleDelete(r._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.6 }}>🗑️</button>
                </div>
              </div>
            ))}
            
            {completed.map((r, i) => (
              <div key={r._id} style={{ 
                background: '#f5f5f5', 
                padding: '20px', 
                borderRadius: 4, 
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0.6,
                textDecoration: 'line-through'
              }}>
                <div style={{ fontSize: '1.1rem', color: '#888' }}>{r.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={() => toggleComplete(r)} style={{ background: '#eee', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>UNDO</button>
                  <button onClick={() => handleDelete(r._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>🗑️</button>
                </div>
              </div>
            ))}
          </>
        )}
        
        {!loading && reminders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#ccc' }}>
             <div style={{ fontSize: '4rem', marginBottom: 20 }}>📝</div>
             <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Your reminder board is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
