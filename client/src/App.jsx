import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import TestDrives from './pages/TestDrives';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Sales from './pages/Sales';
import Services from './pages/Services';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AuditLogs from './pages/AuditLogs';
import NotFound from './pages/NotFound';

const STAFF = ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'];
const MANAGERS = ['ADMIN', 'MANAGER'];

function Home() {
  const { user } = useAuth();
  return <Navigate to={user.role === 'CUSTOMER' ? '/cars' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Home />} />
          <Route path="cars" element={<Cars />} />
          <Route path="leads" element={<Leads />} />
          <Route path="test-drives" element={<TestDrives />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="sales" element={<Sales />} />
          <Route path="services" element={<Services />} />
          <Route path="notifications" element={<Notifications />} />
          <Route element={<ProtectedRoute roles={['CUSTOMER', ...MANAGERS]} />}>
            <Route path="payments" element={<Payments />} />
          </Route>
          <Route element={<ProtectedRoute roles={STAFF} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
          </Route>
          <Route element={<ProtectedRoute roles={MANAGERS} />}>
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="users" element={<Users />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
          <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
