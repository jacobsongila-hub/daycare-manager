import { useState, useEffect } from 'react';
import { getParents, createParent } from '../services/api';

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function Parents() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getParents();
      const data = res.data?.data ?? res.data ?? [];
      setParents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.code === 'ERR_NETWORK' ? 'Cannot reach server. Check connection.' : 'Failed to load parents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = parents.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createParent(form);
      setSuccess('Parent added successfully!');
      setShowModal(false);
      setForm({ name: '', phone: '', email: '' });
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save parent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Parents</div>
          <div className="page-subtitle">{parents.length} registered</div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Search parents…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👨‍👩‍👧</div>
          <div className="empty-title">No parents found</div>
          <div className="empty-sub">Add your first parent using the + button</div>
        </div>
      ) : (
        filtered.map((parent, i) => (
          <div key={parent.id ?? parent._id ?? i} className="list-item">
            <div className="list-item-left">
              <div className="avatar avatar-blue">{getInitials(parent.name)}</div>
              <div className="list-item-info">
                <div className="list-item-name">{parent.name}</div>
                <div className="list-item-sub">{parent.phone && `📞 ${parent.phone}`}{parent.phone && parent.email && ' · '}{parent.email && `✉️ ${parent.email}`}</div>
              </div>
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => setShowModal(true)} title="Add Parent">+</button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Parent</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Jane Smith" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+1 555 000 0000" type="tel"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" placeholder="parent@email.com" type="email"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : '✓ Add Parent'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
