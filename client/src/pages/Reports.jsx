import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/PageHeader';
import { reportApi } from '../services/resources';
import { label, money } from '../utils/format';

const TABS = [['sales', 'Sales'], ['inventory', 'Inventory'], ['employees', 'Employees']];

function Simple({ columns, rows }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead><tr>{columns.map((c) => <th key={c.key} className="th">{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((r, i) => (<tr key={i}>{columns.map((c) => <td key={c.key} className="td">{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)) : <tr><td className="td py-8 text-center text-ink-muted" colSpan={columns.length}>No data for this period.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

const Stat = ({ k, v }) => (<div className="card p-4"><div className="text-sm text-ink-muted">{k}</div><div className="mt-1 font-display text-2xl font-bold">{v}</div></div>);

function Sales({ params }) {
  const { data } = useQuery({ queryKey: ['report', 'sales', params], queryFn: () => reportApi.sales(params) });
  if (!data) return <p className="text-ink-muted">Loading…</p>;
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat k="Cars sold" v={data.summary.totalSales} />
        <Stat k="Revenue" v={money(data.summary.revenue)} />
        <Stat k="Discounts given" v={money(data.summary.discount)} />
        <Stat k="Tax collected" v={money(data.summary.tax)} />
      </div>
      {data.series.length > 0 && (
        <div className="card mb-4 h-64 p-4">
          <ResponsiveContainer>
            <BarChart data={data.series}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" /><YAxis allowDecimals={false} /><Tooltip formatter={(v, n) => (n === 'revenue' ? money(v) : v)} /><Bar dataKey="sales" fill="#2447f0" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <Simple rows={data.series} columns={[{ key: 'period', label: 'Period' }, { key: 'sales', label: 'Cars sold' }, { key: 'revenue', label: 'Revenue', render: (r) => money(r.revenue) }]} />
    </>
  );
}

function Inventory() {
  const { data } = useQuery({ queryKey: ['report', 'inventory'], queryFn: reportApi.inventory });
  if (!data) return <p className="text-ink-muted">Loading…</p>;
  const cols = [{ key: 'total', label: 'Total' }, { key: 'available', label: 'Available' }, { key: 'reserved', label: 'Reserved' }, { key: 'sold', label: 'Sold' }];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{data.byStatus.map((s) => <Stat key={s.status} k={label(s.status)} v={s.count} />)}</div>
      <div><h2 className="mb-2 font-bold">By brand</h2><Simple rows={data.byBrand} columns={[{ key: 'brand', label: 'Brand' }, ...cols]} /></div>
      <div><h2 className="mb-2 font-bold">By model</h2><Simple rows={data.byModel} columns={[{ key: 'brand', label: 'Brand' }, { key: 'model', label: 'Model' }, ...cols]} /></div>
    </div>
  );
}

function Employees({ params }) {
  const { data } = useQuery({ queryKey: ['report', 'employees', params], queryFn: () => reportApi.employees(params) });
  if (!data) return <p className="text-ink-muted">Loading…</p>;
  return <Simple rows={data} columns={[{ key: 'name', label: 'Employee' }, { key: 'role', label: 'Role', render: (r) => label(r.role) }, { key: 'leadsHandled', label: 'Leads' }, { key: 'testDrives', label: 'Test drives' }, { key: 'bookings', label: 'Bookings' }, { key: 'sales', label: 'Sales' }, { key: 'revenue', label: 'Revenue', render: (r) => money(r.revenue) }]} />;
}

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const params = { from: from || undefined, to: to || undefined, groupBy };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Sales, inventory and team performance" />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div role="tablist" className="flex gap-1 rounded-md bg-white p-1 ring-1 ring-line">
          {TABS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded px-3 py-1.5 text-sm font-medium ${tab === k ? 'bg-ink text-white' : 'text-ink-3 hover:bg-paper'}`}>{l}</button>
          ))}
        </div>
        {tab !== 'inventory' && (
          <div className="flex flex-wrap items-end gap-2">
            <div><label className="label" htmlFor="from">From</label><input id="from" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="label" htmlFor="to">To</label><input id="to" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            {tab === 'sales' && (
              <select aria-label="Group by" className="input w-auto" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="month">By month</option><option value="year">By year</option>
              </select>
            )}
          </div>
        )}
      </div>
      {tab === 'sales' && <Sales params={params} />}
      {tab === 'inventory' && <Inventory />}
      {tab === 'employees' && <Employees params={params} />}
    </div>
  );
}
