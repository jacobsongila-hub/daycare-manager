import React, { useState, useEffect } from 'react';
import { DocumentsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDocs() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await DocumentsApi.getAll();
      setDocs(res.data || []);
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
    
    // Mock upload URL for demo
    data.url = `https://dummyfile.com/${Math.random().toString(36).substring(7)}.pdf`;
    data.type = 'General Document';
    
    try {
      await DocumentsApi.create(data);
      e.target.reset();
      loadData();
    } catch(err) { alert('Upload failed'); }
  };

  const deleteDoc = async (id) => {
    if(!window.confirm('Delete document permanently?')) return;
    try {
      await DocumentsApi.delete(id);
      loadData();
    } catch(err) { alert('Delete failed'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #00838f, #00acc1)', padding: 25, borderRadius: 16, color: 'white', marginBottom: 25 }}>
        <h2 style={{ margin: '0 0 5px 0' }}>📁 Center Documents</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Upload policy guides, forms, and manuals for parents or staff.</p>
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#00838f' }}>Distribute New Document</h3>
        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, alignItems: 'end' }}>
          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 5 }}>File Name (e.g. Employee Handbook 2024)</label>
             <input name="title" required className="input" />
          </div>
          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 5 }}>Category (Policy, Medical Form, etc)</label>
             <input name="category" required className="input" defaultValue="Policy" />
          </div>
          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 5 }}>Visibility</label>
             <select name="ownerId" required className="input">
               <option value="general">Public / All Users (Staff & Parents)</option>
               <option value="staff-only">Staff Only Database</option>
             </select>
          </div>
          <div>
             <input type="file" required className="input" style={{ width: '100%', background: '#f5f5f5', padding: '8px' }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', padding: '12px', background: '#00838f' }}>📤 Upload & Distribute</button>
        </form>
      </div>

      <h3 style={{ margin: '0 0 15px 0', color: '#444' }}>Document Repository</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {docs.length === 0 ? <p className="empty-state">No files uploaded yet.</p> : docs.map(doc => (
            <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `5px solid ${doc.ownerId === 'general' ? '#4caf50' : '#ff9800'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ fontSize: '2.5rem' }}>📄</div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{doc.title}</h4>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                    📅 {new Date(doc.createdAt).toLocaleDateString()} | 🏷️ {doc.category} | 👁️ {doc.ownerId === 'general' ? 'Visible to All' : 'Restricted'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a href={doc.url} target="_blank" rel="noreferrer" className="btn" style={{ background: '#e0f7fa', color: '#00838f', textDecoration: 'none' }}>⬇️ Download</a>
                <button className="btn" onClick={() => deleteDoc(doc._id)} style={{ color: '#d32f2f', background: '#ffebee', border: 'none' }}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
