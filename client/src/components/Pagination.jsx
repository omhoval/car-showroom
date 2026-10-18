import Button from './Button';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return meta ? <p className="mt-3 text-xs text-ink-muted">{meta.total} record(s)</p> : null;
  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <span className="text-ink-muted">{meta.total} records · page {meta.page} of {meta.totalPages}</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
        <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}
