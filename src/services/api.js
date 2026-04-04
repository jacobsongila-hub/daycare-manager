import axios from 'axios';

<<<<<<< HEAD
let BASE_URL = import.meta.env.VITE_API_URL || '';
=======
const BASE_URL = ''; // Use relative paths for proxy support; avoids /api doubling
>>>>>>> ada050f8f80d0a44eedb6d20a4ee7fe2f9335b05

// If a direct URL is provided, and the code uses /api prefix, 
// we might need to handle the mismatch if the backend doesn't use /api.
// However, the proxy configuration is the preferred way.
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
          'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
          config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
<<<<<<< HEAD
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
=======
    (response) => response,
    (error) => {
          if (error.response?.status === 401) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
          }
          return Promise.reject(error);
>>>>>>> ada050f8f80d0a44eedb6d20a4ee7fe2f9335b05
    }
  );

// Unified login/register endpoints following backend /users/ prefix
export const login = (email, password) => api.post('/api/users/login', { email, password });
export const register = (data) => api.post('/api/users/register', data);

// Base crud factory
const createCrud = (path) => ({
    getAll: () => api.get(path),
    getOne: (id) => api.get(`${path}/${id}`),
    create: (data) => api.post(path, data),
    update: (id, data) => api.put(`${path}/${id}`, data),
    delete: (id) => api.delete(`${path}/${id}`),
});

export const UsersApi = createCrud('/api/users');
export const FamiliesApi = createCrud('/api/families');
export const ChildrenApi = createCrud('/api/children');
export const StaffApi = createCrud('/api/staff');
export const AttendanceApi = createCrud('/api/attendance');
export const PaymentsApi = createCrud('/api/payments');
export const DocumentsApi = createCrud('/api/documents');
export const HealthApi = createCrud('/api/health');
export const MealsApi = createCrud('/api/meals');
export const NotificationsApi = createCrud('/api/notifications');
export const FeedApi = createCrud('/api/feed');
export const ScheduleApi = createCrud('/api/schedule');
export const GalleryApi = createCrud('/api/gallery');

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
