import { useState, useEffect } from 'react';
import { getChildren, createChild, getParents } from '../services/api';

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  if (years > 0) return `${years}y ${months}m`;
  return `${months} months`;
}

export default function Children() {
  const [children, setChildren] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', parentId: '', dob: '', age: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [cr, pr] = await Promise.all([getChildren(), getParents()]);
      const c = cr.data?.data ?? cr.data ?? [];
      const p = pr.data?.data ?? pr.data ?? [];
      setChildren(Array.isArray(c) ? c : []);
      setParents(Array.isArray(p) ? p : []);
    } catch (err) {
      setError(err.code === 'ERR_NETWORK' ? 'Cannot reach server.' : 'Failed to load children.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = children.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getParentName = (id) => parents.find(p => (p.id ?? p._id) === id)?.name ?? '—';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createChild(form);
      setSuccess('Child added!');
      setShowModal(false);
      setForm({ name: '', parentId: '', dob: '', age: '' });
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Children</div>
          <div className="page-subtitle">{children.length} enrolled</div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input className="search-input" placeholder="Search children…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👶</div>
          <div className="empty-title">No children yet</div>
          <div className="empty-sub">Tap + to enroll a child</div>
        </div>
      ) : (
        filtered.map((child, i) => (
          <div key={child.id ?? child._id ?? i} className="list-item">
            <div className="list-item-left">
              <div className="avatar avatar-green">{getInitials(child.name)}</div>
              <div className="list-item-info">
                <div className="list-item-name">{child.name}</div>
                <div className="list-item-sub">
                  {child.dob ? `Age: ${calcAge(child.dob)}` : child.age ? `Age: ${child.age}` : ''}
                  {(child.dob || child.age) && child.parentId ? ' · ' : ''}
                  {child.parentId ? `👨‍👩‍👧 ${getParentName(child.parentId)}` : child.parent ?? ''}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => setShowModal(true)} title="Add Child">+</button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Enroll Child</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Child's Name *</label>
                <input className="form-input" placeholder="Emma Smith" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Parent</label>
                <select className="form-select"
                  value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">Select a parent…</option>
                  {parents.map(p => (
                    <option key={p.id ?? p._id} value={p.id ?? p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date"
                  value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Age (if no DOB)</label>
                <input className="form-input" placeholder="e.g. 2 years"
                  value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : '✓ Enroll Child'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
