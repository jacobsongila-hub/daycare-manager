import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getChildren, getParents } from '../../services/api';

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  if (years > 0) return `${years}y ${months}m`;
  return `${months} months`;
}

export default function ParentHome() {
  const { user } = useAuth();
  const [myChildren, setMyChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cr, pr] = await Promise.all([getChildren(), getParents()]);
        const allChildren = cr.data?.data ?? cr.data ?? [];
        const allParents = pr.data?.data ?? pr.data ?? [];

        // Find this parent's record by email
        const myParentRecord = Array.isArray(allParents)
          ? allParents.find(p => p.email === user?.email)
          : null;

        const myId = myParentRecord?.id ?? myParentRecord?._id;

        // Filter children linked to this parent
        const mine = Array.isArray(allChildren)
          ? allChildren.filter(c => {
              if (myId && (c.parentId === myId || c.parent_id === myId)) return true;
              // Fallback: match by parent name or if only 1 child
              if (myParentRecord?.name && c.parentName === myParentRecord.name) return true;
              return false;
            })
          : [];

        setMyChildren(mine.length > 0 ? mine : Array.isArray(allChildren) ? allChildren : []);
      } catch (err) {
        setError(err.code === 'ERR_NETWORK' ? 'Cannot reach server.' : 'Failed to load.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div>
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #4a148c, #6a1b9a, #8e24aa)' }}>
        <div className="welcome-title">Welcome,</div>
        <div className="welcome-name">{user?.name || user?.email?.split('@')[0] || 'Parent'}</div>
        <div className="welcome-date">{today}</div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="section-label">Your Children</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : myChildren.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👶</div>
          <div className="empty-title">No children linked yet</div>
          <div className="empty-sub">Ask your daycare admin to link your account</div>
        </div>
      ) : (
        myChildren.map((child, i) => (
          <div key={child.id ?? child._id ?? i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar avatar-purple" style={{ width: 56, height: 56, fontSize: 22 }}>
              {child.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{child.name}</div>
              {child.dob && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  🎂 Age: {calcAge(child.dob)}
                </div>
              )}
              {child.age && !child.dob && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Age: {child.age}</div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                📍 Enrolled at daycare
              </div>
            </div>
          </div>
        ))
      )}

      <div className="card" style={{ marginTop: 16, background: 'var(--primary-light)', border: '1px solid #bbdefb' }}>
        <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4 }}>📞 Need to contact the daycare?</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Reach out to your daycare manager directly for any questions or updates.
        </div>
      </div>
    </div>
  );
}
