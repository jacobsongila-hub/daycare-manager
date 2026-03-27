import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { ChildrenApi, DailyNotesApi } from '../../services/api';

export default function AdminNotes() {
  const { addToast } = useNotification();
  const { t, lang } = useLanguage();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [noteText, setNoteText] = useState('');
  const [mood, setMood] = useState('😊');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [cRes, nRes] = await Promise.all([ChildrenApi.getAll(), DailyNotesApi.getAll()]);
        setChildren(cRes.data || []);
        const fetchedNotes = (nRes.data || []).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotes(fetchedNotes);
      } catch (err) { }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSave = async () => {
    if (!selectedChild || !noteText) {
      addToast('Please select a child and enter a note', 'warning');
      return;
    }
    try {
      const fullNote = `${mood} ${noteText}`;
      const newNote = { childId: selectedChild, note: fullNote, timestamp: new Date().toISOString() };
      await DailyNotesApi.create(newNote);
      setNotes([newNote, ...notes]);
      setNoteText('');
      setMood('😊');
      setSelectedChild('');
      addToast(t('noteSaved') || 'Note saved successfully!', 'success');
    } catch(err) { addToast(t('failedToSaveNote') || 'Failed to save', 'error'); }
  };

  const moods = [
    { icon: '😊', label: 'Happy' },
    { icon: '😇', label: 'Angel' },
    { icon: '😴', label: 'Sleepy' },
    { icon: '🤒', label: 'Sick' },
    { icon: '😢', label: 'Sad' },
    { icon: '😋', label: 'Hungry' },
    { icon: '⚡', label: 'Energetic' },
  ];

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF9800, #F57C00)', padding: '30px', borderRadius: 20, color: 'white', marginBottom: 25, boxShadow: '0 10px 20px rgba(255, 152, 0, 0.2)' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>📋 Daily Notes</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Share daily highlights and updates with parents.</p>
      </div>
      
      <div className="card" style={{ padding: '30px', marginBottom: 30, background: '#fff', borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#444' }}>{t('createUpdate') || 'Create Daily Update'}</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 8 }}>{t('selectChild')}</label>
            <select className="input" value={selectedChild} onChange={e => setSelectedChild(e.target.value)} style={{ padding: '12px' }}>
              <option value="">{t('chooseChild') || '-- Choose child --'}</option>
              {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 12, display: 'block' }}>{t('moodOfToday') || "Mood of the day"}</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {moods.map(m => (
                <button 
                  key={m.icon} 
                  type="button"
                  onClick={() => setMood(m.icon)}
                  style={{ 
                    background: mood === m.icon ? '#fef3c7' : '#f8f9fa', 
                    border: mood === m.icon ? '2px solid #fbbf24' : '1px solid #e5e7eb', 
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px', 
                    cursor: 'pointer', 
                    fontSize: '1.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: mood === m.icon ? 'scale(1.15) translateY(-5px)' : 'scale(1)',
                    boxShadow: mood === m.icon ? '0 8px 15px rgba(251, 191, 36, 0.2)' : '0 2px 5px rgba(0,0,0,0.02)'
                  }}
                  title={m.label}
                  className="mood-button"
                >
                  {m.icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 8 }}>{t('messageForParent') || 'Message for Parent'}</label>
            <textarea 
              className="input" 
              rows="4" 
              placeholder={t('notePlaceholder') || "What did they do today?..."}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              style={{ fontSize: '1rem', padding: '15px' }}
            />
          </div>
          
          <button className="btn btn-primary" onClick={handleSave} style={{ alignSelf: 'flex-start', padding: '15px 40px', fontSize: '1.1rem', fontWeight: 800, borderRadius: 12 }}>
             🚀 {t('postNote') || 'Post Update'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#444' }}>{t('recentTimeline') || 'Recent Timeline'}</h3>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {notes.map((n, i) => (
            <div key={i} className="card" style={{ borderLeft: '6px solid var(--primary)', padding: '20px', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a1a1a' }}>
                    {children.find(c => c._id === n.childId)?.name || 'Child Account'}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.8rem', fontWeight: 600, marginTop: 2 }}>
                    {new Date(n.timestamp).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{ color: '#444', fontSize: '1.1rem', lineHeight: 1.6, background: '#f9f9f9', padding: '15px', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                {n.note}
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="empty-state" style={{ padding: '60px', background: 'white', borderRadius: 16 }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>📭</div>
              <p style={{ color: '#888', fontWeight: 600 }}>No daily notes have been posted yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
