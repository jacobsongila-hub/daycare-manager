import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ChildrenApi, StaffApi, AttendanceApi, ShiftRequestsApi, AnnouncementsApi } from '../services/api';

const actionCards = [
  { to: '/admin/attendance', icon: '📝', label: 'Mark Attendance', color: '#4CAF50' },
  { to: '/admin/photos', icon: '📸', label: 'Upload Photos', color: '#E91E63' },
  { to: '/admin/notes', icon: '📋', label: 'Daily Notes', color: '#FF9800' },
  { to: '/admin/families', icon: '👨‍👩‍👧', label: 'Families', color: '#9C27B0' },
  { to: '/admin/docs', icon: '📁', label: 'Documents', color: '#607D8B' },
  { to: '/admin/reports', icon: '📥', label: 'Generate Reports', color: '#F44336' },
  { to: '/admin/shift-requests', icon: '📋', label: 'Shift Requests', color: '#2196F3' },
  { to: '/admin/staff-schedule', icon: '💼', label: 'Staff Schedule', color: '#3F51B5' },
];

function getDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, staffIn: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [pendingShifts, setPendingShifts] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [childrenRes, attRes, staffRes, shiftRes, annRes] = await Promise.all([
          ChildrenApi.getAll(),
          AttendanceApi.getAll(),
          StaffApi.getAll(),
          ShiftRequestsApi.getAll(),
          AnnouncementsApi.getAll()
        ]);

        const children = childrenRes.data || [];
        const attendance = attRes.data || [];
        const staffList = staffRes.data || [];
        const shifts = shiftRes.data || [];
        const anns = annRes.data || [];

        // Calculate today's stats
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysAtt = attendance.filter(a => a.date === todayStr);

        const present = todaysAtt.filter(a => a.status === 'Present').length;
        const absent = todaysAtt.filter(a => a.status === 'Absent').length;
        const staffIn = staffList.filter(s => s.status === 'Active').length; // Mock logic
        
        setStats({ present, absent, total: children.length, staffIn });
        setAnnouncements(anns.slice(0, 3));
        setPendingShifts(shifts.filter(s => s.status === 'Pending').length);

      } catch (err) {
        console.error('Error loading dashboard data', err);
      }
    }
    loadData();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const attendanceProgress = stats.total > 0 ? Math.round(((stats.present + stats.absent) / stats.total) * 100) : 0;
  const ratio = stats.staffIn > 0 ? Math.round(stats.present / stats.staffIn) : stats.present;

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ padding: '20px', background: 'linear-gradient(135deg, #1565c0, #2196f3)', color:'white', borderRadius: '0 0 20px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.2rem', opacity: 0.9 }}>{getDayGreeting()},</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: 5 }}>{today}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => navigator.share?.({ title: 'Daycare App', url: window.location.origin })}>
              🔗
            </button>
            <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }} onClick={() => navigate('/admin/settings')}>
              👤
            </button>
          </div>
        </div>
      </div>

      {/* ALERTS / BANNERS */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pendingShifts > 0 && (
          <div style={{ background: '#fff3e0', borderLeft: '4px solid #ff9800', padding: 15, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📋 <strong>{pendingShifts} Pending Shift Requests</strong></span>
            <button onClick={() => navigate('/admin/shift-requests')} style={{ background: '#ff9800', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>Review</button>
          </div>
        )}
        {attendanceProgress < 100 && (
          <div style={{ background: '#ffebee', borderLeft: '4px solid #f44336', padding: 15, borderRadius: 8 }}>
            ⚠️ <strong>Unmarked Children Alert:</strong> {stats.total - (stats.present + stats.absent)} children still need attendance marked.
          </div>
        )}

        {announcements.length > 0 && (
          <div style={{ background: '#e3f2fd', borderLeft: '4px solid #2196f3', padding: 15, borderRadius: 8 }}>
            📢 <strong>Latest Announcement:</strong> {announcements[0].title}
          </div>
        )}
      </div>

      {/* QUICK STATS */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#555' }}>Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#4CAF50' }}>{stats.present}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>👶 Children Present</div>
          </div>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f44336' }}>{stats.absent}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>❌ Children Absent</div>
          </div>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#2196F3' }}>{stats.staffIn}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>👩‍🏫 Staff In</div>
          </div>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#9C27B0' }}>{ratio}:1</div>
            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>📊 Staff:Child Ratio</div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ marginTop: 20, background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#444' }}>Attendance Progress</span>
            <span style={{ fontWeight: 700, color: '#2196F3' }}>{attendanceProgress}%</span>
          </div>
          <div style={{ width: '100%', background: '#eee', height: 10, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${attendanceProgress}%`, background: '#2196F3', height: '100%', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ padding: '0 20px 20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#555' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px 10px' }}>
          {actionCards.map((card, idx) => (
            <Link key={idx} to={card.to} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                {card.icon}
              </div>
              <span style={{ fontSize: '0.75rem', textAlign: 'center', color: '#444', fontWeight: 600, lineHeight: 1.2 }}>{card.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
