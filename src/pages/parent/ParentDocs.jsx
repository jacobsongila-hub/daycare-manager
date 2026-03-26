import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DocumentsApi, FamiliesApi } from '../../services/api';

export default function ParentDocs() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Find the family record linked to this user account
      const fRes = await FamiliesApi.getAll();
      const myFam = (fRes.data || []).find(f => f.userId === user?.id);
      setFamily(myFam);

      const res = await DocumentsApi.getAll();
      const myDocs = (res.data || []).filter(d => 
        d.ownerId === 'general' || 
        d.ownerId === user?.id || 
        (myFam && d.ownerId === myFam._id)
      );
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
    const data = Object.fromEntries(formData);
    
    // Mock upload URL
    data.url = `https://dummyfile.com/${Math.random().toString(36).substring(7)}.jpeg`;
    data.ownerId = family ? family._id : user?.id; // Link to family if exists
    data.type = 'Family Document';
    
    try {
      await DocumentsApi.create(data);
      e.target.reset();
      loadData();
    } catch(err) { alert('Error uploading document'); }
  };

  const deleteDoc = async (id) => {
    if(!window.confirm('Delete document?')) return;
    try {
      await DocumentsApi.delete(id);
      loadData();
    } catch(err) { alert('Error deleting'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ marginBottom: 20 }}>Family Documents & Photos</h2>

      <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 25 }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Upload Medical Form / Vaccination / Photo</h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <input name="title" placeholder="File Description (e.g., Asthma Plan)" required className="input" />
          <input name="category" placeholder="Category (e.g., Medical, Photo, Signed Form)" required className="input" />
          <input type="file" required className="input" style={{ background: '#f5f5f5', padding: 10 }} />
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', background: '#8e24aa' }}>Upload File</button>
        </form>
      </div>

      <h3 style={{ margin: '0 0 15px 0', color: '#555' }}>Shared With Me</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15 }}>
          {docs.length === 0 ? <p className="empty-state">No documents available.</p> : docs.map(doc => (
            <div key={doc._id} style={{ background: '#f3e5f5', padding: 15, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
               <div style={{ display: 'flex', alignItems: 'flex-start', gap: 15 }}>
                  <div style={{ fontSize: '2.5rem', background: 'white', width: 50, height: 50, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {doc.category?.toLowerCase().includes('photo') ? '📸' : '📄'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', color: '#6a1b9a' }}>{doc.title}</h4>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>
                      📅 {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'auto' }}>
                  {(doc.ownerId === user?.id || (family && doc.ownerId === family._id)) && (
                    <button className="btn" onClick={() => deleteDoc(doc._id)} style={{ border: 'none', background: 'white', fontSize: '1.2rem', padding: '5px 10px' }}>🗑️</button>
                  )}
                  <a href={doc.url} target="_blank" rel="noreferrer" className="btn" style={{ background: '#8e24aa', color: 'white', textDecoration: 'none', padding: '8px 15px' }}>⬇️ Download</a>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
