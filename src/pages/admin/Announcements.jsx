import React, { useState, useEffect } from 'react';
import { AnnouncementsApi } from '../../services/api';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await AnnouncementsApi.getAll();
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Error loading announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.date = new Date().toISOString().split('T')[0];
    
    try {
      await AnnouncementsApi.create(data);
      e.target.reset();
      loadData();
    } catch (err) { alert('Error creating announcement'); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this announcement?')) return;
    try {
      await AnnouncementsApi.delete(id);
      loadData();
    } catch (err) { alert('Error deleting'); }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'General': return '📢';
      case 'Birthday': return '🎂';
      case 'Birth': return '👶';
      case 'Milestone': return '⭐';
      case 'Holiday': return '🎉';
      case 'Event': return '📅';
      default: return '📢';
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>Announcements</h2>
      
      <div style={{ background: 'var(--card-bg)', padding: 20, borderRadius: 12, boxShadow: 'var(--shadow)', marginBottom: 30 }}>
        <h3>Create Announcement</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <input name="title" placeholder="Announcement Title" required className="input" />
          <textarea name="message" placeholder="Message content..." required className="input" rows="3" />
          <select name="type" className="input" required defaultValue="General">
            <option value="General">📢 General</option>
            <option value="Birthday">🎂 Birthday</option>
            <option value="Birth">👶 Birth</option>
            <option value="Milestone">⭐ Milestone</option>
            <option value="Holiday">🎉 Holiday</option>
            <option value="Event">📅 Event</option>
          </select>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Post Announcement</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <h3 style={{ margin: 0, color: 'var(--text-light)' }}>Recent Announcements</h3>
        {loading ? <div className="spinner"></div> : announcements.length === 0 ? <p className="empty-state">No announcements yet.</p> : (
          announcements.map(ann => (
            <div key={ann._id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: 20, position: 'relative' }}>
              <div style={{ fontSize: '2.5rem' }}>{getTypeIcon(ann.type)}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{ann.title}</h4>
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: 10 }}>📅 {new Date(ann.createdAt).toLocaleDateString()} | {ann.type}</div>
                <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>{ann.message}</p>
              </div>
              <button 
                className="btn" 
                style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#f44336' }}
                onClick={() => handleDelete(ann._id)}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
