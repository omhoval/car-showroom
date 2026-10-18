import { Link } from 'react-router-dom';

const stats = [
  { label: 'New arrivals', value: '48', icon: '🚗' },
  { label: 'Bookings', value: '126', icon: '📋' },
  { label: 'Happy clients', value: '98%', icon: '⭐' },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen overflow-hidden bg-[#f6f4ef] lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_35%),linear-gradient(135deg,#0e1726_0%,#111827_35%,#0f172a_100%)] p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute -left-10 top-20 h-72 w-72 rounded-full bg-sky-400/30 blur-3xl" />
          <div className="absolute bottom-8 right-8 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/login" className="font-display text-2xl font-bold tracking-wide">Showroom</Link>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)]" />
            Live inventory
          </div>
        </div>

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
            Premium automotive management
          </div>
          <p className="max-w-xl font-display text-4xl font-bold leading-tight xl:text-5xl">From the first enquiry to the keys in hand.</p>
          <p className="mt-4 max-w-lg text-base text-white/70">Inventory, test drives, bookings and payments tracked in one clean control center.</p>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-slate-950/20 backdrop-blur-sm">
                <div className="mb-2 text-2xl">{item.icon}</div>
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-6">
          <div className="max-w-xs text-sm text-white/45">Car Showroom Management System</div>
          <div className="animate-float-slow flex items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 p-2 shadow-2xl shadow-slate-900/30 backdrop-blur-sm">
            <img
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=500&q=80"
              alt="Luxury car"
              className="h-28 w-40 rounded-[1.4rem] object-cover"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="relative w-full max-w-md">
          <div className="absolute -left-10 top-6 h-16 w-16 rounded-full bg-sky-200/80 blur-2xl" />
          <div className="absolute -right-10 bottom-8 h-20 w-20 rounded-full bg-indigo-200/80 blur-2xl" />

          <div className="relative rounded-[2rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Welcome back</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl shadow-inner shadow-sky-200">🔑</div>
            </div>

            {subtitle && <p className="mb-6 text-sm text-slate-600">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-sm text-slate-600">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
