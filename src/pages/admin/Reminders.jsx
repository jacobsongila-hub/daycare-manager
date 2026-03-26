import React, { useState, useEffect } from 'react';
import { RemindersApi } from '../../services/api';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await RemindersApi.getAll();
      setReminders(res.data || []);
    } catch (err) {
      console.error('Error loading reminders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      await RemindersApi.create(data);
      e.target.reset();
      loadData();
    } catch(err) { alert('Error creating reminder'); }
  };

  const toggleComplete = async (reminder) => {
    try {
      await RemindersApi.update(reminder._id, { completed: !reminder.completed });
      loadData();
    } catch(err) { alert('Status update failed'); }
  };

  const handleDelete = async (id) => {
    try {
      await RemindersApi.delete(id);
      loadData();
    } catch(err) { alert('Delete failed'); }
  };

  const pending = reminders.filter(r => !r.completed);
  const completed = reminders.filter(r => r.completed);

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>To-Do Reminders</h2>

      <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 30 }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Add Reminder</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 15, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input name="title" placeholder="Reminder Task (e.g., Renew insurance, Call plumber)" required className="input" style={{ flex: 2, minWidth: 200 }} />
          <input name="dueDate" type="date" required className="input" style={{ flex: 1, minWidth: 150 }} />
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px' }}>➕ Add</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Pending */}
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#1565c0' }}>Pending ({pending.length})</h3>
          {loading ? <div className="spinner"></div> : pending.length === 0 ? <p className="empty-state">All caught up!</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map(r => (
                <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: 15, borderRadius: 8, borderLeft: '4px solid #1565c0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{r.title}</h4>
                    <div style={{ fontSize: '0.8rem', color: '#d32f2f' }}>⏰ Due: {r.dueDate}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn" onClick={() => toggleComplete(r)} style={{ background: '#e8f5e9', color: '#2e7d32' }}>✓ Done</button>
                    <button className="btn" onClick={() => handleDelete(r._id)} style={{ border: 'none', background: 'none' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#4caf50' }}>Completed ({completed.length})</h3>
          {loading ? <div className="spinner"></div> : completed.length === 0 ? <p className="empty-state">No completed items.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completed.map(r => (
                <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: 15, borderRadius: 8, opacity: 0.8 }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', textDecoration: 'line-through', color: '#888' }}>{r.title}</h4>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn" onClick={() => toggleComplete(r)}>Undo</button>
                    <button className="btn" onClick={() => handleDelete(r._id)} style={{ border: 'none', background: 'none' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
