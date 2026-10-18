import CrudPage from '../components/CrudPage';
import { auditApi } from '../services/resources';
import { dateTime, label } from '../utils/format';

export default function AuditLogs() {
  return (
    <CrudPage
      title="Audit log"
      subtitle="Important actions across the system"
      queryKey="audit"
      api={auditApi}
      canCreate={false}
      canEdit={false}
      searchPlaceholder="Search…"
      filters={[{ name: 'entityType', label: 'Entity', options: ['USER', 'CAR', 'LEAD', 'BOOKING', 'PAYMENT', 'SALE'] }]}
      columns={[
        { key: 'createdAt', label: 'When', sortKey: 'createdAt', render: (r) => dateTime(r.createdAt) },
        { key: 'actor', label: 'Actor', render: (r) => (r.actorId ? `${r.actorId.name} (${label(r.actorRole)})` : 'System') },
        { key: 'action', label: 'Action', render: (r) => <span className="font-semibold">{label(r.action)}</span> },
        { key: 'entityType', label: 'Entity', render: (r) => label(r.entityType) },
        { key: 'changes', label: 'Details', render: (r) => <code className="text-xs text-ink-3">{r.changes ? JSON.stringify(r.changes) : ''}</code> },
      ]}
    />
  );
}
