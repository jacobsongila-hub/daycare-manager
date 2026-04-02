import axios from 'axios';

const BASE_URL = ''; // Use relative paths for proxy support; avoids /api doubling

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

export default api;
