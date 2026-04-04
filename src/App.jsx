import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';

// Layouts (found in components folder)
import AdminLayout from './components/AdminLayout.jsx';
import StaffLayout from './components/StaffLayout.jsx';
import ParentLayout from './components/ParentLayout.jsx';

// Pages
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminAttendance from './pages/admin/AdminAttendance.jsx';
import FamilyManagement from './pages/admin/FamilyManagement.jsx';
import ChildDetail from './pages/admin/ChildDetail.jsx';
import EmergencyContacts from './pages/admin/EmergencyContacts.jsx';
import AdminStaff from './pages/admin/AdminStaff.jsx';
import TimeTracking from './pages/TimeTracking.jsx';
import AdminStaffSchedule from './pages/admin/AdminStaffSchedule.jsx';
import AdminCalendar from './pages/admin/AdminCalendar.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import Announcements from './pages/admin/Announcements.jsx';
import Reminders from './pages/admin/Reminders.jsx';
import ShiftManager from './pages/admin/ShiftManager.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminDocs from './pages/admin/AdminDocs.jsx';
import AdminPhotos from './pages/admin/AdminPhotos.jsx';
import AdminNotes from './pages/admin/AdminNotes.jsx';

// Staff Pages
import StaffHome from './pages/staff/StaffHome.jsx';
import StaffAttendance from './pages/staff/StaffAttendance.jsx';
import StaffNotes from './pages/staff/StaffNotes.jsx';
import StaffTimeTracking from './pages/staff/StaffTimeTracking.jsx';
import StaffShifts from './pages/staff/StaffShifts.jsx';
import StaffCalendar from './pages/staff/StaffCalendar.jsx';
import StaffDocs from './pages/staff/StaffDocs.jsx';
import StaffProfile from './pages/staff/StaffProfile.jsx';

// Parent Pages
import ParentHome from './pages/parent/ParentHome.jsx';
import ParentCalendar from './pages/parent/ParentCalendar.jsx';
import ParentDocs from './pages/parent/ParentDocs.jsx';
import ParentProfile from './pages/parent/ParentProfile.jsx';
import ParentPhotos from './pages/parent/ParentPhotos.jsx';
import SetupAccount from './pages/SetupAccount.jsx';

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return null;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'owner') return <Navigate to="/admin" replace />;
  if (role === 'staff' || role === 'employee') return <Navigate to="/staff" replace />;
  if (role === 'parent') return <Navigate to="/parent" replace />;
  return <Navigate to="/admin" replace />;
}

function Splash() {
  const [showWakeMessage, setShowWakeMessage] = useState(false);

  useEffect(() => {
    // If Splash stays on screen for more than 3 seconds, the Render backend is waking up
    const timer = setTimeout(() => {
      setShowWakeMessage(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="splash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ textAlign: 'center', background: 'var(--surface)', padding: '50px 40px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', maxWidth: 400, width: '90%' }}>
        <div className="splash-logo" style={{ fontSize: 72, marginBottom: 24, animation: 'float 3s ease-in-out infinite' }}>🏠</div>
        <div className="spinner" style={{ margin: '0 auto', width: 45, height: 45, borderTopColor: 'var(--primary)', borderWidth: 4 }}></div>
        <p style={{ marginTop: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: 1, fontSize: '1.2rem' }}>LITTLE ONES</p>
        
        {showWakeMessage && (
          <div style={{ marginTop: 20, padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)', animation: 'fadeIn 0.5s ease-out' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)', marginRight: 6 }}>⏱️</span>
              Waking up secure server...
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-light)' }}>(This may take up to 30 seconds)</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.needsSetup && window.location.pathname !== '/setup-account') {
    return <Navigate to="/setup-account" replace />;
  }

  const role = (user.role || '').toLowerCase();
  const isAllowed = allowedRoles?.some(r => role === r) || false;
  const isAdmin = role === 'admin' || role === 'owner';

  if (!isAllowed && !isAdmin && allowedRoles) {
    if (role === 'staff' || role === 'employee') return <Navigate to="/staff" replace />;
    if (role === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
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
            <Route path="/setup-account" element={<ProtectedRoute><SetupAccount /></ProtectedRoute>} />

            <Route path="/" element={
              <ProtectedRoute>
                <RoleRouter />
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

