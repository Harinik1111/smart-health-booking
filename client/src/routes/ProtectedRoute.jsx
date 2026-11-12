import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../utils/constants';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-msg">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

// For /login and /register: logged-in users are sent to their dashboard
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-msg">Loading…</div>;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
