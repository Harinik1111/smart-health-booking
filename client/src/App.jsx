import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { PublicRoute } from './routes/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { homeFor } from './utils/constants';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-msg">Loading…</div>;
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/book/:doctorId" element={<ProtectedRoute roles={['patient']}><BookAppointment /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  );
}
