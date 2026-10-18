import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CrudPage from '../components/CrudPage';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import useRun from '../hooks/useRun';
import { leadApi } from '../services/resources';
import { can } from '../utils/permissions';
import { carName, date, label } from '../utils/format';

const STATUS = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'TEST_DRIVE', 'NEGOTIATION', 'BOOKING', 'CONVERTED', 'LOST'];
const SOURCE = ['WALK_IN', 'WEBSITE', 'PHONE', 'REFERRAL', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'OTHER'];
const STAFF = ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'];

export default function Leads() {
  const { user } = useAuth();
  const run = useRun();
  const [action, setAction] = useState(null);
  const staff = STAFF.includes(user.role);
  const customer = !staff;

  const actionCfg = {
    assign: { title: 'Assign lead', fields: [{ name: 'employee', label: 'Employee', type: 'select', optionsKey: 'staff', required: true, full: true }], go: (b, r) => leadApi.assign(r._id, b.employee), done: 'Lead assigned' },
    note: { title: 'Add note', fields: [{ name: 'text', label: 'Note', type: 'textarea', required: true, full: true }], go: (b, r) => leadApi.addNote(r._id, b.text), done: 'Note added' },
  }[action?.type];

  return (
    <>
      <CrudPage
        title={customer ? 'My enquiries' : 'Leads'}
        subtitle={customer ? 'Cars you have asked us about' : 'Track enquiries from first contact to sale'}
        queryKey="leads"
        api={leadApi}
        createLabel={customer ? 'New enquiry' : 'Add lead'}
        canEdit={(r) => staff && !['CONVERTED', 'LOST', 'BOOKING'].includes(r.status)}
        canDelete={can(user.role, 'leads:delete')}
        filters={staff ? [{ name: 'status', label: 'Status', options: STATUS }, { name: 'source', label: 'Source', options: SOURCE }] : []}
        extraParams={undefined}
        fields={[
          { name: 'customerId', label: 'Customer', type: 'select', optionsKey: 'customers', required: true, createOnly: true, roles: STAFF },
          { name: 'interestedCarId', label: 'Interested car', type: 'select', optionsKey: 'cars', full: true },
          { name: 'source', label: 'Lead source', type: 'select', options: SOURCE, createOnly: true, roles: STAFF },
          { name: 'assignedEmployeeId', label: 'Assign to', type: 'select', optionsKey: 'staff', createOnly: true, roles: ['ADMIN', 'MANAGER'] },
          { name: 'note', label: customer ? 'Message' : 'Initial note', type: 'textarea', createOnly: true, full: true },
          { name: 'status', label: 'Move to status', type: 'select', options: ['CONTACTED', 'FOLLOW_UP', 'NEGOTIATION', 'LOST'], editOnly: true, roles: STAFF },
          { name: 'followUpDate', label: 'Follow-up date', type: 'date', editOnly: true, roles: STAFF, hint: 'Required for follow-up' },
          { name: 'lostReason', label: 'Reason lost', editOnly: true, roles: STAFF, hint: 'Required when marking lost' },
        ]}
        columns={[
          { key: 'customer', label: 'Customer', hidden: customer, render: (r) => (<div><div className="font-semibold">{r.customerId?.name}</div><div className="text-xs text-ink-muted">{r.customerId?.phone}</div></div>) },
          { key: 'car', label: 'Car', render: (r) => carName(r.interestedCarId) },
          { key: 'source', label: 'Source', render: (r) => label(r.source) },
          { key: 'status', label: 'Status', sortKey: 'status', render: (r) => <StatusBadge value={r.status} /> },
          { key: 'followUpDate', label: 'Follow-up', sortKey: 'followUpDate', render: (r) => date(r.followUpDate) },
          { key: 'assignee', label: 'Assigned to', render: (r) => r.assignedEmployeeId?.name || 'Unassigned' },
          { key: 'note', label: 'Latest note', render: (r) => <span className="line-clamp-2 max-w-[14rem] text-ink-3">{r.notes?.length ? r.notes[r.notes.length - 1].text : '-'}</span> },
        ].filter((c) => !c.hidden)}
        rowActions={(r) =>
          staff && (
            <>
              {can(user.role, 'leads:assign') && !['CONVERTED', 'LOST'].includes(r.status) && <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'assign', row: r })}>Assign</Button>}
              <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'note', row: r })}>Note</Button>
            </>
          )
        }
      />
      {actionCfg && (
        <FormModal
          open
          title={actionCfg.title}
          fields={actionCfg.fields}
          onClose={() => setAction(null)}
          onSubmit={async (b) => { if (await run(() => actionCfg.go(b, action.row), actionCfg.done)) setAction(null); }}
        />
      )}
    </>
  );
}
