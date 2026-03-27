import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChildrenApi, AttendanceApi, DailyNotesApi, AnnouncementsApi } from '../../services/api';

export default function ParentHome() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [notes, setNotes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, aRes, nRes, annRes] = await Promise.all([
          ChildrenApi.getAll(),
          AttendanceApi.getAll(),
          DailyNotesApi.getAll(),
          AnnouncementsApi.getAll()
        ]);
        
        // Find my children (where familyId matches or parent is assigned)
        const allKids = cRes.data || [];
        const myKids = allKids.filter(k => k.familyId === user?.id || !k.familyId); // For testing, assume no familyId means visible
        setChildren(myKids);

        const myKidIds = myKids.map(k => k._id);

        // My Kids' Attendance Today
        const daysAtt = (aRes.data || []).filter(a => a.date === todayStr && myKidIds.includes(a.childId));
        const dict = {};
        daysAtt.forEach(a => { dict[a.childId] = a; });
        setAttendance(dict);

        // My Kids' Notes
        const myNotes = (nRes.data || []).filter(n => myKidIds.includes(n.childId)).slice(0, 5);
        setNotes(myNotes);

        // General Announcements
        setAnnouncements((annRes.data || []).slice(0, 3));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if(user) loadData();
  }, [user]);

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6a1b9a, #8e24aa)', padding: 25, borderRadius: 16, color: 'white', marginBottom: 25, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 5px 0' }}>Hi, {user?.name?.split(' ')[0] || 'Parent'}! 👋</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Here is your daily update</p>
      </div>

      {/* Announcements Alert */}
      {announcements.length > 0 && (
        <div style={{ background: '#f3e5f5', borderLeft: '4px solid #9c27b0', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          📢 <strong>Latest Announcement:</strong> {announcements[0].title}
        </div>
      )}

      <h3 style={{ margin: '0 0 15px 0', color: '#444' }}>My Children Today</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 15, marginBottom: 25 }}>
          {children.length === 0 ? <p className="empty-state">No children associated with your account yet.</p> : children.map(child => {
            const att = attendance[child._id] || { status: 'Not yet marked' };
            const isPresent = att.status === 'Present';
            
            return (
              <div key={child._id} style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: 15, alignItems: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: 30, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  {child.avatar ? <img src={child.avatar} alt="avatar" style={{width: 60, height: 60, borderRadius: 30, objectFit: 'cover'}} /> : '👶'}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{child.name}</h4>
                  <div>
                    {isPresent ? (
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ Present ({att.checkIn})</span>
                    ) : (
                      <span style={{ color: '#888' }}>{att.status}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Notes */}
      <h3 style={{ margin: '0 0 15px 0', color: '#444' }}>Recent Daily Notes</h3>
      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {notes.length === 0 ? <p className="empty-state">No notes for your children recently.</p> : notes.map(note => {
            const childName = children.find(c => c._id === note.childId)?.name || 'Child';
            return (
              <div key={note._id} style={{ background: 'white', padding: 15, borderRadius: 12, borderLeft: '4px solid #8e24aa', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <strong style={{ fontSize: '1.05rem', color: '#6a1b9a' }}>{childName}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ background: '#fdfbfb', padding: '12px 15px', borderRadius: 8, marginTop: 10, border: '1px solid #f3e5f5' }}>
                  <p style={{ margin: 0, color: '#444', lineHeight: 1.6, fontSize: '1.05rem', wordBreak: 'break-word' }}>{note.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
