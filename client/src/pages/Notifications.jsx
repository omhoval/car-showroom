import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { notificationApi } from '../services/resources';
import { dateTime } from '../utils/format';

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationApi.list({ limit: 50 }) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['unread'] }); };
  const items = data?.data || [];

  return (
    <div>
      <PageHeader title="Notifications">
        <Button variant="secondary" disabled={!items.some((n) => !n.isRead)} onClick={async () => { await notificationApi.readAll(); refresh(); }}>Mark all as read</Button>
      </PageHeader>
      <div className="card divide-y divide-line">
        {isLoading && <p className="p-4 text-sm text-ink-muted">Loading…</p>}
        {!isLoading && !items.length && <p className="p-10 text-center text-sm text-ink-muted">You're all caught up.</p>}
        {items.map((n) => (
          <div key={n._id} className={`flex items-start justify-between gap-4 px-4 py-3 ${n.isRead ? '' : 'bg-signal-soft/50'}`}>
            <div>
              <div className="text-sm font-semibold">{n.title}</div>
              {n.message && <div className="text-sm text-ink-3">{n.message}</div>}
              <div className="mt-0.5 text-xs text-ink-muted">{dateTime(n.createdAt)}</div>
            </div>
            {!n.isRead && <Button size="sm" variant="ghost" onClick={async () => { await notificationApi.read(n._id); refresh(); }}>Mark read</Button>}
          </div>
        ))}
      </div>
    </div>
  );
}
