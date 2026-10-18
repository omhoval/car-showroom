import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', busy, onConfirm, onClose, danger }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-ink-3">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
