import { Mail, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Profile = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile</h1>
        <p className="text-sm text-slate-500">Account details</p>
      </div>

      <div className="card max-w-xl">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="text-xl font-semibold">{user.name}</div>
            <div className="text-sm text-slate-500 capitalize">{user.role}</div>
          </div>
        </div>

        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <User size={16} className="mt-1 text-slate-400" />
            <div>
              <dt className="label">Full name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail size={16} className="mt-1 text-slate-400" />
            <div>
              <dt className="label">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield size={16} className="mt-1 text-slate-400" />
            <div>
              <dt className="label">Role</dt>
              <dd className="font-medium capitalize">{user.role}</dd>
            </div>
          </div>
          {user.createdAt && (
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
              <div>
                <dt className="label">Member since</dt>
                <dd className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</dd>
              </div>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default Profile;
