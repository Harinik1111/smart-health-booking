import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { errMsg } from '../../api/client';
import { homeFor } from '../../utils/constants';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Welcome back</h2>
        <p className="muted">Log in to manage your appointments.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Logging in…' : 'Login'}
        </button>
        <p className="muted center">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
