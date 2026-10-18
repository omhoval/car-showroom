import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CrudPage from '../components/CrudPage';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import useRun from '../hooks/useRun';
import { paymentApi } from '../services/resources';
import { can } from '../utils/permissions';
import { date, label, money } from '../utils/format';

const METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'FINANCE', 'ONLINE'];

export default function Payments() {
  const { user } = useAuth();
  const run = useRun();
  const [modal, setModal] = useState(null);
  const row = modal?.row;

  const modals = {
    verify: {
      title: `Verify ${row?.receiptNumber}`, submit: 'Save decision',
      fields: [{ name: 'decision', label: 'Decision', type: 'select', options: ['SUCCESS', 'FAILED'], required: true }, { name: 'remarks', label: 'Remarks' }],
      go: (b) => paymentApi.verify(row._id, b), done: 'Payment updated',
    },
    refund: {
      title: `Refund ${row?.receiptNumber}`, submit: 'Refund', intro: `Original payment: ${money(row?.amount, true)}`,
      fields: [{ name: 'amount', label: 'Refund amount (₹)', type: 'number', required: true }, { name: 'remarks', label: 'Remarks' }],
      defaults: { amount: row?.amount }, go: (b) => paymentApi.refund(row._id, b), done: 'Refund recorded',
    },
  };
  const cfg = modal && modals[modal.type];
  const manage = can(user.role, 'payments:verify');

  return (
    <>
      <CrudPage
        title="Payments"
        subtitle="Receipts and refunds for bookings"
        queryKey="payments"
        api={paymentApi}
        createLabel="Record payment"
        canEdit={false}
        filters={[{ name: 'status', label: 'Status', options: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] }, { name: 'kind', label: 'Type', options: ['PAYMENT', 'REFUND'] }, { name: 'paymentMethod', label: 'Method', options: METHODS }]}
        searchPlaceholder="Search receipt or transaction ID…"
        fields={[
          { name: 'bookingId', label: 'Booking', type: 'select', optionsKey: 'openBookings', required: true, full: true },
          { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
          { name: 'paymentMethod', label: 'Method', type: 'select', options: METHODS, required: true },
          { name: 'transactionId', label: 'Transaction ID', hint: 'Not needed for cash' },
          { name: 'remarks', label: 'Remarks' },
        ]}
        columns={[
          { key: 'receiptNumber', label: 'Receipt', render: (r) => (<div><div className="font-semibold">{r.receiptNumber}</div><div className="text-xs text-ink-muted">{date(r.paymentDate)}</div></div>) },
          { key: 'booking', label: 'Booking', render: (r) => r.bookingId?.bookingNumber },
          { key: 'customer', label: 'Customer', render: (r) => r.customerId?.name },
          { key: 'kind', label: 'Type', render: (r) => label(r.kind) },
          { key: 'paymentMethod', label: 'Method', render: (r) => label(r.paymentMethod) },
          { key: 'amount', label: 'Amount', sortKey: 'amount', render: (r) => <span className={r.kind === 'REFUND' ? 'text-bad' : ''}>{r.kind === 'REFUND' ? '-' : ''}{money(r.amount, true)}</span> },
          { key: 'status', label: 'Status', sortKey: 'status', render: (r) => <StatusBadge value={r.status} /> },
        ]}
        rowActions={(r) =>
          manage && r.kind === 'PAYMENT' && (
            <>
              {r.status === 'PENDING' && <Button size="sm" onClick={() => setModal({ type: 'verify', row: r })}>Verify</Button>}
              {r.status === 'SUCCESS' && <Button size="sm" variant="secondary" onClick={() => setModal({ type: 'refund', row: r })}>Refund</Button>}
            </>
          )
        }
      />
      {cfg && (
        <FormModal
          open
          title={cfg.title}
          intro={cfg.intro}
          fields={cfg.fields}
          defaultValues={cfg.defaults || {}}
          submitLabel={cfg.submit}
          onClose={() => setModal(null)}
          onSubmit={async (b) => { if (await run(() => cfg.go(b), cfg.done)) setModal(null); }}
        />
      )}
    </>
  );
}
