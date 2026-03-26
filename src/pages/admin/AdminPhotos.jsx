import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminPhotos() {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState([
    { id: 1, url: 'https://images.unsplash.com/photo-1540479859555-17a9aaae1dd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', date: '2026-03-20', title: 'Playtime' },
    { id: 2, url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', date: '2026-03-21', title: 'Art Class' },
  ]);

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>📸 {t('photos') || 'Upload Photos'}</h2>
        <button className="btn btn-primary">➕ Upload New</button>
      </div>
      <p style={{ color: '#555', marginBottom: 20 }}>Share photos of activities with parents. They will see these in their portal.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 15 }}>
        {photos.map(p => (
          <div key={p.id} style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <img src={p.url} alt={p.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
            <div style={{ padding: 10 }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>{p.date}</div>
              <button style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', padding: '5px 0 0 0', fontSize: '0.8rem' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
