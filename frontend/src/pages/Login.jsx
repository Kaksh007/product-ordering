import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Pencil, User, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { loginSchema, zodErrorsToFieldMap } from '../schemas/validation.js';
import FieldError from '../components/FieldError.jsx';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [role, setRole] = useState('designer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password, role });
    if (!parsed.success) {
      setErrors(zodErrorsToFieldMap(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.name}`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white">
              <Zap size={20} />
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-slate-500">Enter your details to access your creative workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <div className="label mb-2">Login as</div>
              <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setRole('designer')}
                  className={`flex items-center justify-center gap-2 rounded-md py-2 transition ${
                    role === 'designer' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                  }`}
                >
                  <Pencil size={16} /> Designer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`flex items-center justify-center gap-2 rounded-md py-2 transition ${
                    role === 'client' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                  }`}
                >
                  <User size={16} /> Client
                </button>
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative mt-1">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <FieldError message={errors.email} />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative mt-1">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in…' : 'Login →'}
            </button>
          </form>

          <div className="mt-6 border-t pt-4 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600">
              Create Account
            </Link>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> System Online
          </span>
          <span className="flex items-center gap-1.5">
            <Lock size={12} /> Secured Access
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
