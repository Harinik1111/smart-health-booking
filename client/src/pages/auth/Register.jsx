import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { errMsg } from '../../api/client';
import { homeFor } from '../../utils/constants';

const empty = {
  role: 'patient',
  email: '',
  password: '',
  name: '',
  // doctor
  specialization: '',
  experienceYears: '',
  hospitalName: '',
  hospitalLocation: '',
  // patient
  phone: '',
  dateOfBirth: '',
  gender: '',
  // admin
  adminCode: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { role, email, password } = form;
    let payload = { role, email, password };
    if (role === 'doctor') {
      payload = {
        ...payload,
        name: form.name,
        specialization: form.specialization,
        experienceYears: Number(form.experienceYears),
        hospitalName: form.hospitalName,
        hospitalLocation: form.hospitalLocation,
      };
    } else if (role === 'patient') {
      payload = { ...payload, name: form.name, phone: form.phone, dateOfBirth: form.dateOfBirth, gender: form.gender };
    } else {
      payload = { ...payload, adminCode: form.adminCode };
    }
    try {
      const user = await register(payload);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card wide" onSubmit={submit}>
        <h2>Create your account</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <label>I am a</label>
        <div className="role-picker">
          {['patient', 'doctor', 'admin'].map((r) => (
            <button
              type="button"
              key={r}
              className={`role-opt ${form.role === r ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: r })}
            >
              {r}
            </button>
          ))}
        </div>

        {form.role !== 'admin' && (
          <>
            <label>Full name</label>
            <input value={form.name} onChange={set('name')} required placeholder={form.role === 'doctor' ? 'Dr. Jane Doe' : 'Jane Doe'} />
          </>
        )}

        <label>Email</label>
        <input type="email" value={form.email} onChange={set('email')} required />
        <label>Password (min 8 characters)</label>
        <input type="password" value={form.password} onChange={set('password')} required minLength={8} />

        {form.role === 'doctor' && (
          <>
            <label>Specialization</label>
            <input value={form.specialization} onChange={set('specialization')} required placeholder="Cardiology" />
            <label>Years of experience</label>
            <input type="number" min="0" max="70" value={form.experienceYears} onChange={set('experienceYears')} required />
            <label>Working hospital name</label>
            <input value={form.hospitalName} onChange={set('hospitalName')} required />
            <label>Hospital location</label>
            <input value={form.hospitalLocation} onChange={set('hospitalLocation')} required />
            <p className="muted small">Default working hours: Mon–Fri, 09:00–17:00 in 30-minute slots.</p>
          </>
        )}

        {form.role === 'patient' && (
          <>
            <label>Phone (optional)</label>
            <input value={form.phone} onChange={set('phone')} placeholder="9876543210" />
            <label>Date of birth (optional)</label>
            <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            <label>Gender (optional)</label>
            <select value={form.gender} onChange={set('gender')}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </>
        )}

        {form.role === 'admin' && (
          <>
            <label>Admin signup code</label>
            <input type="password" value={form.adminCode} onChange={set('adminCode')} required />
            <p className="muted small">Set as ADMIN_SIGNUP_CODE in server/.env</p>
          </>
        )}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Register'}
        </button>
        <p className="muted center">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
