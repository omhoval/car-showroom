import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import CrudPage from '../components/CrudPage';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import useRun from '../hooks/useRun';
import { bookingApi, carApi, leadApi, testDriveApi } from '../services/resources';
import { can } from '../utils/permissions';
import { carName, label, money } from '../utils/format';

const FUEL = ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID'];
const GEARBOX = ['MANUAL', 'AUTOMATIC'];
const STATUS = ['AVAILABLE', 'RESERVED', 'SOLD', 'IN_SERVICE'];
const CAR_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
];

const resolveCarImage = (car, index = 0) => {
  const img = car.images?.find((i) => i.isPrimary)?.url || car.images?.[0]?.url || CAR_FALLBACK_IMAGES[index % CAR_FALLBACK_IMAGES.length];
  return img || CAR_FALLBACK_IMAGES[0];
};

const fields = [
  { name: 'brand', label: 'Brand', required: true },
  { name: 'model', label: 'Model', required: true },
  { name: 'variant', label: 'Variant', required: true },
  { name: 'manufacturingYear', label: 'Manufacturing year', type: 'number', step: 1, required: true },
  { name: 'fuelType', label: 'Fuel type', type: 'select', options: FUEL, required: true },
  { name: 'transmission', label: 'Transmission', type: 'select', options: GEARBOX, required: true },
  { name: 'color', label: 'Colour', required: true },
  { name: 'price', label: 'Price (₹)', type: 'number', required: true },
  { name: 'vin', label: 'VIN / chassis number', required: true, hint: '17 characters' },
  { name: 'registrationNumber', label: 'Registration number' },
  { name: 'engineNumber', label: 'Engine number' },
  { name: 'mileage', label: 'Mileage (km)', type: 'number' },
  { name: 'imageUrl', label: 'Image URL', type: 'url', full: true },
  { name: 'description', label: 'Description', type: 'textarea', full: true },
];

function StaffCars() {
  const { user } = useAuth();
  const run = useRun();
  const manage = can(user.role, 'cars:write');

  return (
    <CrudPage
      title="Cars"
      subtitle="Showroom inventory"
      queryKey="cars"
      api={carApi}
      createLabel="Add car"
      canCreate={manage}
      canEdit={(r) => manage && r.status !== 'SOLD'}
      canDelete={(r) => can(user.role, 'cars:delete') && !['SOLD', 'RESERVED'].includes(r.status)}
      fields={fields}
      searchPlaceholder="Search brand, model, VIN…"
      transformPayload={({ imageUrl, ...rest }) => (imageUrl ? { ...rest, images: [{ url: imageUrl, isPrimary: true }] } : rest)}
      filters={[
        { name: 'status', label: 'Status', options: STATUS },
        { name: 'fuelType', label: 'Fuel', options: FUEL },
        { name: 'transmission', label: 'Gearbox', options: GEARBOX },
      ]}
      columns={[
        { key: 'name', label: 'Car', sortKey: 'brand', render: (r) => (
          <div className="flex items-center gap-3">
            <img src={resolveCarImage(r)} alt={carName(r)} className="h-12 w-16 rounded-md object-cover shadow-sm" />
            <div>
              <div className="font-semibold">{carName(r)}</div>
              <div className="text-xs text-ink-muted">{r.vin}</div>
            </div>
          </div>
        ) },
        { key: 'manufacturingYear', label: 'Year', sortKey: 'manufacturingYear' },
        { key: 'fuelType', label: 'Fuel', render: (r) => label(r.fuelType) },
        { key: 'transmission', label: 'Gearbox', render: (r) => label(r.transmission) },
        { key: 'color', label: 'Colour' },
        { key: 'price', label: 'Price', sortKey: 'price', render: (r) => money(r.price) },
        { key: 'status', label: 'Status', sortKey: 'status', render: (r) => <StatusBadge value={r.status} /> },
      ]}
      rowActions={(r) =>
        can(user.role, 'cars:status') && ['AVAILABLE', 'IN_SERVICE'].includes(r.status) ? (
          <Button size="sm" variant="secondary" onClick={() => run(() => carApi.setStatus(r._id, r.status === 'AVAILABLE' ? 'IN_SERVICE' : 'AVAILABLE'), 'Status updated')}>
            {r.status === 'AVAILABLE' ? 'Send to workshop' : 'Mark available'}
          </Button>
        ) : null
      }
    />
  );
}

function Catalog() {
  const run = useRun();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fuel, setFuel] = useState('');
  const [active, setActive] = useState(null);
  const params = { page, limit: 9, search: search || undefined, fuelType: fuel || undefined };
  const { data } = useQuery({ queryKey: ['cars', params], queryFn: () => carApi.list(params), placeholderData: keepPreviousData });

  const modals = {
    enquire: {
      title: 'Send an enquiry', submit: 'Send enquiry', fields: [{ name: 'note', label: 'Message', type: 'textarea', full: true }],
      go: (b, car) => leadApi.create({ interestedCarId: car._id, note: b.note }), done: 'Enquiry sent. Our team will contact you.',
    },
    drive: {
      title: 'Book a test drive', submit: 'Book test drive',
      fields: [{ name: 'scheduledAt', label: 'Date and time', type: 'datetime-local', required: true, full: true }, { name: 'remarks', label: 'Remarks', type: 'textarea', full: true }],
      go: (b, car) => testDriveApi.create({ ...b, carId: car._id }), done: 'Test drive booked',
    },
    book: {
      title: 'Book this car', submit: 'Confirm booking',
      fields: [{ name: 'bookingAmount', label: 'Booking amount (₹)', type: 'number', required: true, full: true, hint: 'Token amount. Your booking is held for 48 hours until it is paid.' }],
      go: (b, car) => bookingApi.create({ ...b, carId: car._id }), done: 'Car booked. Pay the booking amount from the Bookings page.',
    },
  };
  const cfg = active && modals[active.type];

  return (
    <div>
      <PageHeader title="Browse cars" subtitle="Cars available at the showroom" />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search brand or model…" aria-label="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="input w-auto" aria-label="Fuel" value={fuel} onChange={(e) => { setFuel(e.target.value); setPage(1); }}>
          <option value="">Fuel: all</option>
          {FUEL.map((f) => <option key={f} value={f}>{label(f)}</option>)}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {(data?.data || []).map((c, index) => {
          const img = resolveCarImage(c, index);
          return (
            <article key={c._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-56 overflow-hidden bg-slate-100">
                <img src={img} alt={carName(c)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent p-3">
                  <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/90">{label(c.status)}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{carName(c)}</h3>
                    <p className="text-sm text-slate-500">{c.manufacturingYear} · {label(c.fuelType)} · {label(c.transmission)}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">{c.color}</span>
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-slate-900">{money(c.price)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setActive({ type: 'book', car: c })}>Book</Button>
                  <Button size="sm" variant="secondary" onClick={() => setActive({ type: 'drive', car: c })}>Test drive</Button>
                  <Button size="sm" variant="ghost" onClick={() => setActive({ type: 'enquire', car: c })}>Enquire</Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {data && !data.data.length && <p className="py-12 text-center text-ink-muted">No cars match your search.</p>}
      <Pagination meta={data?.meta} onPage={setPage} />
      {cfg && (
        <FormModal
          open
          title={`${cfg.title}: ${carName(active.car)}`}
          fields={cfg.fields}
          submitLabel={cfg.submit}
          onClose={() => setActive(null)}
          onSubmit={async (b) => { if (await run(() => cfg.go(b, active.car), cfg.done)) setActive(null); }}
        />
      )}
    </div>
  );
}

export default function Cars() {
  const { user } = useAuth();
  return user.role === 'CUSTOMER' ? <Catalog /> : <StaffCars />;
}
