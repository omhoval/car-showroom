const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inrExact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

export const money = (n, exact = false) => (n === undefined || n === null ? '-' : (exact ? inrExact : inr).format(n));
export const date = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
export const toLocalInput = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const label = (s) => (s ? String(s).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : '-');
export const carName = (c) => (c && c.brand ? `${c.brand} ${c.model}${c.variant ? ` ${c.variant}` : ''}` : '-');

export function errorMessage(err) {
  const d = err?.response?.data;
  if (d?.details?.length) return d.details.map((x) => `${x.field}: ${x.message}`).join(', ');
  return d?.message || err?.message || 'Something went wrong';
}
