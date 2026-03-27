import { NotificationProvider } from './context/NotificationContext';

// ... (imports stay the same)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
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
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RoleRouterPage() {
  return <RoleRouter />;
}
