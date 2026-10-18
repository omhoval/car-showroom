import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import { errorMessage, toLocalInput } from '../utils/format';
import PageHeader from './PageHeader';
import Table from './Table';
import Pagination from './Pagination';
import Button from './Button';
import FormModal from './FormModal';
import ConfirmModal from './ConfirmModal';

function toFormValues(fields, row) {
  const v = {};
  for (const f of fields) {
    let x = row[f.name];
    if (x && typeof x === 'object' && !Array.isArray(x) && x._id) x = x._id;
    if (f.type === 'datetime-local') x = toLocalInput(x);
    else if (f.type === 'date') x = x ? String(x).slice(0, 10) : '';
    else if (f.type === 'select' && Array.isArray(f.options) && !f.options.includes(x)) x = '';
    v[f.name] = x ?? (f.type === 'checkbox' ? false : '');
  }
  return v;
}

export default function CrudPage({
  title, subtitle, queryKey, api, columns, filters = [], fields = [], createLabel = 'Add new',
  canCreate = true, canEdit = true, canDelete = false, rowActions, headerActions, extraParams,
  transformPayload, createDefaults = {}, searchPlaceholder = 'Search…', empty, pageSize = 10, children,
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const debounced = useDebounce(search);

  const visible = useMemo(() => fields.filter((f) => !f.roles || f.roles.includes(user.role)), [fields, user.role]);
  const createFields = visible.filter((f) => !f.editOnly);
  const editFields = visible.filter((f) => !f.createOnly);

  const params = { page, limit: pageSize, sort: sort || undefined, search: debounced || undefined, ...filterValues, ...extraParams };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => api.list(params),
    placeholderData: keepPreviousData,
  });
  const reload = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const onError = (e) => toast.error(errorMessage(e));
  const createMut = useMutation({
    mutationFn: (body) => api.create(transformPayload ? transformPayload(body, 'create') : body),
    onSuccess: () => { toast.success('Created'); setCreating(false); reload(); qc.invalidateQueries({ queryKey: ['options'] }); },
    onError,
  });
  const updateMut = useMutation({
    mutationFn: ({ id, body }) => api.update(id, transformPayload ? transformPayload(body, 'update') : body),
    onSuccess: () => { toast.success('Saved'); setEditing(null); reload(); },
    onError,
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.remove(id),
    onSuccess: () => { toast.success('Deleted'); setDeleting(null); reload(); qc.invalidateQueries({ queryKey: ['options'] }); },
    onError,
  });

  const allColumns = [
    ...columns,
    ...(rowActions || canEdit || canDelete
      ? [{
          key: '_actions',
          label: '',
          render: (row) => (
            <div className="flex flex-wrap justify-end gap-1.5">
              {rowActions && rowActions(row, { reload })}
              {canEdit && (typeof canEdit === 'function' ? canEdit(row) : true) && (
                <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>Edit</Button>
              )}
              {canDelete && (typeof canDelete === 'function' ? canDelete(row) : true) && (
                <Button size="sm" variant="ghost" className="!text-bad hover:!bg-bad-soft" onClick={() => setDeleting(row)}>Delete</Button>
              )}
            </div>
          ),
        }]
      : []),
  ];

  const set = (name, value) => { setFilterValues((p) => ({ ...p, [name]: value || undefined })); setPage(1); };

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}>
        {headerActions}
        {canCreate && <Button onClick={() => setCreating(true)}>{createLabel}</Button>}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder={searchPlaceholder}
          aria-label="Search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {filters.map((f) => (
          <select key={f.name} aria-label={f.label} className="input w-auto" value={filterValues[f.name] || ''} onChange={(e) => set(f.name, e.target.value)}>
            <option value="">{f.label}: all</option>
            {f.options.map((o) => (
              <option key={o.value ?? o} value={o.value ?? o}>
                {o.label ?? String(o).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        ))}
        {isFetching && <span className="text-xs text-ink-muted">Updating…</span>}
      </div>

      {children}
      <Table columns={allColumns} rows={data?.data || []} loading={isLoading} sort={sort} onSort={setSort} empty={empty} />
      <Pagination meta={data?.meta} onPage={setPage} />

      <FormModal
        open={creating}
        title={`${createLabel}`}
        fields={createFields}
        defaultValues={createDefaults}
        busy={createMut.isPending}
        onClose={() => setCreating(false)}
        onSubmit={(body) => createMut.mutate(body)}
      />
      <FormModal
        open={Boolean(editing)}
        title={`Edit ${title.toLowerCase()}`}
        fields={editFields}
        defaultValues={editing ? toFormValues(editFields, editing) : {}}
        busy={updateMut.isPending}
        onClose={() => setEditing(null)}
        onSubmit={(body) => updateMut.mutate({ id: editing._id, body })}
      />
      <ConfirmModal
        open={Boolean(deleting)}
        danger
        title="Delete record"
        message="This will remove the record from all lists. This cannot be undone from the app."
        confirmLabel="Delete"
        busy={deleteMut.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMut.mutate(deleting._id)}
      />
    </div>
  );
}
