import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../utils/constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <Link to={user ? homeFor(user.role) : '/login'} className="brand">
        🩺 Smart Health Booking
      </Link>
      {user && (
        <div className="nav-right">
          <span className="user-chip">
            {user.profile?.name || user.email} <span className={`role role-${user.role}`}>{user.role}</span>
          </span>
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
