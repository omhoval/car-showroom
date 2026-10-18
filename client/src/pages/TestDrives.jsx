import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CrudPage from '../components/CrudPage';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import useRun from '../hooks/useRun';
import { testDriveApi } from '../services/resources';
import { can } from '../utils/permissions';
import { carName, dateTime } from '../utils/format';

const STATUS = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const STAFF = ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'];

export default function TestDrives() {
  const { user } = useAuth();
  const run = useRun();
  const [cancelRow, setCancelRow] = useState(null);
  const staff = STAFF.includes(user.role);

  return (
    <>
      <CrudPage
        title="Test drives"
        subtitle={staff ? 'Scheduled and past test drives' : 'Your test drives'}
        queryKey="testDrives"
        api={testDriveApi}
        createLabel="Schedule test drive"
        canEdit={(r) => staff && r.status === 'SCHEDULED'}
        canDelete={can(user.role, 'testDrives:delete')}
        filters={[{ name: 'status', label: 'Status', options: STATUS }, { name: 'today', label: 'When', options: [{ value: 'true', label: 'Today' }] }]}
        fields={[
          { name: 'customerId', label: 'Customer', type: 'select', optionsKey: 'customers', required: true, createOnly: true, roles: STAFF },
          { name: 'carId', label: 'Car', type: 'select', optionsKey: 'availableCars', required: true, createOnly: true, full: true },
          { name: 'scheduledAt', label: 'Date and time', type: 'datetime-local', required: true },
          { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number', step: 15 },
          { name: 'salesExecutiveId', label: 'Sales executive', type: 'select', optionsKey: 'executives', roles: ['ADMIN', 'MANAGER'], hint: 'Leave blank to auto-assign' },
          { name: 'remarks', label: 'Remarks', type: 'textarea', full: true },
        ]}
        columns={[
          { key: 'scheduledAt', label: 'When', sortKey: 'scheduledAt', render: (r) => <span className="font-semibold">{dateTime(r.scheduledAt)}</span> },
          { key: 'customer', label: 'Customer', render: (r) => r.customerId?.name },
          { key: 'car', label: 'Car', render: (r) => carName(r.carId) },
          { key: 'exec', label: 'Sales executive', render: (r) => r.salesExecutiveId?.name },
          { key: 'durationMinutes', label: 'Minutes' },
          { key: 'status', label: 'Status', sortKey: 'status', render: (r) => <StatusBadge value={r.status} /> },
        ]}
        rowActions={(r) =>
          r.status === 'SCHEDULED' && (
            <>
              {staff && new Date(r.scheduledAt) <= new Date() && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => run(() => testDriveApi.update(r._id, { status: 'COMPLETED' }), 'Marked completed')}>Complete</Button>
                  <Button size="sm" variant="ghost" onClick={() => run(() => testDriveApi.update(r._id, { status: 'NO_SHOW' }), 'Marked no-show')}>No-show</Button>
                </>
              )}
              <Button size="sm" variant="ghost" className="!text-bad hover:!bg-bad-soft" onClick={() => setCancelRow(r)}>Cancel</Button>
            </>
          )
        }
      />
      <FormModal
        open={Boolean(cancelRow)}
        title="Cancel test drive"
        fields={[{ name: 'cancelReason', label: 'Reason', type: 'textarea', required: true, full: true }]}
        submitLabel="Cancel test drive"
        onClose={() => setCancelRow(null)}
        onSubmit={async (b) => { if (await run(() => testDriveApi.update(cancelRow._id, { status: 'CANCELLED', ...b }), 'Test drive cancelled')) setCancelRow(null); }}
      />
    </>
  );
}
