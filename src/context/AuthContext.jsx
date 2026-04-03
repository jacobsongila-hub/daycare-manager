import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setAuthToken(token);
      const parsedUser = JSON.parse(storedUser);
      parsedUser.needsSetup = parsedUser.name?.includes('(Needs Setup)');
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiLogin(email, password);
      const { token, user: userData } = res.data;
      setAuthToken(token);
      userData.needsSetup = userData.name?.includes('(Needs Setup)');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
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
