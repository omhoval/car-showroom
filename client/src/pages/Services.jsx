import { useAuth } from '../context/AuthContext';
import CrudPage from '../components/CrudPage';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import useRun from '../hooks/useRun';
import { serviceApi } from '../services/resources';
import { can } from '../utils/permissions';
import { carName, date, label, money } from '../utils/format';

const TYPES = ['FREE_SERVICE', 'PAID_SERVICE', 'REPAIR', 'WARRANTY', 'PDI'];
const STATUS = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function Services() {
  const { user } = useAuth();
  const run = useRun();
  const manage = can(user.role, 'services:write');
  const move = (r, status, msg) => run(() => serviceApi.update(r._id, { status }), msg);

  return (
    <CrudPage
      title="Service"
      subtitle="After-sales service and pre-delivery inspections"
      queryKey="services"
      api={serviceApi}
      createLabel="Schedule service"
      canCreate={manage}
      canEdit={(r) => manage && !['COMPLETED', 'CANCELLED'].includes(r.status)}
      filters={[{ name: 'status', label: 'Status', options: STATUS }, { name: 'serviceType', label: 'Type', options: TYPES }]}
      fields={[
        { name: 'customerId', label: 'Customer', type: 'select', optionsKey: 'customers', required: true, createOnly: true },
        { name: 'carId', label: 'Car', type: 'select', optionsKey: 'cars', required: true, createOnly: true },
        { name: 'serviceType', label: 'Service type', type: 'select', options: TYPES, required: true, createOnly: true },
        { name: 'serviceDate', label: 'Service date', type: 'date', required: true },
        { name: 'technician', label: 'Technician' },
        { name: 'cost', label: 'Cost (₹)', type: 'number' },
        { name: 'remarks', label: 'Remarks', type: 'textarea', full: true },
      ]}
      columns={[
        { key: 'serviceDate', label: 'Date', sortKey: 'serviceDate', render: (r) => <span className="font-semibold">{date(r.serviceDate)}</span> },
        { key: 'car', label: 'Car', render: (r) => carName(r.carId) },
        { key: 'customer', label: 'Customer', render: (r) => r.customerId?.name },
        { key: 'serviceType', label: 'Type', render: (r) => label(r.serviceType) },
        { key: 'technician', label: 'Technician' },
        { key: 'cost', label: 'Cost', sortKey: 'cost', render: (r) => money(r.cost) },
        { key: 'status', label: 'Status', sortKey: 'status', render: (r) => <StatusBadge value={r.status} /> },
      ]}
      rowActions={(r) =>
        manage && (
          <>
            {r.status === 'SCHEDULED' && <Button size="sm" variant="ghost" onClick={() => move(r, 'IN_PROGRESS', 'Service started')}>Start</Button>}
            {r.status === 'IN_PROGRESS' && <Button size="sm" variant="ghost" onClick={() => move(r, 'COMPLETED', 'Service completed')}>Complete</Button>}
            {r.status === 'SCHEDULED' && <Button size="sm" variant="ghost" className="!text-bad hover:!bg-bad-soft" onClick={() => move(r, 'CANCELLED', 'Service cancelled')}>Cancel</Button>}
          </>
        )
      }
    />
  );
}
