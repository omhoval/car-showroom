import useOptions from '../hooks/useOptions';

function SelectInput({ field, register, rules }) {
  const dynamic = useOptions(field.optionsKey);
  const options = field.optionsKey ? dynamic.options : field.options || [];
  return (
    <select className="input" {...register(field.name, rules)}>
      <option value="">{field.optionsKey && dynamic.isLoading ? 'Loading…' : 'Select…'}</option>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) } : o;
        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
      })}
    </select>
  );
}

export default function Field({ field, register, error }) {
  const rules = { required: field.required ? 'Required' : false };
  const common = { id: field.name, placeholder: field.placeholder, className: 'input' };

  let control;
  if (field.type === 'select') control = <SelectInput field={field} register={register} rules={rules} />;
  else if (field.type === 'textarea') control = <textarea rows={3} {...common} {...register(field.name, rules)} />;
  else if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-signal" {...register(field.name)} /> {field.label}
      </label>
    );
  } else {
    control = (
      <input
        type={field.type || 'text'}
        step={field.type === 'number' ? field.step || 'any' : undefined}
        autoComplete={field.type === 'password' ? 'new-password' : undefined}
        {...common}
        {...register(field.name, rules)}
      />
    );
  }

  return (
    <div className={field.full ? 'sm:col-span-2' : ''}>
      <label htmlFor={field.name} className="label">
        {field.label}
        {field.required && <span className="text-bad"> *</span>}
      </label>
      {control}
      {field.hint && !error && <p className="mt-1 text-xs text-ink-muted">{field.hint}</p>}
      {error && <p className="mt-1 text-xs text-bad">{error.message}</p>}
    </div>
  );
}
