import { useCallback, useEffect, useState } from 'react';
import Tabs from '../../components/common/Tabs';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import CancelModal from '../../components/common/CancelModal';
import Modal from '../../components/common/Modal';
import SlotCalendar from '../../components/calendar/SlotCalendar';
import api, { errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ageFrom, canCancel, fmtSlot, isFuture } from '../../utils/format';
import { CANCEL_HOURS } from '../../utils/constants';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const doctorId = user.profile?._id;
  const [tab, setTab] = useState('schedule');
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);
  const [detail, setDetail] = useState(null); // booked slot clicked on the calendar
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    api
      .get('/appointments/me')
      .then((res) => setAppointments(res.data.appointments))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const afterCancel = () => {
    setCancelId(null);
    setDetail(null);
    setRefreshKey((k) => k + 1);
    load();
  };

  const upcoming = appointments.filter((a) => a.status === 'booked' && isFuture(a.datetime)).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  const past = appointments.filter((a) => !(a.status === 'booked' && isFuture(a.datetime)));

  const columns = (withAction) => [
    {
      header: 'Patient',
      render: (a) => (
        <>
          <strong>{a.patient_id?.name}</strong>
          <div className="muted small">
            {[a.patient_id?.phone, a.patient_id?.gender, a.patient_id?.dateOfBirth ? `${ageFrom(a.patient_id.dateOfBirth)} yrs` : null].filter(Boolean).join(' · ') || '—'}
          </div>
        </>
      ),
    },
    { header: 'Booked slot', render: (a) => fmtSlot(a.datetime) },
    { header: 'Reason', render: (a) => a.reason || '—' },
    { header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    ...(withAction
      ? [{
          header: 'Action',
          render: (a) =>
            canCancel(a) ? (
              <button className="btn btn-danger btn-sm" onClick={() => setCancelId(a._id)}>Cancel</button>
            ) : (
              <span className="muted small">Locked (&lt; {CANCEL_HOURS}h)</span>
            ),
        }]
      : []),
  ];

  return (
    <main className="container">
      <h2>Doctor Dashboard</h2>
      <Tabs
        tabs={[
          { key: 'schedule', label: 'My schedule' },
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'past', label: 'Past & cancelled' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {error && <div className="alert alert-error">{error}</div>}

      {tab === 'schedule' && doctorId && (
        <SlotCalendar doctorId={doctorId} refreshKey={refreshKey} onSelectBooked={setDetail} onSelectSlot={() => {}} />
      )}
      {tab === 'upcoming' && (loading ? <p className="muted">Loading…</p> : <DataTable columns={columns(true)} rows={upcoming} empty="No upcoming appointments." />)}
      {tab === 'past' && (loading ? <p className="muted">Loading…</p> : <DataTable columns={columns(false)} rows={past} empty="No past appointments." />)}

      {detail && !cancelId && (
        <Modal title="Appointment details" onClose={() => setDetail(null)}>
          <p><strong>{detail.appointment?.patient?.name}</strong></p>
          <p className="muted">{detail.appointment?.patient?.phone || 'No phone on file'}</p>
          <p>{fmtSlot(detail.start)}</p>
          <p>Reason: {detail.appointment?.reason || '—'}</p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDetail(null)}>Close</button>
            {isFuture(detail.start) && (
              <button className="btn btn-danger" onClick={() => setCancelId(detail.appointment._id)}>Cancel appointment</button>
            )}
          </div>
        </Modal>
      )}
      {cancelId && <CancelModal appointmentId={cancelId} onClose={() => setCancelId(null)} onDone={afterCancel} />}
    </main>
  );
}
