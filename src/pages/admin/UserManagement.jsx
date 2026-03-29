import { useLanguage } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import React, { useState, useEffect } from 'react';
import api, { FamiliesApi, StaffApi, register } from '../../services/api';

const roleColors = {
  admin: 'avatar-blue',
  owner: 'avatar-blue',
  staff: 'avatar-green',
  parent: 'avatar-purple',
};

export default function UserManagement() {
  const { t } = useLanguage();
  const { addToast } = useNotification();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [showPass, setShowPass] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const ROLES = [
    { value: 'admin', label: `👑 ${t('admin') || 'Admin'}` },
    { value: 'staff', label: `👤 ${t('staff') || 'Staff'}` },
    { value: 'parent', label: `👨‍👩‍👧 ${t('parent') || 'Parent'}` },
  ];

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
      addToast(t('failedToSave'), 'error');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const { password, ...updateData } = form;
        if (password) updateData.password = password;
        await api.put(`/api/users/${selectedId}`, updateData);
        addToast(t('userUpdated'), 'success');
      } else {
        await register(form);
        addToast(t('userCreated'), 'success');
      }
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      await load();
    } catch (err) {
      addToast(err.response?.data?.message || t('failedToSave'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setSelectedId(u._id || u.id);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleSyncAccounts = async () => {
    if (!(await confirm('This will automatically create login accounts for all families and staff that don\'t have one yet. Use default password "Daycare123!"?'))) return;
    
    setSyncing(true);
    try {
      const [fRes, sRes, uRes] = await Promise.all([
        FamiliesApi.getAll(),
        StaffApi.getAll(),
        api.get('/api/users')
      ]);
      
      const families = fRes.data || [];
      const staff = sRes.data || [];
      const currentUsers = uRes.data || [];
      const existingEmails = new Set(currentUsers.map(u => u.email.toLowerCase()));
      
      let createdCount = 0;
      
      // Sync Families
      for (const fam of families) {
        const email = fam.loginEmail || fam.motherEmail || fam.fatherEmail;
        if (email && !existingEmails.has(email.toLowerCase())) {
          await register({
            name: `${fam.familyName} Parent`,
            email: email,
            password: 'Daycare123!',
            role: 'parent'
          });
          existingEmails.add(email.toLowerCase());
          createdCount++;
        }
      }
      
      // Sync Staff
      for (const st of staff) {
        if (st.email && !existingEmails.has(st.email.toLowerCase())) {
          await register({
            name: st.name,
            email: st.email,
            password: 'Daycare123!',
            role: 'staff'
          });
          existingEmails.add(st.email.toLowerCase());
          createdCount++;
        }
      }
      
      addToast(`Sync complete! Created ${createdCount} new accounts.`, 'success');
      load();
    } catch (err) {
      addToast('Failed to sync accounts', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (u) => {
    const id = u._id || u.id;
    if (await confirm(t('confirmDeleteUser') || 'Delete User?', 'Confirm Delete', true)) {
      try {
        await api.delete(`/api/users/${id}`);
        addToast(t('userDeleted'), 'success');
        load();
      } catch (err) {
        addToast(t('failedToSave'), 'error');
      }
    }
  };

  const roleLabel = (role) => ROLES.find(r => r.value === role?.toLowerCase())?.label ?? role ?? 'Unknown';

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div className="page-header" style={{ marginBottom: 30 }}>
        <div>
          <h2 className="page-title">👥 {t('userAccounts')}</h2>
          <p className="page-subtitle">{t('manageLogins')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleSyncAccounts} disabled={syncing}>
            {syncing ? '⌛ Syncing...' : '🔄 Sync Missing Accounts'}
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', email: '', password: '', role: 'staff' }); setIsEdit(false); setShowModal(true); }}>
            ➕ {t('addUserAccount')}
          </button>
        </div>
      </div>

      {loading ? <div className="spinner"></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 15 }}>
          {users.map((u, i) => {
            const role = (u.role || '').toLowerCase();
            return (
              <div key={u.id ?? u._id ?? i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                  <div className={`avatar ${roleColors[role] || 'avatar-blue'}`}>
                    {u.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 5 }}>{u.email}</div>
                    <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>{roleLabel(u.role)}</span>
                  </div>
                </div>
                <div className="list-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(u)}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{isEdit ? t('editUser') : t('createNewUser')}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 10 }}>
              <div className="form-group">
                <label className="form-label">{t('fullNameReq')}</label>
                <input className="input" placeholder="e.g. Jane Smith" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">{t('emailUsernameReq')}</label>
                <input className="input" placeholder="jane@example.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  inputMode="email" autoCapitalize="none" />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isEdit ? t('passwordHint') : t('passwordReq')}
                </label>
                <div className="password-input-wrapper">
                  <input
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    placeholder={isEdit ? '••••••••' : 'Min. 6 characters'}
                    required={!isEdit}
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPass(p => !p)}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('rolePortalReq')}</label>
                <select className="input"
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? t('saving') : (isEdit ? t('updateAccount') : t('createAccount'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
