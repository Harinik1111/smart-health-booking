import { useState } from 'react';
import Modal from './Modal';
import api, { errMsg } from '../../api/client';
import { CANCEL_HOURS } from '../../utils/constants';

export default function CancelModal({ appointmentId, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
      onDone();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Modal title="Cancel appointment" onClose={onClose}>
      <p className="muted">Cancellations are allowed up to {CANCEL_HOURS} hours before the appointment.</p>
      <label>Reason (optional)</label>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
      {error && <div className="alert alert-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>
          Keep appointment
        </button>
        <button className="btn btn-danger" onClick={submit} disabled={busy}>
          {busy ? 'Cancelling…' : 'Confirm cancel'}
        </button>
      </div>
    </Modal>
  );
}
