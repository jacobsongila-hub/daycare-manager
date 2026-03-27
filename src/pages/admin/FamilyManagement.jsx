import React, { useState, useEffect } from 'react';
import { FamiliesApi, ChildrenApi } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { calculateAge } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function FamilyManagement() {
  const [families, setFamilies] = useState([]);
  const [childrenDict, setChildrenDict] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const { confirm } = useConfirm();

  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editFamily, setEditFamily] = useState(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [activeFamilyId, setActiveFamilyId] = useState(null);
  const [editChild, setEditChild] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, cRes] = await Promise.all([FamiliesApi.getAll(), ChildrenApi.getAll()]);
      const fams = fRes.data || [];
      const kids = cRes.data || [];
      
      setFamilies(fams);
      
      const dict = {};
      kids.forEach(k => {
        if (!dict[k.familyId]) dict[k.familyId] = [];
        dict[k.familyId].push(k);
      });
      setChildrenDict(dict);
    } catch (err) {
      console.error('Error loading families/children', err);
      addToast('Failed to load family data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveFamily = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      if (editFamily) {
        await FamiliesApi.update(editFamily._id, data);
        addToast('Family updated successfully', 'success');
      } else {
        await FamiliesApi.create(data);
        addToast('New family added', 'success');
      }
      setShowFamilyModal(false);
      loadData();
    } catch (err) { 
      addToast('Error saving family profile', 'error'); 
    }
  };

  const handleDeleteFamily = async (id) => {
    if (!(await confirm('Are you sure you want to delete this family and all linked records?', 'Confirm Delete', true))) return;
    try {
      await FamiliesApi.delete(id);
      addToast('Family deleted', 'success');
      loadData();
    } catch (err) { 
      addToast('Error deleting family', 'error'); 
    }
  };

  const handleSaveChild = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.familyId = activeFamilyId;
    
    try {
      if (editChild) {
        await ChildrenApi.update(editChild._id, data);
        addToast('Child profile updated', 'success');
      } else {
        await ChildrenApi.create(data);
        addToast('New child added to family', 'success');
      }
      setShowChildModal(false);
      loadData();
    } catch (err) { 
      addToast('Error saving child information', 'error'); 
    }
  };

  const handleDeleteChild = async (id) => {
    if (!(await confirm('Delete this child?', 'Confirm Delete', true))) return;
    try {
      await ChildrenApi.delete(id);
      addToast('Child profile removed', 'success');
      loadData();
    } catch (err) { 
      addToast('Error deleting child', 'error'); 
    }
  };
 

  if (loading) return <div className="spinner" style={{ margin: '40px auto' }}></div>;

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 30 }}>
        <div>
          <h2 className="page-title">👪 {t('familiesManagement')}</h2>
          <p className="page-subtitle">{t('manageFamiliesDesc') || 'Manage family contacts and children profiles.'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditFamily(null); setShowFamilyModal(true); }}>
          ➕ {t('addFamily')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {families.map(fam => (
          <div key={fam._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            
            {/* Family Header */}
            <div style={{ background: 'var(--surface-2)', padding: '20px 25px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.4rem', fontWeight: 800 }}>
                   {t('familyName')}: {fam.familyName}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginTop: 8 }}>
                  {fam.motherName && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>👩 <strong>{t('mother')}:</strong> {fam.motherName} ({fam.motherPhone})</span>}
                  {fam.fatherName && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>👨 <strong>{t('father')}:</strong> {fam.fatherName} ({fam.fatherPhone})</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 700 }} onClick={() => { setActiveFamilyId(fam._id); setEditChild(null); setShowChildModal(true); }}>➕ {t('addChild')}</button>
                <button className="btn btn-sm btn-secondary" onClick={() => { setEditFamily(fam); setShowFamilyModal(true); }}>✏️</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteFamily(fam._id)}>🗑️</button>
              </div>
            </div>

            {/* Emergency Info Area */}
            <div style={{ padding: '15px 25px', background: '#fff1f0', color: '#cf1322', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>🚨 {t('emergency')}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[1, 2, 3, 4].map(i => fam[`emergencyName${i}`] && (
                  <div key={`em-${i}`}>
                    • {fam[`emergencyName${i}`]} ({fam[`emergencyRelation${i}`] || 'Relation'}): {fam[`emergencyPhone${i}`]}
                  </div>
                ))}
                {!fam.emergencyName1 && <div>No emergency contacts listed.</div>}
              </div>
            </div>

            {/* Authorized Pickups Area */}
            <div style={{ padding: '15px 25px', background: '#e3f2fd', color: '#1565c0', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>🚙 Authorized Pick-ups</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[1, 2, 3, 4].map(i => fam[`pickupName${i}`] && (
                  <div key={`pu-${i}`}>
                    • {fam[`pickupName${i}`]} ({fam[`pickupRelation${i}`]}): {fam[`pickupPhone${i}`]}
                  </div>
                ))}
                {!fam.pickupName1 && <div>No authorized pickups listed.</div>}
              </div>
            </div>

            {/* Children List */}
            <div style={{ padding: 25 }}>
              <h4 className="section-label" style={{ marginBottom: 15 }}>{t('children')}</h4>
              {(!childrenDict[fam._id] || childrenDict[fam._id].length === 0) ? (
                <p style={{ fontSize: '0.95rem', color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>{t('noChildrenAdded') || 'No children added yet.'}</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 15 }}>
                  {childrenDict[fam._id].map(child => (
                    <div key={child._id} style={{ border: '1px solid var(--border)', padding: '18px', borderRadius: 12, background: 'var(--surface)', transition: 'transform 0.2s', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <strong style={{ fontSize: '1.15rem', color: 'var(--text)' }}>👶 {child.name}</strong>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button style={{ border:'none', background:'none', cursor:'pointer', fontSize: '1.1rem' }} onClick={() => { setActiveFamilyId(fam._id); setEditChild(child); setShowChildModal(true); }}>✏️</button>
                          <button style={{ border:'none', background:'none', cursor:'pointer', color:'var(--danger)', fontSize: '1.1rem' }} onClick={() => handleDeleteChild(child._id)}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {child.dob && <div><strong>{t('dob')}:</strong> {child.dob} ({calculateAge(child.dob)})</div>}
                        {child.allergies && <div style={{ color: 'var(--danger)', marginTop: 5, fontWeight: 700 }}>⚠️ {t('allergies')}: {child.allergies}</div>}
                        {child.medicalInfo && <div style={{ marginTop: 5 }}>📝 <strong>{t('medicalInfo')}:</strong> {child.medicalInfo}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ))}
        {families.length === 0 && <div className="empty-state">{t('noFamiliesFound')}</div>}
      </div>

      {/* FAMILY MODAL */}
      {showFamilyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editFamily ? t('editFamily') : t('addFamily')}</h3>
              <button className="modal-close" onClick={() => setShowFamilyModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveFamily} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 15 }}>
              <div className="form-group">
                <label className="form-label">{t('familyName')}</label>
                <input name="familyName" defaultValue={editFamily?.familyName} placeholder={t('familyName')} required className="input" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">{t('mother')}</label>
                  <input name="motherName" defaultValue={editFamily?.motherName} placeholder={t('fullName')} className="input" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('motherPhone')}</label>
                  <input name="motherPhone" defaultValue={editFamily?.motherPhone} placeholder="050-..." className="input" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">{t('father')}</label>
                  <input name="fatherName" defaultValue={editFamily?.fatherName} placeholder={t('fullName')} className="input" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('fatherPhone')}</label>
                  <input name="fatherPhone" defaultValue={editFamily?.fatherPhone} placeholder="050-..." className="input" />
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 15 }}>
                <h4 className="section-label" style={{ marginBottom: 12 }}>🚨 {t('emergency')} (Up to 4)</h4>
                {[1, 2, 3, 4].map(i => (
                  <div key={`em-edit-${i}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: 10, marginBottom: 10 }}>
                    <input name={`emergencyName${i}`} defaultValue={editFamily?.[`emergencyName${i}`] || (i === 1 ? editFamily?.emergencyContactName : '')} placeholder={`Contact ${i} Name`} className="input" />
                    <input name={`emergencyRelation${i}`} defaultValue={editFamily?.[`emergencyRelation${i}`]} placeholder={`Relation`} className="input" />
                    <input name={`emergencyPhone${i}`} defaultValue={editFamily?.[`emergencyPhone${i}`] || (i === 1 ? editFamily?.emergencyContactPhone : '')} placeholder={`Phone`} className="input" />
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 15 }}>
                <h4 className="section-label" style={{ marginBottom: 12 }}>🚙 Authorized Pick-ups (Up to 4)</h4>
                {[1, 2, 3, 4].map(i => (
                  <div key={`pu-edit-${i}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: 10, marginBottom: 10 }}>
                    <input name={`pickupName${i}`} defaultValue={editFamily?.[`pickupName${i}`]} placeholder={`Pickup ${i} Name`} className="input" />
                    <input name={`pickupRelation${i}`} defaultValue={editFamily?.[`pickupRelation${i}`]} placeholder={`Relation`} className="input" />
                    <input name={`pickupPhone${i}`} defaultValue={editFamily?.[`pickupPhone${i}`]} placeholder={`Phone / ID`} className="input" />
                  </div>
                ))}
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowFamilyModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{t('saveFamily')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHILD MODAL */}
      {showChildModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editChild ? t('edit') : t('addChild')}</h3>
              <button className="modal-close" onClick={() => setShowChildModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveChild} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 15 }}>
              <div className="form-group">
                <label className="form-label">{t('childName')}</label>
                <input name="name" defaultValue={editChild?.name} placeholder={t('fullName')} required className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('dob')}</label>
                <input name="dob" defaultValue={editChild?.dob} type="date" className="input" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('allergies')}</label>
                <textarea name="allergies" defaultValue={editChild?.allergies} placeholder={t('allergies')} className="input" rows="2" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('medicalInfo')}</label>
                <textarea name="medicalInfo" defaultValue={editChild?.medicalInfo} placeholder={t('medicalInfo')} className="input" rows="2" />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowChildModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{t('saveChild')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
