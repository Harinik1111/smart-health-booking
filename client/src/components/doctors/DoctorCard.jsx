export default function DoctorCard({ doctor, onBook }) {
  return (
    <div className="card doctor-card">
      <div className="doctor-head">
        <div className="avatar">{doctor.name.replace('Dr. ', '').charAt(0)}</div>
        <div>
          <h3>{doctor.name}</h3>
          <span className="spec">{doctor.specialization}</span>
        </div>
        <span className="rating">★ {Number(doctor.rating).toFixed(1)}</span>
      </div>
      <ul className="doctor-meta">
        <li>🎓 {doctor.experienceYears} years experience</li>
        <li>🏥 {doctor.hospitalName}</li>
        <li>📍 {doctor.hospitalLocation}</li>
      </ul>
      {onBook && (
        <button className="btn btn-primary" onClick={() => onBook(doctor)}>
          View slots &amp; book
        </button>
      )}
    </div>
  );
}
