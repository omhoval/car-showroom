import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import Field from './Field';
import Button from './Button';

export function buildPayload(fields, values) {
  const out = {};
  for (const f of fields) {
    let v = values[f.name];
    if (f.type === 'checkbox') {
      out[f.name] = Boolean(v);
      continue;
    }
    if (v === '' || v === undefined || v === null) continue;
    if (f.type === 'number') v = Number(v);
    if (f.type === 'datetime-local') v = new Date(v).toISOString();
    out[f.name] = v;
  }
  return out;
}

export default function FormModal({ open, title, fields, defaultValues = {}, submitLabel = 'Save', busy, onSubmit, onClose, intro }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues });

  useEffect(() => {
    if (open) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {intro && <p className="mb-4 text-sm text-ink-3">{intro}</p>}
      <form onSubmit={handleSubmit((v) => onSubmit(buildPayload(fields, v), v))} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.name} field={f} register={register} error={errors[f.name]} />
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
