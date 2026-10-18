import { label } from '../utils/format';

const GOOD = ['AVAILABLE', 'COMPLETED', 'CONFIRMED', 'SUCCESS', 'PAID', 'CONVERTED', 'DELIVERED', 'true'];
const WARN = ['PENDING', 'PARTIAL', 'RESERVED', 'FOLLOW_UP', 'IN_SERVICE', 'IN_PROGRESS', 'REFUND_DUE', 'NEGOTIATION'];
const BAD = ['CANCELLED', 'LOST', 'FAILED', 'NO_SHOW', 'SOLD', 'UNPAID', 'false'];
const INFO = ['SCHEDULED', 'NEW', 'CONTACTED', 'TEST_DRIVE', 'BOOKING', 'REFUNDED'];

export default function StatusBadge({ value }) {
  const v = String(value);
  let cls = 'bg-paper text-ink-3';
  if (GOOD.includes(v)) cls = 'bg-ok-soft text-ok';
  else if (WARN.includes(v)) cls = 'bg-amber-soft text-amber';
  else if (BAD.includes(v)) cls = 'bg-bad-soft text-bad';
  else if (INFO.includes(v)) cls = 'bg-signal-soft text-signal-dark';
  const text = v === 'true' ? 'Active' : v === 'false' ? 'Inactive' : label(v);
  return <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>;
}
