import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChildrenApi, DailyNotesApi } from '../../services/api';

export default function AdminNotes() {
  const { t } = useLanguage();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [cRes, nRes] = await Promise.all([ChildrenApi.getAll(), DailyNotesApi.getAll()]);
        setChildren(cRes.data || []);
        setNotes((nRes.data || []).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (err) { }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSave = async () => {
    if (!selectedChild || !noteText) return;
    try {
      const newNote = { childId: selectedChild, note: noteText, timestamp: new Date().toISOString() };
      await DailyNotesApi.create(newNote);
      setNotes([newNote, ...notes]);
      setNoteText('');
      alert('Note saved!');
    } catch(err) { alert('Failed to save'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2>📋 {t('notes') || 'Daily Notes'}</h2>
      <p style={{ color: '#555', marginBottom: 20 }}>Write quick daily notes for children. Parents will see these updates.</p>
      
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 15px 0' }}>New Note</h3>
        <select className="input-field" value={selectedChild} onChange={e => setSelectedChild(e.target.value)} style={{ marginBottom: 15 }}>
          <option value="">-- Select Child --</option>
          {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <textarea 
          className="input-field" 
          rows="4" 
          placeholder="Write note here (e.g. Ate all lunch, slept for 2 hours...)"
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          style={{ marginBottom: 15 }}
        />
        <button className="btn btn-primary" onClick={handleSave}>Save Note</button>
      </div>

      <h3 style={{ margin: '0 0 15px 0' }}>Recent Notes</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map((n, i) => (
            <div key={i} style={{ background: 'white', padding: 15, borderRadius: 8, borderLeft: '4px solid #ff9800' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 5 }}>{children.find(c => c._id === n.childId)?.name || 'Unknown Child'}</div>
              <div style={{ color: '#555', fontSize: '0.95rem', marginBottom: 5 }}>{n.note}</div>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>{new Date(n.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
