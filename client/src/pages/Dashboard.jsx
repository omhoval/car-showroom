import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/PageHeader';
import { dashboardApi } from '../services/resources';
import { label, money } from '../utils/format';

const COLORS = ['#2447f0', '#12805c', '#b87400', '#c23b3b', '#6b4bd8', '#0f8fa8', '#8b96a5', '#14181d'];
const shortMoney = (v) => (v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v);

function Stat({ title, value, tone }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-ink-muted">{title}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${tone || ''}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children, empty }) {
  return (
    <div className="card p-4">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      {empty ? <p className="py-10 text-center text-sm text-ink-muted">No data yet.</p> : <div className="h-64">{children}</div>}
    </div>
  );
}

const FEATURED_CARS = [
  { brand: 'Nexon', price: '₹12.5L', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80' },
  { brand: 'Creta', price: '₹19.5L', image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80' },
  { brand: 'XUV700', price: '₹24.5L', image: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=900&q=80' },
];

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  if (isLoading) return <p className="text-ink-muted">Loading dashboard…</p>;
  if (error) return <p className="text-bad">Could not load the dashboard.</p>;
  const { metrics: m, charts: c } = data;
  const funnel = c.leadFunnel.map((x) => ({ ...x, name: label(x.status) }));
  const inventory = c.inventory.map((x) => ({ ...x, name: label(x.status) }));
  const totalLeads = funnel.reduce((s, x) => s + x.count, 0);
  const converted = funnel.find((x) => x.status === 'CONVERTED')?.count || 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Showroom activity at a glance" />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {FEATURED_CARS.map((car, index) => (
          <div key={car.brand} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-44 overflow-hidden">
              <img src={car.image} alt={car.brand} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/70">Featured</div>
                  <div className="text-lg font-bold">{car.brand}</div>
                </div>
                <div className="rounded-full border border-white/25 bg-white/10 px-2 py-1 text-xs font-medium backdrop-blur-sm">{car.price}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat title="Total cars" value={m.totalCars} />
        <Stat title="Available" value={m.availableCars} tone="text-ok" />
        <Stat title="Reserved" value={m.reservedCars} tone="text-amber" />
        <Stat title="Sold" value={m.soldCars} />
        <Stat title="Customers" value={m.totalCustomers} />
        <Stat title="New leads" value={m.newLeads} />
        <Stat title="Follow-ups due" value={m.pendingFollowUps} tone={m.pendingFollowUps ? 'text-bad' : ''} />
        <Stat title="Test drives today" value={m.todaysTestDrives} />
        <Stat title="Total bookings" value={m.totalBookings} />
        <Stat title="Sales this month" value={m.monthlySales} />
        <Stat title="Revenue this month" value={money(m.monthlyRevenue)} />
        <Stat title="Lead conversion" value={totalLeads ? `${Math.round((converted / totalLeads) * 100)}%` : '-'} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Monthly sales">
          <ResponsiveContainer>
            <BarChart data={c.monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="sales" fill="#2447f0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Revenue by month">
          <ResponsiveContainer>
            <LineChart data={c.monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" /><YAxis tickFormatter={shortMoney} /><Tooltip formatter={(v) => money(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#12805c" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Cars sold by brand" empty={!c.soldByBrand.length}>
          <ResponsiveContainer>
            <BarChart data={c.soldByBrand} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="brand" width={110} /><Tooltip />
              <Bar dataKey="count" fill="#6b4bd8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Inventory status" empty={!inventory.length}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={inventory} dataKey="count" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {inventory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Lead pipeline" empty={!funnel.length}>
          <ResponsiveContainer>
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="count" fill="#0f8fa8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        {executiveChart(c)}
      </div>
    </div>
  );
}

function executiveChart(c) {
  if (!c.executivePerformance.length) return null;
  return (
    <Panel title="Sales executive performance">
      <ResponsiveContainer>
        <BarChart data={c.executivePerformance}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" /><YAxis yAxisId="l" allowDecimals={false} /><YAxis yAxisId="r" orientation="right" tickFormatter={shortMoney} />
          <Tooltip formatter={(v, n) => (n === 'Revenue' ? money(v) : v)} /><Legend />
          <Bar yAxisId="l" dataKey="sales" name="Sales" fill="#2447f0" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="r" dataKey="revenue" name="Revenue" fill="#b87400" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}
