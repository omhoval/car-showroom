import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CrudPage from '../components/CrudPage';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import useRun from '../hooks/useRun';
import { bookingApi, paymentApi, saleApi } from '../services/resources';
import { carName, date, money } from '../utils/format';
import { isManager, isStaff } from '../utils/permissions';

const STATUS = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'FINANCE', 'ONLINE'];

export default function Bookings() {
  const { user } = useAuth();
  const run = useRun();
  const [modal, setModal] = useState(null);
  const staff = isStaff(user.role);
  const manager = isManager(user.role);
  const row = modal?.row;
  const due = row ? Math.max(row.payableAmount - row.paidAmount, 0) : 0;

  const modals = {
    pay: {
      title: `Pay for ${row?.bookingNumber}`,
      submit: staff ? 'Record payment' : 'Submit payment',
      intro: staff ? `Amount due: ${money(due, true)}` : `Amount due: ${money(due, true)}. Staff will verify your payment before it is counted.`,
      fields: [
        { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
        { name: 'paymentMethod', label: 'Method', type: 'select', options: METHODS, required: true },
        { name: 'transactionId', label: 'Transaction ID', hint: 'Not needed for cash' },
        { name: 'remarks', label: 'Remarks' },
      ],
      defaults: { amount: due, paymentMethod: 'UPI' },
      go: (b) => paymentApi.create({ ...b, bookingId: row._id }),
      done: staff ? 'Payment recorded' : 'Payment submitted for verification',
    },
    cancel: {
      title: `Cancel ${row?.bookingNumber}`,
      submit: 'Cancel booking',
      intro: row?.paidAmount > 0 ? 'Payments already made will be marked as refund due.' : undefined,
      fields: [{ name: 'cancelReason', label: 'Reason', type: 'textarea', required: true, full: true }],
      defaults: {},
      go: (b) => bookingApi.update(row._id, { status: 'CANCELLED', ...b }),
      done: 'Booking cancelled',
    },
    sale: {
      title: `Create sale for ${row?.bookingNumber}`,
      submit: 'Create sale',
      intro: `Agreed price ${money(row?.totalPrice)}. Tax is added automatically.`,
      fields: [
        { name: 'discount', label: 'Discount (₹)', type: 'number' },
        ...(manager ? [{ name: 'salePrice', label: 'Override sale price (₹)', type: 'number' }] : []),
      ],
      defaults: {},
      go: (b) => saleApi.create({ ...b, bookingId: row._id }),
      done: 'Sale created',
    },
  };
  const cfg = modal && modals[modal.type];

  return (
    <>
      <CrudPage
        title="Bookings"
        subtitle={staff ? 'Reserve a car, collect payments and complete the sale' : 'Your car bookings'}
        queryKey="bookings"
        api={bookingApi}
        createLabel="New booking"
        canEdit={false}
        filters={[{ name: 'status', label: 'Status', options: STATUS }, { name: 'paymentStatus', label: 'Payment', options: ['UNPAID', 'PARTIAL', 'PAID', 'REFUND_DUE', 'REFUNDED'] }]}
        searchPlaceholder="Search booking number…"
        fields={[
          { name: 'customerId', label: 'Customer', type: 'select', optionsKey: 'customers', required: true, roles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'] },
          { name: 'carId', label: 'Car', type: 'select', optionsKey: 'availableCars', required: true },
          { name: 'bookingAmount', label: 'Booking amount (₹)', type: 'number', required: true },
          { name: 'totalPrice', label: 'Agreed price (₹)', type: 'number', roles: ['ADMIN', 'MANAGER'], hint: 'Blank uses the list price' },
          { name: 'salesExecutiveId', label: 'Sales executive', type: 'select', optionsKey: 'executives', roles: ['ADMIN', 'MANAGER'] },
          { name: 'expectedDeliveryDate', label: 'Expected delivery', type: 'date', roles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'] },
        ]}
        columns={[
          { key: 'bookingNumber', label: 'Booking', render: (r) => (<div><div className="font-semibold">{r.bookingNumber}</div><div className="text-xs text-ink-muted">{date(r.bookingDate)}</div></div>) },
          { key: 'customer', label: 'Customer', render: (r) => r.customerId?.name },
          { key: 'car', label: 'Car', render: (r) => carName(r.carId) },
          { key: 'totalPrice', label: 'Total', sortKey: 'totalPrice', render: (r) => money(r.payableAmount) },
          { key: 'paid', label: 'Paid', render: (r) => money(r.paidAmount) },
          { key: 'paymentStatus', label: 'Payment', render: (r) => <StatusBadge value={r.paymentStatus} /> },
          { key: 'status', label: 'Status', sortKey: 'status', render: (r) => (<div><StatusBadge value={r.status} />{r.status === 'PENDING' && r.expiresAt && <div className="mt-1 text-xs text-ink-muted">Held until {date(r.expiresAt)}</div>}</div>) },
        ]}
        rowActions={(r) => (
          <>
            {r.status !== 'CANCELLED' && r.payableAmount - r.paidAmount > 0 && <Button size="sm" onClick={() => setModal({ type: 'pay', row: r })}>Pay</Button>}
            {staff && r.status === 'CONFIRMED' && <Button size="sm" variant="secondary" onClick={() => setModal({ type: 'sale', row: r })}>Create sale</Button>}
            {['PENDING', 'CONFIRMED'].includes(r.status) && <Button size="sm" variant="ghost" className="!text-bad hover:!bg-bad-soft" onClick={() => setModal({ type: 'cancel', row: r })}>Cancel</Button>}
          </>
        )}
      />
      {cfg && (
        <FormModal
          open
          title={cfg.title}
          intro={cfg.intro}
          fields={cfg.fields}
          defaultValues={cfg.defaults}
          submitLabel={cfg.submit}
          onClose={() => setModal(null)}
          onSubmit={async (b) => { if (await run(() => cfg.go(b), cfg.done)) setModal(null); }}
        />
      )}
    </>
  );
}
