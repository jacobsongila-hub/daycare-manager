import React, { useState, useEffect } from 'react';
import { FamiliesApi, ChildrenApi } from '../../services/api';
import { calculateAge } from '../../utils/formatters';

export default function FamilyManagement() {
  const [families, setFamilies] = useState([]);
  const [childrenDict, setChildrenDict] = useState({}); // familyId -> array of children
  const [loading, setLoading] = useState(true);

  // Modals
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
      if (editFamily) await FamiliesApi.update(editFamily._id, data);
      else await FamiliesApi.create(data);
      setShowFamilyModal(false);
      loadData();
    } catch (err) { alert('Error saving family'); }
  };

  const handleDeleteFamily = async (id) => {
    if (!window.confirm('Are you sure you want to delete this family?')) return;
    try {
      await FamiliesApi.delete(id);
      loadData();
    } catch (err) { alert('Error deleting family'); }
  };

  const handleSaveChild = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.familyId = activeFamilyId;
    
    // Convert comma string to array for allergies
    if (typeof data.allergies === 'string') {
      data.allergies = data.allergies; // Keeping as string per simplified schema for now
    }

    try {
      if (editChild) await ChildrenApi.update(editChild._id, data);
      else await ChildrenApi.create(data);
      setShowChildModal(false);
      loadData();
    } catch (err) { alert('Error saving child'); }
  };

  const handleDeleteChild = async (id) => {
    if (!window.confirm('Delete this child?')) return;
    try {
      await ChildrenApi.delete(id);
      loadData();
    } catch (err) { alert('Error deleting child'); }
  };

  if (loading) return <div>Loading families...</div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>Families Management</h2>
        <button className="btn btn-primary" onClick={() => { setEditFamily(null); setShowFamilyModal(true); }}>
          ➕ Add Family
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {families.map(fam => (
          <div key={fam._id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            
            {/* Family Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 15, marginBottom: 15 }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#1565c0' }}>{fam.familyName} Family</h3>
                <div style={{ fontSize: '0.9rem', color: '#666', display: 'flex', gap: 15 }}>
                  {fam.motherName && <span>👩 {fam.motherName} ({fam.motherPhone})</span>}
                  {fam.fatherName && <span>👨 {fam.fatherName} ({fam.fatherPhone})</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn" onClick={() => { setActiveFamilyId(fam._id); setEditChild(null); setShowChildModal(true); }}>➕ Add Child</button>
                <button className="btn" onClick={() => { setEditFamily(fam); setShowFamilyModal(true); }}>✏️ Edit</button>
                <button className="btn" style={{ color: 'red' }} onClick={() => handleDeleteFamily(fam._id)}>🗑️</button>
              </div>
            </div>

            {/* Children List */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', color: '#888' }}>Children</h4>
              {(!childrenDict[fam._id] || childrenDict[fam._id].length === 0) ? (
                <p style={{ fontSize: '0.9rem', color: '#999', fontStyle: 'italic' }}>No children added yet.</p>
              ) : (
                <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                  {childrenDict[fam._id].map(child => (
                    <div key={child._id} style={{ border: '1px solid #eee', padding: 15, borderRadius: 8, minWidth: 200, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '1.1rem' }}>👶 {child.name}</strong>
                        <div>
                          <button style={{ border:'none', background:'none', cursor:'pointer' }} onClick={() => { setActiveFamilyId(fam._id); setEditChild(child); setShowChildModal(true); }}>✏️</button>
                          <button style={{ border:'none', background:'none', cursor:'pointer', color:'red' }} onClick={() => handleDeleteChild(child._id)}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#555', marginTop: 8 }}>
                        {child.dob && <div><strong>DOB:</strong> {child.dob} ({calculateAge(child.dob)})</div>}
                        {child.allergies && <div style={{ color: '#d32f2f', marginTop: 5 }}><strong>Allergies:</strong> {child.allergies}</div>}
                        {child.medicalInfo && <div style={{ marginTop: 5 }}><strong>Medical:</strong> {child.medicalInfo}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ))}
        {families.length === 0 && <div className="empty-state">No families found. Add one to start.</div>}
      </div>

      {/* FAMILY MODAL */}
      {showFamilyModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <h3>{editFamily ? 'Edit Family' : 'Add New Family'}</h3>
            <form onSubmit={handleSaveFamily} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input name="familyName" defaultValue={editFamily?.familyName} placeholder="Family Surname (e.g. Smith)" required className="input" />
              <div style={{ display: 'flex', gap: 10 }}>
                <input name="motherName" defaultValue={editFamily?.motherName} placeholder="Mother's Name" className="input" style={{ flex: 1 }} />
                <input name="motherPhone" defaultValue={editFamily?.motherPhone} placeholder="Mother's Phone" className="input" style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input name="fatherName" defaultValue={editFamily?.fatherName} placeholder="Father's Name" className="input" style={{ flex: 1 }} />
                <input name="fatherPhone" defaultValue={editFamily?.fatherPhone} placeholder="Father's Phone" className="input" style={{ flex: 1 }} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowFamilyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Family</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHILD MODAL */}
      {showChildModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <h3>{editChild ? 'Edit Child' : 'Add Child to Family'}</h3>
            <form onSubmit={handleSaveChild} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input name="name" defaultValue={editChild?.name} placeholder="Child's First Name" required className="input" />
              <input name="dob" defaultValue={editChild?.dob} type="date" className="input" />
              <textarea name="allergies" defaultValue={editChild?.allergies} placeholder="Allergies (comma separated)" className="input" rows="2" />
              <textarea name="medicalInfo" defaultValue={editChild?.medicalInfo} placeholder="Important Medical Info" className="input" rows="2" />
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowChildModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Child</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
