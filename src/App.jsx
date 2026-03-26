import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

// Admin portal
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Parents from './pages/Parents';
import Children from './pages/Children';
import Staff from './pages/Staff';
import TimeTracking from './pages/TimeTracking';
import UserManagement from './pages/admin/UserManagement';

// Staff portal
import StaffLayout from './components/StaffLayout';
import StaffHome from './pages/staff/StaffHome';
import StaffTimeTracking from './pages/staff/StaffTimeTracking';

// Parent portal
import ParentLayout from './components/ParentLayout';
import ParentHome from './pages/parent/ParentHome';

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return null;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'owner') return <Navigate to="/admin" replace />;
  if (role === 'staff' || role === 'employee') return <Navigate to="/staff" replace />;
  if (role === 'parent') return <Navigate to="/parent" replace />;
  // Default: if role unknown, try admin
  return <Navigate to="/admin" replace />;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const role = (user.role || '').toLowerCase();
    const allowed = allowedRoles.some(r => role === r);
    // If role doesn't match but we have an unknown role, let admins through everywhere
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
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Root redirect */}
          <Route path="/" element={
            <AuthProvider>
              <ProtectedRoute>
                <RoleRouterPage />
              </ProtectedRoute>
            </AuthProvider>
          } />

          {/* ─── ADMIN PORTAL ─── */}
          <Route
            path="/admin"
            element={<ProtectedRoute allowedRoles={['admin', 'owner']}><AdminLayout /></ProtectedRoute>}
          >
            <Route index element={<Dashboard />} />
            <Route path="parents" element={<Parents />} />
            <Route path="children" element={<Children />} />
            <Route path="staff" element={<Staff />} />
            <Route path="time-tracking" element={<TimeTracking />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* ─── STAFF PORTAL ─── */}
          <Route
            path="/staff"
            element={<ProtectedRoute allowedRoles={['staff', 'employee', 'teacher', 'assistant', 'manager', 'admin', 'owner']}><StaffLayout /></ProtectedRoute>}
          >
            <Route index element={<StaffHome />} />
            <Route path="time" element={<StaffTimeTracking />} />
          </Route>

          {/* ─── PARENT PORTAL ─── */}
          <Route
            path="/parent"
            element={<ProtectedRoute allowedRoles={['parent', 'admin', 'owner']}><ParentLayout /></ProtectedRoute>}
          >
            <Route index element={<ParentHome />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Thin wrapper component to trigger role redirect inside AuthProvider context
function RoleRouterPage() {
  return <RoleRouter />;
}
