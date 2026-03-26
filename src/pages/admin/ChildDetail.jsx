import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChildrenApi, AttendanceApi, DailyNotesApi, FamiliesApi } from '../../services/api';
import { calculateAge } from '../../utils/formatters';

export default function ChildDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [family, setFamily] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, aRes, nRes] = await Promise.all([
          ChildrenApi.getOne(id),
          AttendanceApi.getAll(), // In a real app, query by childId
          DailyNotesApi.getAll()
        ]);
        
        const childData = cRes.data;
        setChild(childData);
        
        if (childData.familyId) {
          try {
            const fRes = await FamiliesApi.getOne(childData.familyId);
            setFamily(fRes.data);
          } catch(e) { console.error('Family not found'); }
        }

        const myAtt = (aRes.data || []).filter(a => a.childId === id).sort((a,b) => b.date.localeCompare(a.date));
        setAttendance(myAtt);

        const myNotes = (nRes.data || []).filter(n => n.childId === id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotes(myNotes);

      } catch (err) {
        console.error('Error loading child details', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    try {
      await ChildrenApi.update(id, data);
      setChild({ ...child, ...data });
      setIsEditing(false);
    } catch (err) { alert('Error updating child'); }
  };

  if (loading) return <div className="page-container"><div className="spinner"></div></div>;
  if (!child) return <div className="page-container"><p>Child not found.</p></div>;

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
        <button className="btn" onClick={() => navigate(-1)}>◀ Back</button>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
          {child.avatar ? <img src={child.avatar} alt="avatar" style={{width: 80, height: 80, borderRadius: 40, objectFit: 'cover'}} /> : '👶'}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{child.name}</h2>
          {family && <div style={{ color: '#666', marginTop: 5 }}>Family: {family.familyName}</div>}
        </div>
        <div style={{ flex: 1 }} />
        {!isEditing && <button className="btn btn-primary" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: 20 }}>
        
        {/* Profile Info */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1565c0' }}>Profile Information</h3>
          {isEditing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input name="name" defaultValue={child.name} className="input" required placeholder="Name" />
              <input name="dob" defaultValue={child.dob} type="date" className="input" />
              <textarea name="allergies" defaultValue={child.allergies} placeholder="Allergies" className="input" />
              <textarea name="medicalInfo" defaultValue={child.medicalInfo} placeholder="Medical Info" className="input" />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><strong>DOB:</strong> {child.dob || 'Not provided'} {child.dob && <span style={{color: '#666', fontSize: '0.9rem'}}>({calculateAge(child.dob)})</span>}</div>
              <div><strong style={{ color: '#d32f2f' }}>Allergies:</strong> {child.allergies || 'None listed'}</div>
              <div><strong>Medical Info:</strong> {child.medicalInfo || 'None listed'}</div>
            </div>
          )}
        </div>

        {/* Family & Emergency */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#8e24aa' }}>Family & Contacts</h3>
          {family ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><strong>Mother:</strong> {family.motherName} ({family.motherPhone})</div>
              <div><strong>Father:</strong> {family.fatherName} ({family.fatherPhone})</div>
            </div>
          ) : (
             <p style={{ color: '#888', fontStyle: 'italic' }}>No family record linked.</p>
          )}

          <h4 style={{ margin: '15px 0 10px 0', color: '#555' }}>Emergency Contacts</h4>
          {(!child.emergencyContacts || child.emergencyContacts.length === 0) ? (
            <p style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>None listed.</p>
          ) : (
            child.emergencyContacts.map((ec, i) => (
              <div key={i} style={{ padding: 10, background: '#f5f5f5', borderRadius: 8, marginBottom: 5 }}>
                <strong>{ec.name}</strong> ({ec.relation}) - {ec.phone}
              </div>
            ))
          )}
        </div>

        {/* Recent Attendance */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#43a047' }}>Recent Attendance</h3>
          {attendance.length === 0 ? <p className="empty-state">No attendance records.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {attendance.slice(0, 5).map(att => (
                <div key={att._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #eee' }}>
                  <strong>{att.date}</strong>
                  <span style={{ color: att.status === 'Present' ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                    {att.status} {att.checkIn && `(${att.checkIn})`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notes */}
        <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ff9800' }}>Recent Notes</h3>
          {notes.length === 0 ? <p className="empty-state">No daily notes.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notes.slice(0, 5).map(note => (
                <div key={note._id} style={{ padding: 10, background: '#fff8e1', borderRadius: 8, borderLeft: '4px solid #ffb300' }}>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 5 }}>
                    {new Date(note.timestamp).toLocaleDateString()}
                  </div>
                  <div>{note.note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
