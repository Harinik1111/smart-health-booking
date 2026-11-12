import { useCallback, useEffect, useState } from 'react';
import Tabs from '../../components/common/Tabs';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import CancelModal from '../../components/common/CancelModal';
import DoctorDirectory from '../../components/doctors/DoctorDirectory';
import api, { errMsg } from '../../api/client';
import { canCancel, fmtSlot } from '../../utils/format';
import { CANCEL_HOURS } from '../../utils/constants';

function MyAppointments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState(null);

  const load = useCallback(() => {
    api
      .get('/appointments/me')
      .then((res) => setRows(res.data.appointments))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const columns = [
    { header: 'Doctor', render: (a) => <><strong>{a.doctor_id?.name}</strong><div className="muted small">{a.doctor_id?.specialization}</div></> },
    { header: 'Hospital', render: (a) => `${a.doctor_id?.hospitalName}, ${a.doctor_id?.hospitalLocation}` },
    { header: 'Slot', render: (a) => fmtSlot(a.datetime) },
    { header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      header: 'Action',
      render: (a) =>
        canCancel(a) ? (
          <button className="btn btn-danger btn-sm" onClick={() => setCancelId(a._id)}>Cancel</button>
        ) : a.status === 'booked' ? (
          <span className="muted small">Locked (&lt; {CANCEL_HOURS}h)</span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} rows={rows} empty="You have no appointments yet. Find a doctor to book one." />
      {cancelId && (
        <CancelModal
          appointmentId={cancelId}
          onClose={() => setCancelId(null)}
          onDone={() => {
            setCancelId(null);
            load();
          }}
        />
      )}
    </>
  );
}

export default function PatientDashboard() {
  const [tab, setTab] = useState('doctors');
  return (
    <main className="container">
      <h2>Patient Dashboard</h2>
      <Tabs
        tabs={[
          { key: 'doctors', label: 'Find a doctor' },
          { key: 'appointments', label: 'My appointments' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'doctors' ? <DoctorDirectory /> : <MyAppointments />}
    </main>
  );
}
