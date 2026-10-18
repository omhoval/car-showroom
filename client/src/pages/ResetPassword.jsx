import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/Button';
import { authApi } from '../services/resources';
import { errorMessage } from '../utils/format';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (v) => {
    setBusy(true);
    setError('');
    try {
      await authApi.reset({ token: params.get('token'), password: v.password });
      toast.success('Password updated. Please log in.');
      nav('/login', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" footer={<Link className="font-semibold text-signal" to="/login">Back to log in</Link>}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</div>}
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input
            id="password" type="password" autoComplete="new-password" className="input"
            {...register('password', { required: 'Enter a password', pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: '8+ characters with upper, lower and a digit' } })}
          />
          {errors.password && <p className="mt-1 text-xs text-bad">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" loading={busy}>Update password</Button>
      </form>
    </AuthLayout>
  );
}
