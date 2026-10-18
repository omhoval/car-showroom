import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import CrudPage from '../components/CrudPage';
import Modal from '../components/Modal';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { customerApi } from '../services/resources';
import { can } from '../utils/permissions';
import { carName, date, dateTime, money } from '../utils/format';

function Section({ title, rows, render }) {
  return (
    <section className="mb-4">
      <h3 className="mb-1 text-sm font-bold">{title} <span className="font-normal text-ink-muted">({rows.length})</span></h3>
      {rows.length ? <ul className="divide-y divide-line rounded-md border border-line text-sm">{rows.map((r) => <li key={r._id} className="flex flex-wrap justify-between gap-2 px-3 py-2">{render(r)}</li>)}</ul> : <p className="text-sm text-ink-muted">None</p>}
    </section>
  );
}

function History({ customer, onClose }) {
  const { data, isLoading } = useQuery({ queryKey: ['history', customer._id], queryFn: () => customerApi.history(customer._id) });
  return (
    <Modal open title={`${customer.name} - history`} onClose={onClose} wide>
      {isLoading || !data ? <p className="text-ink-muted">Loading…</p> : (
        <>
          <Section title="Enquiries" rows={data.leads} render={(r) => (<><span>{carName(r.interestedCarId)}</span><StatusBadge value={r.status} /></>)} />
          <Section title="Test drives" rows={data.testDrives} render={(r) => (<><span>{carName(r.carId)} · {dateTime(r.scheduledAt)}</span><StatusBadge value={r.status} /></>)} />
          <Section title="Bookings" rows={data.bookings} render={(r) => (<><span>{r.bookingNumber} · {carName(r.carId)}</span><span><StatusBadge value={r.status} /></span></>)} />
          <Section title="Payments" rows={data.payments} render={(r) => (<><span>{r.receiptNumber} · {date(r.paymentDate)}</span><span>{r.kind === 'REFUND' ? '-' : ''}{money(r.amount)} <StatusBadge value={r.status} /></span></>)} />
          <Section title="Purchases" rows={data.sales} render={(r) => (<><span>{r.invoiceNumber} · {carName(r.carId)}</span><span>{money(r.finalAmount)}</span></>)} />
        </>
      )}
    </Modal>
  );
}

export default function Customers() {
  const { user } = useAuth();
  const [view, setView] = useState(null);
  const manager = can(user.role, 'customers:delete');

  return (
    <>
      <CrudPage
        title="Customers"
        queryKey="customers"
        api={customerApi}
        createLabel="Add customer"
        canDelete={manager}
        searchPlaceholder="Search name, phone, email, city…"
        fields={[
          { name: 'name', label: 'Name', required: true },
          { name: 'phone', label: 'Mobile', type: 'tel', required: true },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'drivingLicense', label: 'Driving licence' },
          { name: 'address', label: 'Address', full: true },
          { name: 'city', label: 'City' },
          { name: 'state', label: 'State' },
          { name: 'assignedSalesExecutive', label: 'Assigned sales executive', type: 'select', optionsKey: 'executives', roles: ['ADMIN', 'MANAGER'] },
        ]}
        columns={[
          { key: 'name', label: 'Name', sortKey: 'name', render: (r) => <span className="font-semibold">{r.name}</span> },
          { key: 'phone', label: 'Mobile' },
          { key: 'email', label: 'Email' },
          { key: 'city', label: 'City', sortKey: 'city' },
          { key: 'exec', label: 'Sales executive', render: (r) => r.assignedSalesExecutive?.name || '-' },
          { key: 'createdAt', label: 'Added', sortKey: 'createdAt', render: (r) => date(r.createdAt) },
        ]}
        rowActions={(r) => <Button size="sm" variant="ghost" onClick={() => setView(r)}>History</Button>}
      />
      {view && <History customer={view} onClose={() => setView(null)} />}
    </>
  );
}
