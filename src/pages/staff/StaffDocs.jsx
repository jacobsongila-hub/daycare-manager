import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DocumentsApi } from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';
import { useNotification } from '../../context/NotificationContext';

export default function StaffDocs() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();
  const { addToast } = useNotification();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await DocumentsApi.getAll();
      const myDocs = (res.data || []).filter(d => d.ownerId === user?.id || d.ownerId === 'general');
      setDocs(myDocs);
    } catch (err) {
      console.error('Error loading documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { Object.keys(user || {}).length > 0 && loadData(); }, [user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = e.target.querySelector('input[type="file"]').files[0];
    if (!file) { addToast('Please select a file', 'warning'); return; }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const payload = {
          title: formData.get('title'),
          category: formData.get('category'),
          url: reader.result, // Base64 string
          ownerId: user?.id,
          type: 'Staff Document'
        };
        await DocumentsApi.create(payload);
        e.target.reset();
        addToast('Document uploaded', 'success');
        loadData();
      } catch(err) { addToast('Error uploading document', 'error'); }
    };
    reader.readAsDataURL(file);
  };

  const deleteDoc = async (id) => {
    if(!(await confirm('Delete document?', 'Confirm Delete', true))) return;
    try {
      await DocumentsApi.delete(id);
      addToast('Document deleted', 'success');
      loadData();
    } catch(err) { addToast('Error deleting', 'error'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>My Documents</h2>

      <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Upload New Document</h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <input name="title" placeholder="Document Title (e.g., CPR Certificate)" required className="input" />
          <input name="category" placeholder="Category (e.g., Certifications, ID, Medical)" required className="input" />
          <input type="file" required className="input" style={{ background: '#f5f5f5', padding: 10 }} />
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '12px 25px', borderRadius: 12, fontWeight: 800 }}>
            📤 Upload to Office
          </button>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>Documents uploaded here (like certificates or IDs) are visible to the administration.</p>
        </form>
      </div>

      <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>Uploaded Files</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {docs.length === 0 ? <p className="empty-state">No documents uploaded.</p> : docs.map(doc => (
            <div key={doc._id} style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ fontSize: '2rem' }}>📄</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{doc.title}</h4>
                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 5 }}>
                      📅 {new Date(doc.createdAt).toLocaleDateString()} | 🏷️ {doc.category}
                    </div>
                  </div>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="btn" style={{ background: '#e3f2fd', color: '#1565c0', textDecoration: 'none' }}>⬇️ Download</a>
                  {doc.ownerId === user?.id && <button className="btn" onClick={() => deleteDoc(doc._id)} style={{ border: 'none', background: 'none' }}>🗑️</button>}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
