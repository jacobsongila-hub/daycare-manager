import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UsersApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';

export default function SetupAccount() {
  const { user, login } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Update User profile (name, email/username, password)
      await UsersApi.update(user.id || user._id, {
        name: formData.name,
        email: formData.username, // 'email' field is used as username
        password: formData.password
      });

      addToast('Profile setup successful! Re-authenticating...', 'success');
      
      // Re-login with new credentials to refresh token/user data
      await login(formData.username, formData.password);
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 450 }}>
        <div className="login-logo">
          <span className="login-logo-icon">🔒</span>
          <h2>Secure Your Account</h2>
          <p>Please customize your login details for first-time use.</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <div className="form-group">
            <label className="form-label">Full Names (e.g. Tal & Moshe Messing)</label>
            <input 
              className="form-input" 
              required 
              placeholder="Enter both parents' names"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Personal Username</label>
            <input 
              className="form-input" 
              required 
              placeholder="Choose a unique username"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              autoCapitalize="none"
            />
          </div>

          <div className="form-group" style={{ marginTop: 10 }}>
            <label className="form-label">New Private Password</label>
            <input 
              type="password" 
              className="form-input" 
              required 
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-input" 
              required 
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: 15 }}
          >
            {loading ? 'Finalizing...' : 'Set Up Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
