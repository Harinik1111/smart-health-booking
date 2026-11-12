import { useEffect, useState } from 'react';
import Tabs from '../../components/common/Tabs';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import api, { errMsg } from '../../api/client';
import { fmtSlot } from '../../utils/format';
import { format } from 'date-fns';

// Loads one admin endpoint and renders it as a table
function AdminList({ endpoint, field, columns, empty }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(endpoint)
      .then((res) => setRows(res.data[field]))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [endpoint, field]);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  return (
    <>
      <p className="muted small">{rows.length} record(s)</p>
      <DataTable columns={columns} rows={rows} empty={empty} />
    </>
  );
}

const doctorCols = [
  { header: 'Name', render: (d) => <strong>{d.name}</strong> },
  { header: 'Email', render: (d) => d.user?.email },
  { header: 'Specialization', render: (d) => d.specialization },
  { header: 'Experience', render: (d) => `${d.experienceYears} yrs` },
  { header: 'Hospital', render: (d) => `${d.hospitalName}, ${d.hospitalLocation}` },
  { header: 'Rating', render: (d) => `★ ${Number(d.rating).toFixed(1)}` },
];

const patientCols = [
  { header: 'Name', render: (p) => <strong>{p.name}</strong> },
  { header: 'Email', render: (p) => p.user?.email },
  { header: 'Phone', render: (p) => p.phone || '—' },
  { header: 'Gender', render: (p) => p.gender || '—' },
  { header: 'Joined', render: (p) => format(new Date(p.createdAt), 'dd MMM yyyy') },
];

const bookingCols = [
  { header: 'Patient → Doctor', render: (a) => <><strong>{a.patient_id?.name}</strong> → {a.doctor_id?.name}</> },
  { header: 'Specialization', render: (a) => a.doctor_id?.specialization },
  { header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
  { header: 'Slot time', render: (a) => fmtSlot(a.datetime) },
];

const auditCols = [
  { header: 'Cancelled at', render: (l) => format(new Date(l.timestamp), 'dd MMM yyyy, hh:mm a') },
  { header: 'Appointment slot', render: (l) => fmtSlot(l.appointmentDatetime) },
  { header: 'Cancelled by', render: (l) => <>{l.performedBy?.email} <span className={`role role-${l.performedByRole}`}>{l.performedByRole}</span></> },
  { header: 'Reason', render: (l) => l.reason },
  { header: 'Appointment ID', render: (l) => <code className="small">{l.appointment_id}</code> },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('bookings');
  return (
    <main className="container">
      <h2>Admin Dashboard</h2>
      <Tabs
        tabs={[
          { key: 'bookings', label: 'All bookings' },
          { key: 'doctors', label: 'Doctors' },
          { key: 'patients', label: 'Patients' },
          { key: 'audit', label: 'Cancellation log' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'bookings' && <AdminList endpoint="/admin/appointments" field="appointments" columns={bookingCols} empty="No bookings yet." />}
      {tab === 'doctors' && <AdminList endpoint="/admin/doctors" field="doctors" columns={doctorCols} empty="No doctors registered." />}
      {tab === 'patients' && <AdminList endpoint="/admin/patients" field="patients" columns={patientCols} empty="No patients registered." />}
      {tab === 'audit' && <AdminList endpoint="/admin/audit-logs" field="logs" columns={auditCols} empty="No cancellations recorded." />}
    </main>
  );
}
