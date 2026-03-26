import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FamiliesApi, ChildrenApi } from '../../services/api';

export default function ParentProfile() {
  const { user } = useAuth();
  const [family, setFamily] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, cRes] = await Promise.all([FamiliesApi.getAll(), ChildrenApi.getAll()]);
      const myFam = (fRes.data || []).find(f => f.userId === user?.id);
      setFamily(myFam || {});

      const myKids = (cRes.data || []).filter(c => myFam && c.familyId === myFam._id);
      setChildren(myKids);
    } catch (err) {
      console.error('Error loading profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { Object.keys(user || {}).length > 0 && loadData(); }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      if (family?._id) await FamiliesApi.update(family._id, data);
      else await FamiliesApi.create({ ...data, userId: user?.id });
      setEditing(false);
      loadData();
    } catch (err) { alert('Error updating profile'); }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Family Profile</h2>
        {!editing && <button className="btn" onClick={() => setEditing(true)}>✏️ Edit Contacts</button>}
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Family Contact Box */}
          <div style={{ background: 'white', padding: 25, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#6a1b9a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>👨‍👩‍👧</span> Contact Information
            </h3>
            
            {editing ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <input name="familyName" defaultValue={family?.familyName} placeholder="Family Surname" required className="input" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  <input name="motherName" defaultValue={family?.motherName} placeholder="Mother's Name" className="input" />
                  <input name="motherPhone" defaultValue={family?.motherPhone} placeholder="Mother's Phone" className="input" />
                  <input name="fatherName" defaultValue={family?.fatherName} placeholder="Father's Name" className="input" />
                  <input name="fatherPhone" defaultValue={family?.fatherPhone} placeholder="Father's Phone" className="input" />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="submit" className="btn btn-primary" style={{ background: '#8e24aa' }}>Save Changes</button>
                  <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#888', fontSize: '0.9rem' }}>Family Surname</h4>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>{family?.familyName || 'Not set'}</p>
                </div>
                <div />
                
                <div style={{ background: '#f9f9f9', padding: 15, borderRadius: 8 }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Mother</h4>
                  <p style={{ margin: '0 0 5px 0' }}>{family?.motherName || 'M. Name'}</p>
                  <p style={{ margin: 0, color: '#1565c0' }}>📞 {family?.motherPhone || '+1 (000) 000-0000'}</p>
                </div>
                
                <div style={{ background: '#f9f9f9', padding: 15, borderRadius: 8 }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Father</h4>
                  <p style={{ margin: '0 0 5px 0' }}>{family?.fatherName || 'F. Name'}</p>
                  <p style={{ margin: 0, color: '#1565c0' }}>📞 {family?.fatherPhone || '+1 (000) 000-0000'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Enrolled Children Box */}
          <div style={{ background: 'white', padding: 25, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#e91e63', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>👧👦</span> Enrolled Children
            </h3>
            
            {children.length === 0 ? <p className="empty-state" style={{ margin: 0 }}>No children currently enrolled or linked to your account.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {children.map(child => (
                   <div key={child._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, paddingBottom: 15, borderBottom: '1px solid #eee', lastChild: { borderBottom: 'none', paddingBottom: 0 } }}>
                      <div style={{ width: 80, height: 80, borderRadius: 40, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>👶</div>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{child.name}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.9rem', color: '#555' }}>
                          <div><strong>DOB:</strong> {child.dob || 'Unknown'}</div>
                          {child.allergies && <div style={{ color: '#d32f2f' }}><strong>Allergies:</strong> {child.allergies}</div>}
                          {child.medicalInfo && <div><strong>Medical:</strong> {child.medicalInfo}</div>}
                        </div>
                      </div>
                   </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
