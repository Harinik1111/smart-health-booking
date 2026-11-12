import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../../api/client';
import DoctorCard from './DoctorCard';

export default function DoctorDirectory() {
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/doctors')
      .then((res) => setDoctors(res.data.doctors))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  // Real-time filter by doctor name or specialization (runs on every keystroke)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) => d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q));
  }, [doctors, query]);

  if (loading) return <p className="muted">Loading doctors…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <>
      <input
        className="search"
        placeholder="Search by doctor name or specialization…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="muted">No doctors match “{query}”.</p>
      ) : (
        <div className="grid">
          {filtered.map((d) => (
            <DoctorCard key={d._id} doctor={d} onBook={(doc) => navigate(`/patient/book/${doc._id}`)} />
          ))}
        </div>
      )}
    </>
  );
}
