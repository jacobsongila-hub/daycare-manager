import { useState, useEffect } from 'react';
import { register } from '../../services/api';
import api from '../../services/api';

const ROLES = [
  { value: 'admin', label: '👑 Admin (Owner)' },
  { value: 'staff', label: '👤 Staff' },
  { value: 'parent', label: '👨‍👩‍👧 Parent' },
];

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const roleColors = {
  admin: 'avatar-blue',
  owner: 'avatar-blue',
  staff: 'avatar-green',
  parent: 'avatar-purple',
};

const roleBadgeStyle = {
  admin: { background: '#e3f2fd', color: '#1565c0' },
  owner: { background: '#e3f2fd', color: '#1565c0' },
  staff: { background: '#e8f5e9', color: '#2e7d32' },
  parent: { background: '#f3e5f5', color: '#6a1b9a' },
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [showPass, setShowPass] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Try to fetch users list — endpoint may vary
      const res = await api.get('/api/users').catch(() => api.get('/api/auth/users').catch(() => ({ data: [] })));
      const data = res.data?.data ?? res.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await register(form);
      setSuccess(`✅ User "${form.name}" created successfully!`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || '';
      if (msg.toLowerCase().includes('exist') || err.response?.status === 409) {
        setError('A user with that email already exists.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach server. Check your connection.');
      } else {
        setError(msg || 'Failed to create user. Check the details and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = (role) => ROLES.find(r => r.value === role?.toLowerCase())?.label ?? role ?? 'Unknown';

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Accounts</div>
          <div className="page-subtitle">Create & manage logins</div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Role legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {ROLES.map(r => (
          <span key={r.value} className="badge" style={{ ...roleBadgeStyle[r.value], padding: '5px 12px', fontSize: 12 }}>
            {r.label}
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No users found</div>
          <div className="empty-sub">Create the first user with the + button below</div>
        </div>
      ) : (
        users.map((u, i) => {
          const role = (u.role || '').toLowerCase();
          return (
            <div key={u.id ?? u._id ?? i} className="list-item">
              <div className="list-item-left">
                <div className={`avatar ${roleColors[role] ?? 'avatar-blue'}`}>
                  {getInitials(u.name)}
                </div>
                <div className="list-item-info">
                  <div className="list-item-name">{u.name}</div>
                  <div className="list-item-sub">✉️ {u.email}</div>
                </div>
              </div>
              <span className="badge" style={roleBadgeStyle[role] ?? roleBadgeStyle.staff}>
                {roleLabel(u.role)}
              </span>
            </div>
          );
        })
      )}

      <button className="fab" onClick={() => { setError(''); setShowModal(true); }} title="Add User">+</button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Create New User</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Jane Smith" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" placeholder="jane@example.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  inputMode="email" autoCapitalize="none" />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ paddingRight: 52 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)'
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role / Portal *</label>
                <select className="form-select"
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {form.role === 'admin' && '👑 Full access to all data and settings'}
                  {form.role === 'staff' && '👤 Can clock in/out and view their own time'}
                  {form.role === 'parent' && '👨‍👩‍👧 Read-only view of their children'}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Creating…</>
                ) : '✓ Create User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
