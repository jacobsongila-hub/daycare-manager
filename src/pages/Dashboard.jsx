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
      addToast(t('quickNoteSaved') || 'Quick note saved locally', 'success');
    } catch (err) { addToast(t('failedAddNote') || 'Failed to add note', 'error'); }
  };

  const today = new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
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
    <div className="dashboard-container" style={{ paddingBottom: 100, animation: 'fadeIn 0.6s ease' }}>
      {/* GLOBAL ANNOUNCEMENT BANNER */}
      {(announcements.length > 0 || birthdays.length > 0 || anniversaries.length > 0) ? (
        <div style={{ 
          background: 'var(--gradient-primary)', 
          color: 'white', 
          padding: '14px 24px', 
          textAlign: 'center', 
          fontSize: '0.95rem',
          fontWeight: 700,
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 15,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(10px)'
        }}>
          {birthdays.length > 0 && (
            <span>🎂 {t('birthdayAlert')}: {birthdays[0].name}!</span>
          )}
          {anniversaries.length > 0 && (
            <span>🎉 {t('anniversaryAlert')}: {anniversaries[0].name}!</span>
          )}
          {announcements.length > 0 && !birthdays.length && !anniversaries.length && (
            <span>📢 {announcements[0].title}</span>
          )}
          <button 
            onClick={() => navigate('/admin/announcements')}
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '4px 14px' }}
          >
            {t('view')}
          </button>
        </div>
      ) : (
        <div style={{ 
          background: 'var(--gradient-primary)', 
          color: 'white', 
          padding: '12px 24px', 
          textAlign: 'center', 
          fontSize: '0.9rem',
          fontWeight: 600,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          ✨ {t('welcomeMessage')}
        </div>
      )}

      {/* HEADER */}
      <div style={{ padding: '30px 24px', background: 'white', borderBottom: '1px solid var(--border)', marginBottom: 24, boxShadow: 'var(--shadow)', borderRadius: '0 0 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{getDayGreeting(t)}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>{user?.name || t('admin')}</div>
            <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 700, marginTop: 4 }}>{today}</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" title="Share" onClick={() => navigator.share?.({ title: 'Little Ones Care', url: window.location.origin })} style={{ width: 44, height: 44, padding: 0 }}>🔗</button>
            <button className="btn btn-secondary" title="Settings" onClick={() => navigate('/admin/settings')} style={{ width: 44, height: 44, padding: 0 }}>⚙️</button>
            <button className="btn btn-danger" title={t('logout')} onClick={() => { logout(); navigate('/login'); }} style={{ width: 44, height: 44, padding: 0, background: '#ffebee', color: 'var(--danger)' }}>🚪</button>
          </div>
        </div>
      </div>


      {/* ALERTS */}
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {pendingShifts > 0 && (
          <div className="alert alert-warning" style={{ borderRadius: 16, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(255, 160, 0, 0.1)' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>📋 {pendingShifts} {t('pendingShiftsCount')}</span>
            <button className="btn btn-sm btn-primary" style={{ padding: '8px 16px' }} onClick={() => navigate('/admin/shift-requests')}>{t('review')}</button>
          </div>
        )}
        {attendanceProgress < 100 && (
          <div className="alert alert-error" style={{ borderRadius: 16, padding: '16px 24px', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.1)', fontWeight: 700 }}>
            {getTranslatedProgressMessage()}
          </div>
        )}
      </div>

      {/* QUICK STATS - PREMIUM CARDS */}
      <div style={{ padding: '0 24px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        <div className="card" style={{ background: 'var(--gradient-success)', border: 'none', color: 'white', padding: 28, borderRadius: 12, boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.15)' }}>
          <div style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1px' }}>{stats.present}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>👶 {t('childrenPresent')}</div>
        </div>
        <div className="card" style={{ background: 'var(--gradient-danger)', border: 'none', color: 'white', padding: 28, borderRadius: 12, boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.15)' }}>
          <div style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1px' }}>{stats.absent}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>❌ {t('childrenAbsent')}</div>
        </div>
        <div className="card" style={{ background: 'var(--gradient-primary)', border: 'none', color: 'white', padding: 28, borderRadius: 12, boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.15)' }}>
          <div style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1px' }}>{stats.staffIn}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>👩‍🏫 {t('staffIn')}</div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #8e24aa, #6a1b9a)', border: 'none', color: 'white', padding: 28, borderRadius: 12, boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.15)' }}>
          <div style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1px' }}>{ratio}:1</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>📊 {t('staffChildRatio')}</div>
        </div>
      </div>

      <div style={{ padding: '0 24px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* PROGRESS & TRACKING */}
        <div className="card" style={{ padding: 28, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text)', fontWeight: 900 }}>📈 {t('attendanceProgress')}</h3>
            <span style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--primary)' }}>{attendanceProgress}%</span>
          </div>
          <div style={{ width: '100%', background: 'var(--bg)', height: 16, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ width: `${attendanceProgress}%`, background: 'var(--gradient-primary)', height: '100%', borderRadius: 12, transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500 }}>
            {attendanceProgress === 100 ? `✨ ${t('allPerfect') || 'Everything is perfect! All children are accounted for.'}` : `⌛ ${t('almostThere') || 'Almost there! Click below to finish marking attendance.'}`}
          </p>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/attendance')}
            style={{ width: '100%', marginTop: 28, padding: '16px', borderRadius: 20, fontWeight: 800 }}
          >
            {t('openAttendance') || 'View Attendance List'}
          </button>
        </div>

        {/* STICKY REMINDERS PREVIEW */}
        <div className="card" style={{ padding: 28, borderRadius: 12, background: 'rgba(255, 249, 196, 0.3)', border: '1px solid rgba(255, 241, 118, 0.5)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#5d4037', fontWeight: 900 }}>📌 {t('reminders')}</h3>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => navigate('/admin/reminders')}
              style={{ background: '#afb42b', border: 'none', padding: '6px 16px', borderRadius: 20 }}
            >
              {t('viewBoard')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reminders.filter(r => !r.completed).slice(0, 3).map((r, i) => (
              <div key={r._id} style={{ background: 'white', padding: '14px 18px', borderRadius: 16, boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 12, borderRight: `6px solid ${i % 2 === 0 ? '#afb42b' : '#4FC3F7'}` }}>
                <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 700, color: '#3e2723' }}>{r.title}</div>
              </div>
            ))}
            {reminders.filter(r => !r.completed).length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)', fontStyle: 'italic', fontWeight: 600 }}>✨ {t('allCaughtUp')}</div>
            )}
          </div>
          <form onSubmit={handleCreateReminder} style={{ marginTop: 24, display: 'flex', gap: 12 }}>
             <input name="title" placeholder={t('quickNote')} required className="input" style={{ flex: 1, background: 'white' }} />
             <button type="submit" className="btn btn-primary" style={{ width: 50, height: 50, borderRadius: 16, padding: 0, fontSize: '1.5rem' }}>+</button>
          </form>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div style={{ padding: '0 20px 40px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#1a1a1a', fontWeight: 800 }}>⚡ {t('quickActions')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 20 }}>
          {actionCards.map((card, idx) => (
            <div key={idx} onClick={() => navigate(card.to)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 70, height: 70, borderRadius: 12, background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }} className="action-icon">
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
