import React, { useState, useEffect } from 'react';
import { PhotosApi, ChildrenApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function AdminPhotos() {
  const [photos, setPhotos] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [base64File, setBase64File] = useState('');
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const { confirm } = useConfirm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        PhotosApi.getAll().catch(() => ({ data: [] })),
        ChildrenApi.getAll().catch(() => ({ data: [] }))
      ]);
      setPhotos(pRes.data || []);
      setChildren(cRes.data || []);
    } catch (err) {
      addToast(t('errorLoadingPhotos') || 'Failed to load photos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setBase64File(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!base64File) return addToast('Please select a photo', 'error');
    
    setUploading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const selectedChildIds = Array.from(e.target.childIds.selectedOptions).map(o => o.value);
    
    data.url = base64File;
    data.childIds = selectedChildIds;
    data.date = new Date().toISOString().split('T')[0];
    
    try {
      await PhotosApi.create(data);
      addToast(t('photoUploaded') || 'Photo uploaded successfuly', 'success');
      setShowUploadModal(false);
      setPreviewUrl('');
      setBase64File('');
      loadData();
    } catch (err) { 
      addToast(t('uploadFailed') || 'Upload failed', 'error'); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm(t('confirmDelete') || 'Delete this photo?', 'Confirm Delete', true))) return;
    try {
      await PhotosApi.delete(id);
      addToast(t('photoDeleted') || 'Photo deleted', 'success');
      setPhotos(prev => prev.filter(p => p._id !== id));
    } catch (err) { 
      addToast(t('deleteFailed') || 'Delete failed', 'error'); 
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <div>
          <h2 style={{ margin: 0 }}>📸 {t('photos')}</h2>
          <p style={{ margin: 0, color: '#666' }}>Share moments and tag children for parents.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          ➕ {t('uploadPhoto')}
        </button>
      </div>
      
      {/* Photo Grid */}
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {photos.length === 0 ? <p className="empty-state">{t('noPhotos')}</p> : photos.map(p => (
            <div key={p._id} className="photo-card" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'relative' }}>
              <img src={p.url} alt={p.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
              <div style={{ padding: 15 }}>
                <h4 style={{ margin: '0 0 5px 0' }}>{p.title}</h4>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 10 }}>📅 {p.date}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {p.childIds?.map(cid => {
                    const child = children.find(c => c._id === cid);
                    return child ? (
                      <span key={cid} style={{ fontSize: '0.7rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: 10 }}>
                        👶 {child.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <button 
                onClick={() => handleDelete(p._id)}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: '#f44336' }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <h3>{t('uploadPhoto')}</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5 }}>{t('photoTitle') || 'Title'}</label>
                <input name="title" required className="input" autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5 }}>{t('photo') || 'Photo'}</label>
                <input type="file" accept="image/*" required className="input" onChange={handleFileChange} />
                {previewUrl && (
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 'bold' }}>{t('tagChildren')}:</label>
                <select name="childIds" multiple className="input" style={{ height: 150 }}>
                  {children.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowUploadModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? '...' : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
