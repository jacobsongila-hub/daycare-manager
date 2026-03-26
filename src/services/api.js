import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8001`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const register = (data) =>
  api.post('/api/auth/register', data);

// --- Staff ---
export const getStaff = () => api.get('/api/staff');
export const createStaff = (data) => api.post('/api/staff', data);

// --- Parents ---
export const getParents = () => api.get('/api/parents');
export const createParent = (data) => api.post('/api/parents', data);

// --- Children ---
export const getChildren = () => api.get('/api/children');
export const createChild = (data) => api.post('/api/children', data);

// --- Time Entries ---
export const getTimeEntries = () => api.get('/api/time-entries');
export const clockIn = (staffId) =>
  api.post('/api/time-entries', { staffId, type: 'in', timestamp: new Date().toISOString() });
export const clockOut = (staffId) =>
  api.post('/api/time-entries', { staffId, type: 'out', timestamp: new Date().toISOString() });
export const confirmTimesheet = (entryId) =>
  api.post('/api/time-entries/confirm', { entryId });

export default api;
