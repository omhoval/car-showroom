import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { customerApi } from '../services/resources';
import { errorMessage } from '../utils/format';

const fields = [['name', 'Full name'], ['drivingLicense', 'Driving licence'], ['address', 'Address'], ['city', 'City'], ['state', 'State']];

export default function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['profile', user.customerId], queryFn: () => customerApi.get(user.customerId), enabled: Boolean(user.customerId) });
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { if (data) reset(data); }, [data, reset]);

  const save = useMutation({
    mutationFn: (v) => customerApi.update(user.customerId, Object.fromEntries(fields.map(([k]) => [k, v[k] || undefined]))),
    onSuccess: () => { toast.success('Profile saved'); qc.invalidateQueries({ queryKey: ['profile'] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="max-w-xl">
      <PageHeader title="My profile" subtitle={`${user.email} · ${data?.phone || ''}`} />
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="card space-y-4 p-5">
        {fields.map(([k, l]) => (
          <div key={k}><label className="label" htmlFor={k}>{l}</label><input id={k} className="input" {...register(k)} /></div>
        ))}
        <Button type="submit" loading={save.isPending}>Save changes</Button>
      </form>
    </div>
  );
}
