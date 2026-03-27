import axios from 'axios';

const BASE_URL = ''; // Use relative paths for proxy support; avoids /api/api doubling

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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

export const login = (email, password) => api.post('/api/auth/login', { email, password });
export const register = (data) => api.post('/api/auth/register', data);

// Base crud factory
const createCrud = (path) => ({
  getAll: () => api.get(path),
  getOne: (id) => api.get(`${path}/${id}`),
  create: (data) => api.post(path, data),
  update: (id, data) => api.put(`${path}/${id}`, data),
  delete: (id) => api.delete(`${path}/${id}`),
});

export const UsersApi = createCrud('/api/users');
export const StaffApi = createCrud('/api/staff');
export const FamiliesApi = createCrud('/api/families');
export const ChildrenApi = createCrud('/api/children');
export const AnnouncementsApi = createCrud('/api/announcements');
export const ShiftRequestsApi = createCrud('/api/shift-requests');
export const CalendarEventsApi = createCrud('/api/calendar-events');
export const DailyNotesApi = createCrud('/api/daily-notes');
export const DocumentsApi = createCrud('/api/documents');
export const TimeEntriesApi = createCrud('/api/time-entries');
export const AttendanceApi = createCrud('/api/attendance');
export const RemindersApi = createCrud('/api/reminders');
export const PhotosApi = createCrud('/api/photos');

export const clockIn = (staffId) =>
  api.post('/api/time-entries', { staffId, type: 'in', timestamp: new Date().toISOString() });
export const clockOut = (staffId) =>
  api.post('/api/time-entries', { staffId, type: 'out', timestamp: new Date().toISOString() });
export const markAttendance = (data) => api.post('/api/attendance/mark', data);

export default api;
