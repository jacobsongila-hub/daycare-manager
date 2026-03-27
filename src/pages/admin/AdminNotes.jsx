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
      addToast(t('noteSaved') || 'Note saved!', 'success');
    } catch(err) { addToast(t('failedToSaveNote') || 'Failed to save', 'error'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div className="page-header" style={{ marginBottom: 25 }}>
        <div>
          <h2 className="page-title">📋 {t('notes')}</h2>
          <p className="page-subtitle">{t('writeQuickNotes') || 'Write quick daily notes for children. Parents will see these updates.'}</p>
        </div>
      </div>
      
      <div className="card" style={{ padding: 25, marginBottom: 30, background: '#fff' }}>
        <h3 className="section-label" style={{ marginBottom: 20 }}>{t('newNote')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div className="form-group">
            <label className="form-label">{t('selectChild')}</label>
            <select className="input" value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
              <option value="">{t('selectReason')}</option>
              {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('notes')}</label>
            <textarea 
              className="input" 
              rows="4" 
              placeholder={t('writeNotePrompt')}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              style={{ paddingBottom: 40 }}
            />
            <div style={{ padding: '8px 10px', background: '#f5f5f5', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, border: '1px solid var(--border)', borderTop: 'none', display: 'flex', gap: 10, marginTop: -6, overflowX: 'auto' }}>
              {['😊','😍','😴','🍼','💩','🤒','🎨','🎶','🍎','🏆'].map(emoji => (
                <button 
                  key={emoji}
                  type="button"
                  onClick={() => setNoteText(prev => prev + emoji)}
                  style={{ background: 'white', border: '1px solid #ddd', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={handleSave} style={{ alignSelf: 'flex-start', padding: '12px 30px' }}>
            {t('saveNote')}
          </button>
        </div>
      </div>

      <h3 className="section-label" style={{ marginBottom: 15 }}>{t('recentNotes')}</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notes.map((n, i) => (
            <div key={i} className="card" style={{ borderLeft: '5px solid var(--primary)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                  {children.find(c => c._id === n.childId)?.name || 'Unknown Child'}
                </div>
                <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {new Date(n.timestamp).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>{n.note}</div>
            </div>
          ))}
          {notes.length === 0 && <p className="empty-state">{t('noEntries') || 'No notes yet'}</p>}
        </div>
      )}
    </div>
  );
}
