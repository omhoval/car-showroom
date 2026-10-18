export default function Table({ columns, rows, loading, sort, onSort, empty = 'Nothing to show yet.' }) {
  const toggle = (key) => onSort && onSort(sort === key ? `-${key}` : key);
  const arrow = (key) => (sort === key ? ' ▲' : sort === `-${key}` ? ' ▼' : '');

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="th">
                {c.sortKey && onSort ? (
                  <button onClick={() => toggle(c.sortKey)} className="font-semibold hover:text-signal">
                    {c.label}{arrow(c.sortKey)}
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && !rows.length ? (
            <tr><td className="td text-ink-muted" colSpan={columns.length}>Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td className="td py-10 text-center text-ink-muted" colSpan={columns.length}>{empty}</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row._id} className="hover:bg-paper/50">
                {columns.map((c) => (
                  <td key={c.key} className="td">{c.render ? c.render(row) : row[c.key] ?? '-'}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
