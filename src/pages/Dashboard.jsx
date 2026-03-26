import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getParents } from '../services/api';
import { getChildren } from '../services/api';
import { getStaff } from '../services/api';

const cards = [
  { to: '/parents', icon: '👨‍👩‍👧', label: 'Parents', key: 'parents', accent: '#2196f3' },
  { to: '/children', icon: '👶', label: 'Children', key: 'children', accent: '#43a047' },
  { to: '/staff', icon: '👤', label: 'Staff', key: 'staff', accent: '#8e24aa' },
  { to: '/time-tracking', icon: '⏱️', label: 'Time Tracking', key: 'time', accent: '#fb8c00' },
];

function getDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ parents: '—', children: '—', staff: '—', time: '—' });

  useEffect(() => {
    async function loadCounts() {
      try {
        const [p, c, s] = await Promise.all([
          getParents().then(r => r.data?.length ?? r.data?.data?.length ?? 0).catch(() => '?'),
          getChildren().then(r => r.data?.length ?? r.data?.data?.length ?? 0).catch(() => '?'),
          getStaff().then(r => r.data?.length ?? r.data?.data?.length ?? 0).catch(() => '?'),
        ]);
        setCounts({ parents: p, children: c, staff: s, time: '—' });
      } catch {
        // Silently fail, dashboard still works
      }
    }
    loadCounts();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <div className="welcome-banner">
        <div className="welcome-title">{getDayGreeting()},</div>
        <div className="welcome-name">{user?.name || user?.email?.split('@')[0] || 'Admin'}</div>
        <div className="welcome-date">{today}</div>
      </div>

      <div className="section-label">Quick Access</div>
      <div className="dashboard-grid">
        {cards.map((card) => (
          <Link
            key={card.key}
            to={card.to}
            className="dash-card"
            style={{ '--card-accent': card.accent }}
          >
            <span className="dash-icon">{card.icon}</span>
            <span className="dash-count">{counts[card.key]}</span>
            <span className="dash-label">{card.label}</span>
            <span className="dash-arrow">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
