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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { confirm } = useConfirm();
  const { t } = useLanguage();

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, fRes] = await Promise.all([DocumentsApi.getAll(), FamiliesApi.getAll()]);
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
    const file = e.target.file.files[0];
    if (!file) return addToast(t('selectFile') || 'Please select a file', 'error');

    setUploading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (data.ownerId === 'private' && data.familyId) {
      data.ownerId = data.familyId;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      data.url = reader.result; // Base64
      data.type = file.type || 'application/pdf';
      try {
        await DocumentsApi.create(data);
        addToast(t('photoUploaded') || 'Uploaded successfuly', 'success');
        e.target.reset();
        loadData();
      } catch(err) { addToast(t('uploadFailed') || 'Upload failed', 'error'); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const deleteDoc = async (id) => {
    if(!(await confirm(t('confirmDelete') || 'Delete document permanently?', 'Confirm Delete', true))) return;
    try {
      await DocumentsApi.delete(id);
      addToast(t('photoDeleted') || 'Deleted', 'success');
      loadData();
    } catch(err) { addToast(t('deleteFailed') || 'Delete failed', 'error'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #00838f, #00acc1)', padding: 25, borderRadius: 16, color: 'white', marginBottom: 25 }}>
        <h2 style={{ margin: '0 0 5px 0' }}>📁 {t('centerDocs')}</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>{t('centerDocsDesc')}</p>
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#00838f' }}>{t('distributeNewDoc')}</h3>
        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, alignItems: 'end' }}>
          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 5 }}>{t('fileNameHint')}</label>
             <input name="title" required className="input" />
          </div>
          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 5 }}>{t('categoryHint')}</label>
             <input name="category" required className="input" defaultValue="Policy" />
          </div>
          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 5 }}>{t('visibility')}</label>
             <select name="ownerId" required className="input">
               <option value="general">{t('publicVisibility')}</option>
               <option value="staff-only">{t('staffOnlyVisibility')}</option>
             </select>
          </div>
          <div>
             <input type="file" name="file" required className="input" style={{ width: '100%', background: '#f5f5f5', padding: '8px' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading} style={{ gridColumn: 'span 2', padding: '12px', background: '#00838f' }}>
            {uploading ? '...' : `📤 ${t('uploadAndDistribute')}`}
          </button>
        </form>
      </div>

      <h3 style={{ margin: '0 0 15px 0', color: '#444' }}>{t('docRepository')}</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {docs.length === 0 ? <p className="empty-state">{t('noFilesUploaded')}</p> : docs.map(doc => (
            <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `5px solid ${doc.ownerId === 'general' ? '#4caf50' : '#ff9800'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ fontSize: '2.5rem' }}>📄</div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{doc.title}</h4>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                    📅 {new Date(doc.createdAt).toLocaleDateString()} | 🏷️ {doc.category} | 👁️ {doc.ownerId === 'general' ? t('visibleToAll') : (doc.ownerId === 'staff-only' ? t('restrictedStaff') : `${t('privateTo')}: ${families.find(f => f._id === doc.familyId)?.familyName || 'Unknown Family'}`)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a href={doc.url} target="_blank" rel="noreferrer" className="btn" style={{ background: '#e0f7fa', color: '#00838f', textDecoration: 'none' }}>⬇️ {t('download')}</a>
                <button className="btn" onClick={() => deleteDoc(doc._id)} style={{ color: '#d32f2f', background: '#ffebee', border: 'none' }}>🗑️ {t('delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
