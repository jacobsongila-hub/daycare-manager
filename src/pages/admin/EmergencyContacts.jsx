import React, { useState, useEffect } from 'react';
import { ChildrenApi, FamiliesApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function EmergencyContacts() {
  const { t, lang } = useLanguage();
  const [children, setChildren] = useState([]);
  const [families, setFamilies] = useState({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, fRes] = await Promise.all([ChildrenApi.getAll(), FamiliesApi.getAll()]);
        const kids = Array.isArray(cRes.data) ? cRes.data : [];
        const fams = Array.isArray(fRes.data) ? fRes.data : [];
        
        const famDict = {};
        fams.forEach(f => { famDict[f._id] = f; });
        
        setChildren(kids);
        setFamilies(famDict);
      } catch (err) {
        console.error('Error loading contacts', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredKids = children.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #d32f2f, #f44336)', padding: '30px', borderRadius: 20, color: 'white', marginBottom: 25, boxShadow: '0 10px 20px rgba(211, 47, 47, 0.2)' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.8rem' }}>🚨 Emergency Dashboard</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Quick-dial access to parents and authorized contacts.</p>
      </div>

      <div style={{ background: 'white', padding: '15px 20px', borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: 25, display: 'flex', alignItems: 'center', gap: 15 }}>
        <span style={{ fontSize: '1.2rem' }}>🔍</span>
        <input 
          type="text" 
          className="input" 
          placeholder="Search child name..." 
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ border: 'none', padding: '10px', fontSize: '1rem', width: '100%', outline: 'none' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 25 }}>
          {filteredKids.map(child => {
            const fam = families[child.familyId] || {};
            const hasEmergency = [1,2,3,4].some(i => fam[`emergencyName${i}`]);
            const hasPickups = [1,2,3,4].some(i => fam[`pickupName${i}`]);

            return (
              <div key={child._id} className="card" style={{ padding: 0, overflow: 'hidden', borderTop: '6px solid #f44336', borderRadius: 16 }}>
                <div style={{ background: 'var(--surface-2)', padding: '15px 20px', borderBottom: '1px solid #eee' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem' }}>👶 {child.name}</h3>
                </div>

                <div style={{ padding: '20px' }}>
                  {/* Primary Contacts */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{t('primaryGuardians') || 'Primary Guardians'}</h4>
                  {fam._id ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                       {fam.motherName && (
                         <a href={`tel:${fam.motherPhone}`} style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: '#f8f9fa', border: '1px solid #eee', borderRadius: 10, textDecoration: 'none', color: '#1a1a1a' }}>
                           <span style={{ fontSize: '0.8rem', color: '#666' }}>👩 {t('mother') || 'Mother'}</span>
                           <strong style={{ fontSize: '0.95rem' }}>{fam.motherName}</strong>
                           <span style={{ color: '#1565c0', fontWeight: 800, fontSize: '0.8rem', marginTop: 4 }}>📞 {fam.motherPhone}</span>
                         </a>
                       )}
                       {fam.fatherName && (
                         <a href={`tel:${fam.fatherPhone}`} style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: '#f8f9fa', border: '1px solid #eee', borderRadius: 10, textDecoration: 'none', color: '#1a1a1a' }}>
                           <span style={{ fontSize: '0.8rem', color: '#666' }}>👨 {t('father') || 'Father'}</span>
                           <strong style={{ fontSize: '0.95rem' }}>{fam.fatherName}</strong>
                           <span style={{ color: '#1565c0', fontWeight: 800, fontSize: '0.8rem', marginTop: 4 }}>📞 {fam.fatherPhone}</span>
                         </a>
                       )}
                    </div>
                  ) : (
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>No profile linked.</p>
                  )}

                  {/* Other Emergency Contacts */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#d32f2f', textTransform: 'uppercase', letterSpacing: 1, borderTop: '1px solid #eee', paddingTop: 15 }}>🚨 Backup Emergency</h4>
                  {!hasEmergency ? (
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>None configured.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[1, 2, 3, 4].map(i => fam[`emergencyName${i}`] && (
                         <a key={`em-${i}`} href={`tel:${fam[`emergencyPhone${i}`]}`} style={{ display: 'flex', flexDirection: 'column', padding: '10px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, textDecoration: 'none', color: '#c53030' }}>
                           <span style={{ fontSize: '0.75rem' }}>👤 {fam[`emergencyRelation${i}`] || 'Relation'}</span>
                           <strong style={{ fontSize: '0.9rem' }}>{fam[`emergencyName${i}`]}</strong>
                           <span style={{ fontWeight: 800, fontSize: '0.8rem', marginTop: 4 }}>📞 {fam[`emergencyPhone${i}`]}</span>
                         </a>
                      ))}
                    </div>
                  )}

                  {/* Authorized Pickups */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#2b6cb0', textTransform: 'uppercase', letterSpacing: 1, borderTop: '1px solid #eee', paddingTop: 15 }}>🚙 Authorized Pick-up List</h4>
                  {!hasPickups ? (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>Family only.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[1, 2, 3, 4].map(i => fam[`pickupName${i}`] && (
                         <div key={`pu-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ebf8ff', padding: '10px 15px', borderRadius: 10, border: '1px solid #bee3f8', color: '#2c5282' }}>
                           <div>
                             <strong style={{ fontSize: '0.9rem' }}>{fam[`pickupName${i}`]}</strong>
                             <div style={{ fontSize: '0.75rem' }}>{fam[`pickupRelation${i}`]}</div>
                           </div>
                           <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>ID/Phone: {fam[`pickupPhone${i}`]}</div>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
