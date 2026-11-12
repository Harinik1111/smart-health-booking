import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../../api/client';
import DoctorCard from '../../components/doctors/DoctorCard';
import SlotCalendar from '../../components/calendar/SlotCalendar';
import Modal from '../../components/common/Modal';
import { fmtSlot } from '../../utils/format';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api
      .get(`/doctors/${doctorId}`)
      .then((res) => setDoctor(res.data.doctor))
      .catch((e) => setLoadError(errMsg(e)));
  }, [doctorId]);

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/appointments', { doctorId, datetime: selected.start, reason });
      setSuccess(`Booked! ${fmtSlot(selected.start)}`);
      setSelected(null);
      setReason('');
      setRefreshKey((k) => k + 1); // slot disappears from the calendar
    } catch (e) {
      setError(errMsg(e));
      setRefreshKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return <main className="container"><div className="alert alert-error">{loadError}</div></main>;

  return (
    <main className="container">
      <Link to="/patient" className="back">← Back to doctors</Link>
      {doctor && <DoctorCard doctor={doctor} />}
      <p className="muted">
        Pick an available slot (30 minutes each). Limit: 2 appointments per doctor per week.
      </p>
      {success && <div className="alert alert-success">{success} — see it under “My appointments”.</div>}
      <SlotCalendar
        doctorId={doctorId}
        refreshKey={refreshKey}
        onSelectSlot={(slot) => {
          setSuccess('');
          setError('');
          setSelected(slot);
        }}
      />

      {selected && (
        <Modal title="Confirm appointment" onClose={() => setSelected(null)}>
          <p><strong>{doctor?.name}</strong><br />{fmtSlot(selected.start)}</p>
          <label>Reason for visit (optional)</label>
          <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          {error && <div className="alert alert-error">{error}</div>}
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Back</button>
            <button className="btn btn-primary" onClick={confirm} disabled={busy}>
              {busy ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        </Modal>
      )}
      {!selected && error && <div className="alert alert-error">{error}</div>}
    </main>
  );
}
