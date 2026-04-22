import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Package,
  UploadCloud,
  ShoppingCart,
  User,
  LogOut,
  Bell,
  Search,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// Sidebar links differ slightly by role; clients can't upload mockups.
const buildNav = (role) => {
  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/mockups', label: 'Mockups', icon: Package },
  ];
  if (role === 'designer') items.push({ to: '/mockups/new', label: 'Upload', icon: UploadCloud });
  items.push({ to: '/orders', label: 'Orders', icon: ShoppingCart });
  items.push({ to: '/profile', label: 'Profile', icon: User });
  return items;
};

const AppShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = buildNav(user?.role);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('q') || '');
  }, [location.search]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate(location.pathname, { replace: false });
      return;
    }
    navigate(`${location.pathname}?q=${encodeURIComponent(query)}`, { replace: false });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <Zap size={18} />
          </div>
          <span className="font-semibold">Kinetic Gallery</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="btn-ghost">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-20 bg-slate-900/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 max-w-[85vw] border-r bg-white transition-transform md:sticky md:top-0 md:z-10 md:block md:w-60 md:max-w-none md:shrink-0 md:min-h-screen ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        >
          <div className="flex items-center justify-between gap-2 border-b px-5 py-5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              <Zap size={18} />
            </div>
            <span className="font-semibold">Kinetic Gallery</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="btn-ghost md:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="hidden md:flex items-center gap-3 border-b bg-white px-6 py-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders, mockups..."
                className="input"
                style={{ paddingLeft: '2.5rem' }}
                aria-label="Search"
              />
            </form>
            <button className="btn-ghost" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold">{user?.name}</div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  {user?.role} Plan
                </div>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <button onClick={handleLogout} className="btn-ghost" title="Log out">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <div className="px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
