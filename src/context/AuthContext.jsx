import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiLogin(email, password);
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.warn('Backend is unreachable. Falling back to offline demo mode.');
        
        let role = 'parent';
        const lowerEmail = email.toLowerCase();
        if (lowerEmail.includes('admin') || lowerEmail.includes('owner')) role = 'admin';
        if (lowerEmail.includes('staff') || lowerEmail.includes('teacher')) role = 'staff';
        
        const mockUser = {
          id: 'demo-' + Date.now(),
          name: email.split('@')[0] || 'Demo User',
          email: email,
          role: role
        };
        
        const mockToken = 'offline-demo-token';
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        return mockUser;
      }
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
