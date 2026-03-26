import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DocumentsApi, FamiliesApi } from '../../services/api';

export default function ParentPhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const fRes = await FamiliesApi.getAll();
        const myFam = (fRes.data || []).find(f => f.userId === user?.id);

        const res = await DocumentsApi.getAll();
        // Filter by category == Photo and owner == general or my family
        const allPhotos = (res.data || []).filter(d => 
          d.category?.toLowerCase().includes('photo') &&
          (d.ownerId === 'general' || d.ownerId === user?.id || (myFam && d.ownerId === myFam._id))
        );
        setPhotos(allPhotos);
      } catch (err) {
        console.error('Error loading photos', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [user]);

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg, #8e24aa, #6a1b9a)', padding: 25, borderRadius: 16, color: 'white', marginBottom: 25 }}>
        <h2 style={{ margin: '0 0 5px 0' }}>📸 Photo Gallery</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Memories from the daycare shared directly with you.</p>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 15 }}>
          {photos.length === 0 ? <p className="empty-state" style={{ gridColumn: '1 / -1' }}>No photos available yet.</p> : photos.map(photo => (
            <div key={photo._id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
              {/* Dummy Image logic since we store mocked URLs */}
              <div style={{ width: '100%', aspectRatio: '1', background: '#e1bee7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', cursor: 'pointer' }} onClick={() => window.open(photo.url, '_blank')}>
                🖼️
              </div>
              <div style={{ padding: 10, textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.title}</h4>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(photo.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
