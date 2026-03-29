import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { ChildrenApi, StaffApi, AttendanceApi, ShiftRequestsApi, AnnouncementsApi, TimeEntriesApi } from '../services/api';

const actionCards = [
  { to: '/admin/attendance', icon: '📝', label: 'attendance', color: '#4CAF50' },
  { to: '/admin/photos', icon: '📸', label: 'photos', color: '#E91E63' },
  { to: '/admin/notes', icon: '📋', label: 'notes', color: '#FF9800' },
  { to: '/admin/families', icon: '👨‍👩‍👧', label: 'families', color: '#9C27B0' },
  { to: '/admin/docs', icon: '📁', label: 'mydocs', color: '#607D8B' },
  { to: '/admin/reports', icon: '📊', label: 'reports', color: '#F44336' },
  { to: '/admin/reminders', icon: '🔔', label: 'reminders', color: '#009688' },
  { to: '/admin/shift-requests', icon: '🗓️', label: 'shiftrequests', color: '#2196F3' },
  { to: '/admin/staff-schedule', icon: '💼', label: 'staffschedule', color: '#3F51B5' },
  { to: '/admin/emergency-contacts', icon: '🚨', label: 'emergencyContacts', color: '#D32F2F' },
];

function getDayGreeting(t) {
  const hour = new Date().getHours();
  if (hour < 12) return t('goodMorning') || 'Good Morning';
  if (hour < 17) return t('goodAfternoon') || 'Good Afternoon';
  return t('goodEvening') || 'Good Evening';
}

export default function Dashboard() {
  const { addToast } = useNotification();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, staffIn: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [anniversaries, setAnniversaries] = useState([]);
  const [pendingShifts, setPendingShifts] = useState(0);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [childrenRes, attRes, staffRes, shiftRes, annRes, timeRes] = await Promise.all([
          ChildrenApi.getAll().catch(() => ({ data: [] })),
          AttendanceApi.getAll().catch(() => ({ data: [] })),
          StaffApi.getAll().catch(() => ({ data: [] })),
          ShiftRequestsApi.getAll().catch(() => ({ data: [] })),
          AnnouncementsApi.getAll().catch(() => ({ data: [] })),
          TimeEntriesApi.getAll().catch(() => ({ data: [] }))
        ]);

        const children = Array.isArray(childrenRes.data) ? childrenRes.data : [];
        const attendance = Array.isArray(attRes.data) ? attRes.data : [];
        const entries = Array.isArray(timeRes.data) ? timeRes.data : [];
        const shifts = Array.isArray(shiftRes.data) ? shiftRes.data : [];
        const anns = Array.isArray(annRes.data) ? annRes.data : [];
        const rems = JSON.parse(localStorage.getItem('reminders') || '[]');

        // Calculate today's stats
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysAtt = attendance.filter(a => a.date === todayStr);

        const present = todaysAtt.filter(a => a.status === 'Present').length;
        const absent = todaysAtt.filter(a => a.status === 'Absent').length;
        
        // Staff In: anyone who clocked in today and hasn't clocked out
        const todayEntries = entries.filter(e => e.clockIn?.startsWith(todayStr));
        const staffIn = todayEntries.filter(e => !e.clockOut).length;
        
        setStats({ present, absent, total: children.length, staffIn });
        setAnnouncements(anns.slice(0, 3));
        setPendingShifts(shifts.filter(s => s.status === 'Pending').length);
        setReminders(rems.filter(r => !r.completed));

        // Find birthdays in the next 14 days
        const todayObj = new Date();
        const upcomingBirthdays = children.filter(child => {
          if (!child.dob) return false;
          const dob = new Date(child.dob);
          const birthMonth = dob.getMonth();
          const birthDay = dob.getDate();
          
          const thisYearBirthday = new Date(todayObj.getFullYear(), birthMonth, birthDay);
          const diffTime = thisYearBirthday - todayObj;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return diffDays >= 0 && diffDays <= 14;
        });
        setBirthdays(upcomingBirthdays);

        // Find work anniversaries in next 14 days
        const staff = staffRes.data || [];
        const upcomingAnniversaries = staff.filter(s => {
          if (!s.joinDate) return false;
          const join = new Date(s.joinDate);
          const joinMonth = join.getMonth();
          const joinDay = join.getDate();
          const thisYearJoin = new Date(todayObj.getFullYear(), joinMonth, joinDay);
          const diffDays = Math.ceil((thisYearJoin - todayObj) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 14;
        });
        setAnniversaries(upcomingAnniversaries);

      } catch (err) {
        console.error('Error loading dashboard data', err);
      }
    }
    loadData();
  }, []);

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    if (!title.trim()) return;
    const newRem = { _id: Date.now().toString(), title, completed: false, createdAt: new Date().toISOString() };
    try {
      const current = JSON.parse(localStorage.getItem('reminders') || '[]');
      const updated = [newRem, ...current];
      localStorage.setItem('reminders', JSON.stringify(updated));
      e.target.reset();
      setReminders(updated.filter(r => !r.completed));
      addToast('Quick note saved locally', 'success');
    } catch (err) { addToast('Failed to add note', 'error'); }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const attendanceProgress = stats.total > 0 ? Math.round(((stats.present + stats.absent) / stats.total) * 100) : 0;
  const ratio = stats.staffIn > 0 ? Math.round(stats.present / stats.staffIn) : stats.present;

  const getTranslatedProgressMessage = () => {
    const unmarked = stats.total - (stats.present + stats.absent);
    if (lang === 'he') return `⚠️ התראה: ${unmarked} ${t('childrenNeedAttendance')}`;
    return `⚠️ ${t('unmarkedAlert')}: ${unmarked} ${t('childrenNeedAttendance')}`;
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* GLOBAL ANNOUNCEMENT BANNER (STICKY TOP) */}
      {(announcements.length > 0 || birthdays.length > 0 || anniversaries.length > 0) ? (
        <div style={{ 
          background: 'linear-gradient(90deg, #6200ea, #d500f9)', 
          color: 'white', 
          padding: '12px 20px', 
          textAlign: 'center', 
          fontSize: '0.95rem',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(98, 0, 234, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 15,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          {birthdays.length > 0 && (
            <span>🎂 {t('birthdayAlert') || 'Birthday Today'}: {birthdays[0].name}!</span>
          )}
          {anniversaries.length > 0 && (
            <span>🎉 {t('anniversaryAlert') || 'Work Anniversary'}: {anniversaries[0].name}!</span>
          )}
          {announcements.length > 0 && !birthdays.length && !anniversaries.length && (
            <span>📢 {announcements[0].title}</span>
          )}
          <button 
            onClick={() => navigate('/admin/announcements')}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer', fontWeight: 800 }}
          >
            {t('view') || 'View'}
          </button>
        </div>
      ) : (
        <div style={{ 
          background: 'linear-gradient(90deg, #1565c0, #1e88e5)', 
          color: 'white', 
          padding: '10px 20px', 
          textAlign: 'center', 
          fontSize: '0.9rem',
          fontWeight: 600,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          ✨ {t('welcomeMessage') || 'Welcome to Little Ones Management Portal!'}
        </div>
      )}

      {/* HEADER */}
      <div style={{ padding: '20px', background: 'white', color:'#333', borderBottom: '1px solid #eee', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1rem', color: '#666', fontWeight: 500 }}>{getDayGreeting(t)},</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1a1a' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: 4 }}>{today}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: '#f5f7f9', border: 'none', color: '#666', padding: '12px', borderRadius: '15px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onClick={() => navigator.share?.({ title: 'Little Ones Care', url: window.location.origin })}>
              🔗
            </button>
            <button style={{ background: '#f5f7f9', border: 'none', color: '#666', padding: '12px', borderRadius: '15px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onClick={() => navigate('/admin/settings')}>
              👤
            </button>
          </div>
        </div>
      </div>


      {/* ALERTS */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pendingShifts > 0 && (
          <div style={{ background: '#fff3e0', borderLeft: '4px solid #ff9800', padding: 15, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📋 <strong>{pendingShifts} {t('pendingShiftsCount')}</strong></span>
            <button onClick={() => navigate('/admin/shift-requests')} style={{ background: '#ff9800', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>{t('review')}</button>
          </div>
        )}
        {attendanceProgress < 100 && (
          <div style={{ background: '#ffebee', borderLeft: '4px solid #f44336', padding: 15, borderRadius: 8 }}>
            {getTranslatedProgressMessage()}
          </div>
        )}
      </div>

      {/* QUICK STATS - PREMIUM CARDS */}
      <div style={{ padding: '0 20px 25px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 15 }}>
        <div style={{ background: 'linear-gradient(135deg, #43a047, #66bb6a)', padding: 22, borderRadius: 24, color: 'white', boxShadow: '0 10px 20px rgba(67, 160, 71, 0.2)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{stats.present}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>👶 {t('childrenPresent')}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #e53935, #ef5350)', padding: 22, borderRadius: 24, color: 'white', boxShadow: '0 10px 20px rgba(229, 57, 53, 0.2)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{stats.absent}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>❌ {t('childrenAbsent')}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #1e88e5, #42a5f5)', padding: 22, borderRadius: 24, color: 'white', boxShadow: '0 10px 20px rgba(30, 136, 229, 0.2)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{stats.staffIn}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>👩‍🏫 {t('staffIn')}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #8e24aa, #ab47bc)', padding: 22, borderRadius: 24, color: 'white', boxShadow: '0 10px 20px rgba(142, 36, 170, 0.2)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{ratio}:1</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 }}>📊 {t('staffChildRatio')}</div>
        </div>
      </div>

      <div style={{ padding: '0 20px 25px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* PROGRESS & TRACKING */}
        <div className="card" style={{ padding: 25, borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1a1a1a', fontWeight: 800 }}>📈 {t('attendanceProgress')}</h3>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e88e5' }}>{attendanceProgress}%</span>
          </div>
          <div style={{ width: '100%', background: '#f0f0f0', height: 14, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ width: `${attendanceProgress}%`, background: 'linear-gradient(90deg, #1e88e5, #42a5f5)', height: '100%', borderRadius: 10, transition: 'width 1s cubic-bezier(0.1, 0.9, 0.2, 1)' }} />
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: 1.5 }}>
            {attendanceProgress === 100 ? '✅ All children accounted for today.' : '⚠️ Some children have not been marked yet.'}
          </p>
          <button 
            onClick={() => navigate('/admin/attendance')}
            style={{ width: '100%', marginTop: 25, background: '#f5f7f9', border: 'none', padding: '15px', borderRadius: 16, color: '#1e88e5', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {t('openAttendance') || 'View Attendance List'}
          </button>
        </div>

        {/* STICKY REMINDERS PREVIEW */}
        <div className="card" style={{ padding: 25, borderRadius: 24, background: '#FFFDF0', boxShadow: '0 10px 30px rgba(251, 192, 45, 0.1)', border: '1px solid #FFF9C4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#444', fontWeight: 800 }}>📌 {t('reminders')}</h3>
            <button 
              onClick={() => navigate('/admin/reminders')}
              style={{ background: '#FBC02D', color: '#444', border: 'none', padding: '6px 15px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer' }}
            >
              {t('viewBoard') || 'Board'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reminders.filter(r => !r.completed).slice(0, 3).map((r, i) => (
              <div key={r._id} style={{ background: 'white', padding: '12px 15px', borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${i % 2 === 0 ? '#FBC02D' : '#4FC3F7'}` }}>
                <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, color: '#333' }}>{r.title}</div>
              </div>
            ))}
            {reminders.filter(r => !r.completed).length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontStyle: 'italic' }}>✨ {t('allCaughtUp') || 'All caught up!'}</div>
            )}
          </div>
          <form onSubmit={handleCreateReminder} style={{ marginTop: 20, display: 'flex', gap: 10 }}>
             <input name="title" placeholder={t('quickNote') || 'Quick note...'} required className="input" style={{ flex: 1, background: 'rgba(255,255,255,0.8)', border: '1px solid #eee' }} />
             <button type="submit" style={{ background: '#444', color: 'white', border: 'none', width: 44, height: 44, borderRadius: 12, cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
          </form>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div style={{ padding: '0 20px 40px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#1a1a1a', fontWeight: 800 }}>⚡ {t('quickActions')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 20 }}>
          {actionCards.map((card, idx) => (
            <div key={idx} onClick={() => navigate(card.to)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 70, height: 70, borderRadius: 22, background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', boxShadow: '0 8px 15px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }} className="action-icon">
                {card.icon}
              </div>
              <span style={{ fontSize: '0.85rem', textAlign: 'center', color: '#444', fontWeight: 700, maxWidth: 80, lineHeight: 1.2 }}>{t(card.label) || card.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .action-icon:hover { transform: translateY(-5px); }
      `}</style>
    </div>
  );
}
