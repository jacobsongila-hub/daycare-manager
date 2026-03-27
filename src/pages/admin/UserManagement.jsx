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
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || (!isEdit && !form.password.trim())) {
      setError('Name, email, and password (for new users) are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        // If editing and password is empty, don't send it to the backend
        const { password, ...updateData } = form;
        if (password) updateData.password = password;
        await api.put(`/api/users/${selectedId}`, updateData);
        setSuccess(`✅ User "${form.name}" updated!`);
      } else {
        await register(form);
        setSuccess(`✅ User "${form.name}" created!`);
      }
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setSelectedId(u._id || u.id);
    setIsEdit(true);
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (u) => {
    const id = u._id || u.id;
    if (window.confirm(`Are you sure you want to delete ${u.name}?`)) {
      try {
        await api.delete(`/api/users/${id}`);
        setSuccess('User deleted successfully');
        load();
      } catch (err) {
        setError('Failed to delete user.');
      }
    }
  };

  const roleLabel = (role) => ROLES.find(r => r.value === role?.toLowerCase())?.label ?? role ?? 'Unknown';

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
        <div>
          <h2 style={{ margin: 0 }}>👥 User Accounts</h2>
          <p style={{ margin: 0, color: '#666' }}>Manage logins for staff and parents.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', email: '', password: '', role: 'staff' }); setIsEdit(false); setError(''); setShowModal(true); }}>
          ➕ Add User Account
        </button>
      </div>

      {error && <div style={{ color: '#d32f2f', background: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 15 }}>⚠️ {error}</div>}
      {success && <div style={{ color: '#2e7d32', background: '#e8f5e9', padding: 12, borderRadius: 8, marginBottom: 15 }}>{success}</div>}

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15 }}>
          {users.map((u, i) => {
            const role = (u.role || '').toLowerCase();
            return (
              <div key={u.id ?? u._id ?? i} style={{ background: 'white', padding: 15, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ padding: 10, background: '#eee', borderRadius: '50%', fontSize: '1.2rem' }}>👤</div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{u.email}</div>
                    <span className="badge" style={{ ...roleBadgeStyle[role], marginTop: 5, display: 'inline-block' }}>{roleLabel(u.role)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ padding: '5px 10px' }} onClick={() => handleEdit(u)}>✏️</button>
                  <button className="btn" style={{ padding: '5px 10px', color: '#f44336' }} onClick={() => handleDelete(u)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">{isEdit ? 'Edit User' : 'Create New User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: 5 }}>Full Name *</label>
                <input className="input" placeholder="Jane Smith" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: 5 }}>Email / Username *</label>
                <input className="input" placeholder="jane@example.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  inputMode="email" autoCapitalize="none" />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: 5 }}>
                  {isEdit ? 'Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    placeholder={isEdit ? 'Update password...' : 'Min. 6 characters'}
                    required={!isEdit}
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ paddingRight: 45, width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 18
                    }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: 5 }}>Role / Portal *</label>
                <select className="input"
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Saving...' : (isEdit ? 'Update Account' : '✓ Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
