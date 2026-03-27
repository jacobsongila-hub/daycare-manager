import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmProvider } from './context/ConfirmContext';

// Layouts (found in components folder)
import AdminLayout from './components/AdminLayout';
import StaffLayout from './components/StaffLayout';
import ParentLayout from './components/ParentLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminAttendance from './pages/admin/AdminAttendance';
import FamilyManagement from './pages/admin/FamilyManagement';
import ChildDetail from './pages/admin/ChildDetail';
import EmergencyContacts from './pages/admin/EmergencyContacts';
import AdminStaff from './pages/admin/AdminStaff';
import TimeTracking from './pages/TimeTracking';
import AdminStaffSchedule from './pages/admin/AdminStaffSchedule';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminSettings from './pages/admin/AdminSettings';
import Announcements from './pages/admin/Announcements';
import Reminders from './pages/admin/Reminders';
import ShiftManager from './pages/admin/ShiftManager';
import UserManagement from './pages/admin/UserManagement';
import AdminReports from './pages/admin/AdminReports';
import AdminDocs from './pages/admin/AdminDocs';
import AdminPhotos from './pages/admin/AdminPhotos';
import AdminNotes from './pages/admin/AdminNotes';

// Staff Pages
import StaffHome from './pages/staff/StaffHome';
import StaffAttendance from './pages/staff/StaffAttendance';
import StaffNotes from './pages/staff/StaffNotes';
import StaffTimeTracking from './pages/staff/StaffTimeTracking';
import StaffShifts from './pages/staff/StaffShifts';
import StaffCalendar from './pages/staff/StaffCalendar';
import StaffDocs from './pages/staff/StaffDocs';
import StaffProfile from './pages/staff/StaffProfile';

// Parent Pages
import ParentHome from './pages/parent/ParentHome';
import ParentCalendar from './pages/parent/ParentCalendar';
import ParentDocs from './pages/parent/ParentDocs';
import ParentProfile from './pages/parent/ParentProfile';
import ParentPhotos from './pages/parent/ParentPhotos';

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return null;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'owner') return <Navigate to="/admin" replace />;
  if (role === 'staff' || role === 'employee') return <Navigate to="/staff" replace />;
  if (role === 'parent') return <Navigate to="/parent" replace />;
  return <Navigate to="/admin" replace />;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const role = (user.role || '').toLowerCase();
    const allowed = allowedRoles.some(r => role === r);
    if (!allowed && role !== 'admin' && role !== 'owner') {
      return <Navigate to="/login" replace />;
    }
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner"></div></div>;
  return user ? <RoleRouter /> : children;
}
export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ConfirmProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            <Route path="/" element={
              <ProtectedRoute>
                <RoleRouterPage />
              </ProtectedRoute>
            } />

            {/* ─── OWNER / ADMIN PORTAL ─── */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="families" element={<FamilyManagement />} />
              <Route path="children/:id" element={<ChildDetail />} />
              <Route path="emergency-contacts" element={<EmergencyContacts />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="time-tracking" element={<TimeTracking />} />
              <Route path="staff-schedule" element={<AdminStaffSchedule />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="shift-requests" element={<ShiftManager />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="docs" element={<AdminDocs />} />
              <Route path="photos" element={<AdminPhotos />} />
              <Route path="notes" element={<AdminNotes />} />
            </Route>

            {/* ─── STAFF PORTAL ─── */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff', 'employee']}><StaffLayout /></ProtectedRoute>}>
              <Route index element={<StaffHome />} />
              <Route path="attendance" element={<StaffAttendance />} />
              <Route path="notes" element={<StaffNotes />} />
              <Route path="time" element={<StaffTimeTracking />} />
              <Route path="shifts" element={<StaffShifts />} />
              <Route path="calendar" element={<StaffCalendar />} />
              <Route path="docs" element={<StaffDocs />} />
              <Route path="profile" element={<StaffProfile />} />
            </Route>

            {/* ─── PARENT PORTAL ─── */}
            <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentLayout /></ProtectedRoute>}>
              <Route index element={<ParentHome />} />
              <Route path="calendar" element={<ParentCalendar />} />
              <Route path="docs" element={<ParentDocs />} />
              <Route path="profile" element={<ParentProfile />} />
              <Route path="photos" element={<ParentPhotos />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        </ConfirmProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

function RoleRouterPage() {
  return <RoleRouter />;
}
