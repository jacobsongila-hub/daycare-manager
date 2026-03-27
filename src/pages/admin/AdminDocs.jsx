import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { DocumentsApi, FamiliesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminDocs() {
  const { addToast } = useNotification();
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [families, setFamilies] = useState([]);
  const [visibility, setVisibility] = useState('general');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { confirm } = useConfirm();
  const { t } = useLanguage();

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, fRes] = await Promise.all([
        DocumentsApi.getAll().catch(() => ({ data: [] })),
        FamiliesApi.getAll().catch(() => ({ data: [] }))
      ]);
      setDocs(dRes.data || []);
      setFamilies(fRes.data || []);
    } catch (err) {
      console.error('Error loading documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const file = e.target.file.files[0];
    
    if (!file) return addToast(t('selectFile') || 'Please select a file', 'error');
    if (data.ownerId === 'private' && !data.familyId) {
      return addToast(t('selectFamilyPrivate') || 'Please select a family for private upload', 'warning');
    }

    setUploading(true);
    
    // Set official ownerId for private docs
    if (data.ownerId === 'private') {
      data.ownerId = `family-${data.familyId}`;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      data.url = reader.result; // Base64
      data.type = file.type || 'application/pdf';
      try {
        await DocumentsApi.create(data);
        addToast(t('uploadSuccess') || 'Document uploaded successfully', 'success');
        e.target.reset();
        setVisibility('general');
        loadData();
      } catch(err) { 
        addToast(t('uploadFailed') || 'Upload failed', 'error'); 
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteDoc = async (id) => {
    if(!(await confirm(t('confirmDelete') || 'Delete document permanently?', 'Confirm Delete', true))) return;
    try {
      await DocumentsApi.delete(id);
      addToast(t('deleted') || 'Document deleted', 'success');
      loadData();
    } catch(err) { addToast(t('deleteFailed') || 'Delete failed', 'error'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #00838f, #00acc1)', padding: '30px', borderRadius: 20, color: 'white', marginBottom: 25, boxShadow: '0 10px 20px rgba(0, 131, 143, 0.2)' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>📁 Document Hub</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Upload general policies or send private files to parents.</p>
      </div>

      <div className="card" style={{ padding: '25px', borderRadius: 16, background: '#fff', marginBottom: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#006064' }}>{t('uploadNewDoc') || 'Upload New Document'}</h3>
        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">{t('documentTitle') || 'Document Title'}</label>
            <input name="title" required className="input" placeholder="e.g. Monthly Newsletter" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('category') || 'Category'}</label>
            <input name="category" required className="input" defaultValue="General" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('visibility') || 'Visibility'}</label>
            <select 
              name="ownerId" 
              required 
              className="input" 
              value={visibility} 
              onChange={e => setVisibility(e.target.value)}
            >
              <option value="general">{t('allParents') || 'All Parents (General)'}</option>
              <option value="staff-only">{t('staffOnlyDoc') || 'Staff Only'}</option>
              <option value="private">{t('privateParent') || 'Private to Parent'}</option>
            </select>
          </div>
          
          {visibility === 'private' && (
            <div className="form-group">
              <label className="form-label">{t('targetFamily') || 'Target Family'}</label>
              <select name="familyId" required className="input">
                <option value="">-- {t('selectFamily') || 'Select Family'} --</option>
                {families.map(f => <option key={f._id} value={f._id}>{f.familyName}</option>)}
              </select>
            </div>
          )}

          <div className="form-group" style={{ gridColumn: visibility === 'private' ? 'span 2' : 'auto' }}>
            <label className="form-label">{t('selectFile') || 'Select File'}</label>
            <input type="file" name="file" required className="input" style={{ width: '100%', padding: '10px', background: '#f9f9f9' }} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={uploading} style={{ gridColumn: 'span 2', padding: '15px', background: '#00838f', fontSize: '1.1rem', fontWeight: 800, borderRadius: 12 }}>
            {uploading ? t('uploading') || 'Uploading...' : `📤 ${t('publishDocument') || 'Publish Document'}`}
          </button>
        </form>
      </div>

      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', color: '#444' }}>{t('storedFiles') || 'Stored Files'}</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {docs.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px', background: 'white', borderRadius: 16 }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>📥</div>
              <p style={{ color: '#888', fontWeight: 600 }}>No documents have been uploaded yet.</p>
            </div>
          ) : docs.map(doc => {
            const isPrivate = doc.ownerId?.startsWith('family-');
            const familyId = isPrivate ? doc.ownerId.replace('family-', '') : null;
            const targetFamily = families.find(f => f._id === familyId);
            
            return (
              <div key={doc._id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: 'white', 
                padding: '20px', 
                borderRadius: 15, 
                boxShadow: '0 4px 6px rgba(0,0,0,0.03)', 
                borderLeft: `6px solid ${isPrivate ? '#673ab7' : (doc.ownerId === 'general' ? '#4caf50' : '#ff9800')}` 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ fontSize: '2.5rem', background: '#f0f0f0', width: 60, height: 60, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</div>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.15rem', color: '#1a1a1a' }}>{doc.title}</h4>
                    <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ background: '#eee', padding: '2px 8px', borderRadius: 4 }}>📅 {new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span style={{ background: '#eee', padding: '2px 8px', borderRadius: 4 }}>🏷️ {doc.category}</span>
                      <span style={{ 
                        background: isPrivate ? '#f3e5f5' : (doc.ownerId === 'general' ? '#e8f5e9' : '#fff3e0'),
                        color: isPrivate ? '#6a1b9a' : (doc.ownerId === 'general' ? '#2e7d32' : '#e65100'),
                        padding: '2px 8px', 
                        borderRadius: 4,
                        fontWeight: 700
                      }}>
                        👁️ {isPrivate ? `${t('privateTo') || 'Private to'}: ${targetFamily?.familyName || 'Family'}` : (doc.ownerId === 'general' ? t('everyone') || 'Everyone' : t('staffOnly') || 'Staff Only')}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="btn" style={{ background: '#e0f7fa', color: '#00838f', textDecoration: 'none', fontWeight: 700 }}>⬇️ View</a>
                  <button className="btn" onClick={() => deleteDoc(doc._id)} style={{ color: '#d32f2f', background: '#ffebee', border: 'none', fontWeight: 600 }}>🗑️ {t('delete') || 'Delete'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
