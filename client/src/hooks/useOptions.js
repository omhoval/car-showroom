import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { carName } from '../utils/format';

const fetchList = (url, params) => api.get(url, { params: { limit: 100, ...params } }).then((r) => r.data.data);

const SOURCES = {
  customers: { load: () => fetchList('/customers'), map: (c) => ({ value: c._id, label: `${c.name} (${c.phone})` }) },
  cars: { load: () => fetchList('/cars'), map: (c) => ({ value: c._id, label: carName(c) }) },
  availableCars: { load: () => fetchList('/cars', { status: 'AVAILABLE' }), map: (c) => ({ value: c._id, label: `${carName(c)} - ${c.color}` }) },
  executives: { load: () => fetchList('/users', { role: 'SALES_EXECUTIVE', isActive: true }), map: (u) => ({ value: u._id, label: u.name }) },
  staff: { load: () => fetchList('/users', { role: 'SALES_EXECUTIVE,MANAGER', isActive: true }), map: (u) => ({ value: u._id, label: `${u.name} (${u.role === 'MANAGER' ? 'Manager' : 'Sales'})` }) },
  openBookings: {
    load: () => fetchList('/bookings', { status: 'PENDING,CONFIRMED,COMPLETED' }),
    map: (b) => ({ value: b._id, label: `${b.bookingNumber} - ${b.customerId?.name || ''}` }),
  },
  confirmedBookings: {
    load: () => fetchList('/bookings', { status: 'CONFIRMED' }),
    map: (b) => ({ value: b._id, label: `${b.bookingNumber} - ${b.customerId?.name || ''} - ${carName(b.carId)}` }),
  },
};

export default function useOptions(key) {
  const src = SOURCES[key];
  const { data = [], isLoading } = useQuery({
    queryKey: ['options', key],
    queryFn: src.load,
    staleTime: 30000,
    enabled: Boolean(src),
  });
  return { options: src ? data.map(src.map) : [], isLoading };
}
