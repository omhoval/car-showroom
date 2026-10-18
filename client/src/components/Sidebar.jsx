import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const A = 'ADMIN', M = 'MANAGER', S = 'SALES_EXECUTIVE', C = 'CUSTOMER';

export const NAV = [
  { to: '/dashboard', label: 'Dashboard', roles: [A, M, S] },
  { to: '/cars', label: 'Cars', customerLabel: 'Browse cars', roles: [A, M, S, C] },
  { to: '/customers', label: 'Customers', roles: [A, M, S] },
  { to: '/leads', label: 'Leads', customerLabel: 'My enquiries', roles: [A, M, S, C] },
  { to: '/test-drives', label: 'Test drives', roles: [A, M, S, C] },
  { to: '/bookings', label: 'Bookings', roles: [A, M, S, C] },
  { to: '/payments', label: 'Payments', roles: [A, M, C] },
  { to: '/sales', label: 'Sales', customerLabel: 'Purchases', roles: [A, M, S, C] },
  { to: '/services', label: 'Service', roles: [A, M, S, C] },
  { to: '/reports', label: 'Reports', roles: [A, M] },
  { to: '/users', label: 'Employees', roles: [A] },
  { to: '/audit-logs', label: 'Audit log', roles: [A] },
  { to: '/profile', label: 'My profile', roles: [C] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = NAV.filter((n) => n.roles.includes(user.role));
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-ink text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-5">
          <div className="font-display text-xl font-bold tracking-tight">Showroom</div>
          <div className="text-xs text-ink-muted">Sales &amp; inventory</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-signal font-semibold text-white' : 'text-white/70 hover:bg-ink-3 hover:text-white'}`
              }
            >
              {user.role === C && n.customerLabel ? n.customerLabel : n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
