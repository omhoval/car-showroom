import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/Button';
import { authApi } from '../services/resources';
import { errorMessage } from '../utils/format';

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (v) => {
    setBusy(true);
    setError('');
    try {
      const res = await authApi.forgot(v);
      setMessage(res.message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send a reset link if the email is registered." footer={<Link className="font-semibold text-signal" to="/login">Back to log in</Link>}>
      {message ? (
        <p className="rounded-md bg-ok-soft px-3 py-2 text-sm text-ok">{message}</p>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {error && <div role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</div>}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" {...register('email')} />
          </div>
          <Button type="submit" className="w-full" loading={busy}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
