import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/resources';
import { label } from '../utils/format';
import Button from './Button';

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { data } = useQuery({ queryKey: ['unread'], queryFn: notificationApi.unread, refetchInterval: 30000 });
  const count = data?.count || 0;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/90 px-4 py-2.5 backdrop-blur lg:px-8">
      <button className="rounded p-1.5 hover:bg-paper lg:hidden" onClick={onMenu} aria-label="Open menu">☰</button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        <Link to="/notifications" className="relative rounded px-2 py-1 text-sm hover:bg-paper" aria-label={`Notifications, ${count} unread`}>
          Notifications
          {count > 0 && <span className="ml-1.5 rounded-full bg-bad px-1.5 py-0.5 text-[11px] font-semibold text-white">{count}</span>}
        </Link>
        <div className="text-right leading-tight">
          <div className="text-sm font-semibold">{user.name}</div>
          <div className="text-xs text-ink-muted">{label(user.role)}</div>
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>Log out</Button>
      </div>
    </header>
  );
}
