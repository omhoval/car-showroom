import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CrudPage from '../components/CrudPage';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import useRun from '../hooks/useRun';
import { saleApi } from '../services/resources';
import { can, isStaff } from '../utils/permissions';
import { carName, date, money } from '../utils/format';

function Invoice({ sale, onClose }) {
  const taxable = sale.salePrice - sale.discount;
  const Row = ({ k, v, bold }) => (<div className={`flex justify-between py-1 text-sm ${bold ? 'border-t border-line pt-2 font-bold' : ''}`}><span>{k}</span><span>{v}</span></div>);
  return (
    <Modal open title="Invoice" onClose={onClose}>
      <div className="print-area">
        <div className="mb-4 flex justify-between">
          <div><div className="font-display text-xl font-bold">Showroom</div><div className="text-xs text-ink-muted">Tax invoice</div></div>
          <div className="text-right text-sm"><div className="font-semibold">{sale.invoiceNumber}</div><div>{date(sale.saleDate)}</div></div>
        </div>
        <div className="mb-4 text-sm">
          <div className="font-semibold">{sale.customerId?.name}</div>
          <div className="text-ink-muted">{[sale.customerId?.address, sale.customerId?.city, sale.customerId?.state].filter(Boolean).join(', ')}</div>
          <div className="text-ink-muted">{sale.customerId?.phone}</div>
        </div>
        <div className="mb-4 rounded-md bg-paper px-3 py-2 text-sm">{carName(sale.carId)} · {sale.carId?.color}<div className="text-xs text-ink-muted">VIN {sale.carId?.vin}</div></div>
        <Row k="Vehicle price" v={money(sale.salePrice, true)} />
        <Row k="Discount" v={`- ${money(sale.discount, true)}`} />
        <Row k="Taxable value" v={money(taxable, true)} />
        <Row k={`Tax (${sale.taxRatePercent}%)`} v={money(sale.tax, true)} />
        <Row k="Total" v={money(sale.finalAmount, true)} bold />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button onClick={() => window.print()}>Print</Button>
      </div>
    </Modal>
  );
}

export default function Sales() {
  const { user } = useAuth();
  const run = useRun();
  const [invoice, setInvoice] = useState(null);
  const [deliver, setDeliver] = useState(null);
  const staff = isStaff(user.role);

  return (
    <>
      <CrudPage
        title={staff ? 'Sales' : 'Purchases'}
        subtitle={staff ? 'Completed sales, invoices and deliveries' : 'Your purchase history'}
        queryKey="sales"
        api={saleApi}
        createLabel="Create sale"
        canCreate={staff}
        canEdit={false}
        searchPlaceholder="Search invoice number…"
        filters={[{ name: 'paymentStatus', label: 'Payment', options: ['UNPAID', 'PARTIAL', 'PAID'] }, { name: 'deliveryStatus', label: 'Delivery', options: ['PENDING', 'DELIVERED'] }]}
        fields={[
          { name: 'bookingId', label: 'Confirmed booking', type: 'select', optionsKey: 'confirmedBookings', required: true, full: true },
          { name: 'discount', label: 'Discount (₹)', type: 'number' },
          { name: 'salePrice', label: 'Override sale price (₹)', type: 'number', roles: ['ADMIN', 'MANAGER'] },
        ]}
        columns={[
          { key: 'invoiceNumber', label: 'Invoice', render: (r) => (<div><div className="font-semibold">{r.invoiceNumber}</div><div className="text-xs text-ink-muted">{date(r.saleDate)}</div></div>) },
          { key: 'customer', label: 'Customer', render: (r) => r.customerId?.name },
          { key: 'car', label: 'Car', render: (r) => carName(r.carId) },
          { key: 'finalAmount', label: 'Total', sortKey: 'finalAmount', render: (r) => money(r.finalAmount) },
          { key: 'paymentStatus', label: 'Payment', render: (r) => <StatusBadge value={r.paymentStatus} /> },
          { key: 'deliveryStatus', label: 'Delivery', render: (r) => (<div><StatusBadge value={r.deliveryStatus} />{r.deliveredAt && <div className="mt-1 text-xs text-ink-muted">{date(r.deliveredAt)}</div>}</div>) },
        ]}
        rowActions={(r) => (
          <>
            <Button size="sm" variant="ghost" onClick={() => setInvoice(r)}>Invoice</Button>
            {can(user.role, 'sales:deliver') && r.deliveryStatus === 'PENDING' && (
              <Button size="sm" disabled={r.paymentStatus !== 'PAID'} title={r.paymentStatus !== 'PAID' ? 'Delivery needs full payment' : undefined} onClick={() => setDeliver(r)}>Deliver</Button>
            )}
          </>
        )}
      />
      {invoice && <Invoice sale={invoice} onClose={() => setInvoice(null)} />}
      <ConfirmModal
        open={Boolean(deliver)}
        title="Hand over the vehicle"
        message={`Mark ${deliver ? carName(deliver.carId) : ''} as delivered to ${deliver?.customerId?.name || 'the customer'}?`}
        confirmLabel="Mark delivered"
        onClose={() => setDeliver(null)}
        onConfirm={async () => { if (await run(() => saleApi.deliver(deliver._id), 'Marked as delivered')) setDeliver(null); }}
      />
    </>
  );
}
