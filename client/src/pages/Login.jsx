import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/format';

const featurePills = [
  { icon: '🚘', label: 'Inventory' },
  { icon: '🧾', label: 'Bookings' },
  { icon: '💳', label: 'Payments' },
];

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (user) return <Navigate to="/" replace />;

  const submit = async (v) => {
    setBusy(true);
    setError('');
    try {
      await login(v);
      nav(location.state?.from?.pathname || '/', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Use your showroom account."
      footer={<>New customer? <Link className="font-semibold text-sky-600" to="/register">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">{error}</div>}

        <div className="mb-4 flex flex-wrap gap-2">
          {featurePills.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
              <span>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" className="input" {...register('email', { required: 'Enter your email' })} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" {...register('password', { required: 'Enter your password' })} />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full shadow-lg shadow-sky-200/60" loading={busy}>Log in</Button>
        <div className="text-right text-sm"><Link className="font-medium text-sky-600 transition hover:text-sky-700" to="/forgot-password">Forgot password?</Link></div>
      </form>
    </AuthLayout>
  );
}
