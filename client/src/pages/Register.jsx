import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/format';

const fields = [
  { name: 'name', label: 'Full name', type: 'text', rules: { required: 'Enter your name', minLength: { value: 2, message: 'Too short' } } },
  { name: 'email', label: 'Email', type: 'email', rules: { required: 'Enter your email' } },
  { name: 'phone', label: 'Mobile number', type: 'tel', rules: { required: 'Enter your mobile', pattern: { value: /^[6-9]\d{9}$/, message: '10-digit Indian mobile number' } } },
  {
    name: 'password', label: 'Password', type: 'password',
    rules: { required: 'Choose a password', pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: '8+ characters with upper, lower and a digit' } },
  },
];

export default function Register() {
  const { user, register: signup } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (user) return <Navigate to="/" replace />;

  const submit = async (v) => {
    setBusy(true);
    setError('');
    try {
      await signup(v);
      nav('/', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Browse cars, book test drives and track your purchase." footer={<>Already registered? <Link className="font-semibold text-signal" to="/login">Log in</Link></>}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        {error && <div role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</div>}
        {fields.map((f) => (
          <div key={f.name}>
            <label className="label" htmlFor={f.name}>{f.label}</label>
            <input id={f.name} type={f.type} className="input" {...register(f.name, f.rules)} />
            {errors[f.name] && <p className="mt-1 text-xs text-bad">{errors[f.name].message}</p>}
          </div>
        ))}
        <Button type="submit" className="w-full" loading={busy}>Create account</Button>
      </form>
    </AuthLayout>
  );
}
