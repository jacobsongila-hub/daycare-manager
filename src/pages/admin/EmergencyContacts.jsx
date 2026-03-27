import React, { useState, useEffect } from 'react';
import { ChildrenApi, FamiliesApi } from '../../services/api';

export default function EmergencyContacts() {
  const [children, setChildren] = useState([]);
  const [families, setFamilies] = useState({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, fRes] = await Promise.all([ChildrenApi.getAll(), FamiliesApi.getAll()]);
        const kids = cRes.data || [];
        const fams = fRes.data || [];
        
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
      <div style={{ background: 'linear-gradient(135deg, #d32f2f, #f44336)', padding: 25, borderRadius: 16, color: 'white', marginBottom: 25 }}>
        <h2 style={{ margin: '0 0 5px 0' }}>🚨 Emergency Contacts</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Quick dial list for all enrolled children.</p>
      </div>

      <input 
        type="text" 
        className="input" 
        placeholder="Search for a child..." 
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: 20, maxWidth: 400 }}
      />

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredKids.map(child => {
            const fam = families[child.familyId] || {};
            const hasEmergency = [1,2,3,4].some(i => fam[`emergencyName${i}`]);
            const hasPickups = [1,2,3,4].some(i => fam[`pickupName${i}`]);

            return (
              <div key={child._id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: '4px solid #f44336' }}>
                <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                  👶 {child.name}
                </h3>

                {/* Primary Contacts */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>Primary Parents</h4>
                {fam._id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 15 }}>
                     {fam.motherName && (
                       <a href={`tel:${fam.motherPhone}`} className="btn" style={{ display: 'flex', justifyContent: 'space-between', background: '#f5f5f5', border: '1px solid #ddd', textDecoration: 'none', color: '#333' }}>
                         <span>👩 {fam.motherName}</span>
                         <span style={{ color: '#1565c0', fontWeight: 'bold' }}>📞 Call</span>
                       </a>
                     )}
                     {fam.fatherName && (
                       <a href={`tel:${fam.fatherPhone}`} className="btn" style={{ display: 'flex', justifyContent: 'space-between', background: '#f5f5f5', border: '1px solid #ddd', textDecoration: 'none', color: '#333' }}>
                         <span>👨 {fam.fatherName}</span>
                         <span style={{ color: '#1565c0', fontWeight: 'bold' }}>📞 Call</span>
                       </a>
                     )}
                  </div>
                ) : (
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>No family record linked.</p>
                )}

                {/* Other Emergency Contacts */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>🚨 Emergency Contacts</h4>
                {!hasEmergency && !fam.emergencyContactName ? (
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>None listed.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 15 }}>
                    {fam.emergencyContactName && !fam.emergencyName1 && (
                       <a href={`tel:${fam.emergencyContactPhone}`} className="btn" style={{ display: 'flex', justifyContent: 'space-between', background: '#ffebee', border: '1px solid #ffcdd2', textDecoration: 'none', color: '#c62828' }}>
                         <span>👤 {fam.emergencyContactName}</span>
                         <span style={{ fontWeight: 'bold' }}>📞 Call</span>
                       </a>
                    )}
                    {[1, 2, 3, 4].map(i => fam[`emergencyName${i}`] && (
                       <a key={`em-${i}`} href={`tel:${fam[`emergencyPhone${i}`]}`} className="btn" style={{ display: 'flex', justifyContent: 'space-between', background: '#ffebee', border: '1px solid #ffcdd2', textDecoration: 'none', color: '#c62828' }}>
                         <span>👤 {fam[`emergencyName${i}`]} ({fam[`emergencyRelation${i}`] || 'Rel'})</span>
                         <span style={{ fontWeight: 'bold' }}>📞 Call</span>
                       </a>
                    ))}
                  </div>
                )}

                {/* Authorized Pickups */}
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>🚙 Authorized Pick-ups</h4>
                {!hasPickups ? (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>None listed.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3, 4].map(i => fam[`pickupName${i}`] && (
                       <div key={`pu-${i}`} className="btn" style={{ display: 'flex', justifyContent: 'space-between', background: '#e3f2fd', border: '1px solid #bbdefb', color: '#1565c0', cursor: 'default' }}>
                         <span>👤 {fam[`pickupName${i}`]} ({fam[`pickupRelation${i}`]})</span>
                         <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>ID: {fam[`pickupPhone${i}`]}</span>
                       </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
