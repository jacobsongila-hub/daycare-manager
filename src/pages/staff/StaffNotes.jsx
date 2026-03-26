import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChildrenApi, DailyNotesApi } from '../../services/api';

export default function StaffNotes() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedChild, setSelectedChild] = useState('');
  const [noteText, setNoteText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, nRes] = await Promise.all([ChildrenApi.getAll(), DailyNotesApi.getAll()]);
      setChildren(cRes.data || []);
      setNotes(nRes.data || []);
      if (cRes.data?.length > 0) setSelectedChild(cRes.data[0]._id);
    } catch (err) {
      console.error('Error loading notes data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedChild || !noteText.trim()) return;
    
    try {
      await DailyNotesApi.create({
        childId: selectedChild,
        staffId: user?.id,
        note: noteText,
        timestamp: new Date().toISOString()
      });
      setNoteText('');
      loadData();
    } catch(err) { alert('Error saving note'); }
  };

  const getChildName = (id) => children.find(c => c._id === id)?.name || 'Unknown Child';

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>Daily Notes</h2>

      <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Write a Note</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <select 
            className="input" 
            value={selectedChild} 
            onChange={e => setSelectedChild(e.target.value)}
            required
          >
            {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <textarea 
            className="input" 
            rows="4" 
            placeholder="What did they do today? (e.g. Ate all their lunch, napped for 2 hours...)"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            required
          ></textarea>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Note</button>
        </form>
      </div>

      <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>Recent Notes</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {notes.length === 0 ? <p className="empty-state">No notes found.</p> : notes.map(note => (
            <div key={note._id} style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, borderLeft: '4px solid #ff9800' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <strong style={{ fontSize: '1.1rem' }}>👶 {getChildName(note.childId)}</strong>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>{note.note}</p>
              <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 10, textAlign: 'right' }}>
                Written by Staff
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
