import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Palette, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { registerSchema, zodErrorsToFieldMap } from '../schemas/validation.js';
import FieldError from '../components/FieldError.jsx';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'designer',
    agree: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrorsToFieldMap(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      });
      toast.success(`Welcome, ${user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const RoleCard = ({ value, icon: Icon, label }) => {
    const active = form.role === value;
    return (
      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, role: value }))}
        className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-semibold transition ${
          active
            ? 'bg-brand-600 text-white border-brand-600 shadow'
            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
        }`}
      >
        <Icon size={20} />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white">
              <Zap size={20} />
            </div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-slate-500">Join the Kinetic Gallery ecosystem today.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                value={form.name}
                onChange={update('name')}
                placeholder="John Doe"
                className="input mt-1"
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="john@example.com"
                className="input mt-1"
              />
              <FieldError message={errors.email} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  className="input mt-1"
                />
                <FieldError message={errors.password} />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  placeholder="••••••••"
                  className="input mt-1"
                />
                <FieldError message={errors.confirmPassword} />
              </div>
            </div>

            <div>
              <div className="label">I am a...</div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <RoleCard value="designer" icon={Palette} label="Designer" />
                <RoleCard value="client" icon={Briefcase} label="Client" />
              </div>
              <FieldError message={errors.role} />
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={update('agree')}
                className="mt-0.5"
              />
              <span>
                By creating an account, I agree to the{' '}
                <span className="font-semibold text-brand-600">Terms of Service</span> and{' '}
                <span className="font-semibold text-brand-600">Privacy Policy</span>.
              </span>
            </label>
            <FieldError message={errors.agree} />

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 border-t pt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
