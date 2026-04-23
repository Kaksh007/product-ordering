import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, CheckCircle2, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

/* ── Skeleton primitives ─────────────────────────────────────────────── */
const Bone = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="card space-y-4">
    <div className="flex items-center justify-between">
      <Bone className="h-3 w-24" />
      <Bone className="h-5 w-12 rounded-full" />
    </div>
    <Bone className="h-8 w-20" />
    <Bone className="h-3 w-16" />
  </div>
);

const MockupCardSkeleton = () => (
  <div className="card overflow-hidden p-0">
    <Bone className="aspect-[4/3] w-full rounded-none" />
    <div className="space-y-2 p-4">
      <Bone className="h-4 w-3/4" />
      <Bone className="h-3 w-1/2" />
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <Bone className="h-8 w-56" />
        <Bone className="h-4 w-72" />
      </div>
      <Bone className="h-9 w-32 rounded-lg" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className="space-y-4">
      <Bone className="h-6 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => <MockupCardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

/* ── Stat card ───────────────────────────────────────────────────────── */
const StatCard = ({ label, value, hint, icon: Icon, badge }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <span className="label">{label}</span>
      {badge ? (
        <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100">{badge}</span>
      ) : (
        <Icon size={16} className="text-slate-400" />
      )}
    </div>
    <div className="mt-6 flex items-end gap-2">
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="pb-1 text-xs text-slate-500">{hint}</div>
    </div>
  </div>
);

/* ── Dashboard ───────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [mockups, setMockups] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fire all requests in parallel — for designers this used to be
        // 2 sequential round-trips; now everything lands in one pass.
        const requests = [api.get('/api/mockups'), api.get('/api/orders')];
        if (user.role === 'designer') requests.push(api.get('/api/orders/stats'));

        const [mockupsRes, ordersRes, statsRes] = await Promise.all(requests);

        setMockups(mockupsRes.data.mockups);
        setRecentOrders(ordersRes.data.orders.slice(0, 5));

        if (user.role === 'designer') {
          setStats(statsRes.data);
        } else {
          const orders = ordersRes.data.orders;
          setStats({
            totalMockups: mockupsRes.data.count,
            ordersReceived: orders.length,
            pendingOrders: orders.filter((o) =>
              ['pending', 'accepted', 'in_production', 'shipped'].includes(o.status)
            ).length,
            completedOrders: orders.filter((o) => o.status === 'completed').length,
            successRate:
              orders.length > 0
                ? Math.round(
                    (orders.filter((o) => o.status === 'completed').length / orders.length) * 100
                  )
                : 0,
          });
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.role]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Performance Overview</h1>
          <p className="text-sm text-slate-500">
            Track your packaging assets and supply chain status in real-time.
          </p>
        </div>
        {user.role === 'designer' ? (
          <Link to="/mockups/new" className="btn-secondary">
            <span className="text-lg">+</span> New Mockup
          </Link>
        ) : (
          <Link to="/mockups" className="btn-secondary">
            Browse Mockups
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Mockups"
          value={stats?.totalMockups ?? 0}
          hint="Assets"
          icon={Package}
          badge={<><TrendingUp size={12} className="mr-1" /> 12%</>}
        />
        <StatCard
          label={user.role === 'designer' ? 'Orders Received' : 'Orders Placed'}
          value={stats?.ordersReceived ?? 0}
          hint="Lifetime"
          icon={ShoppingBag}
        />
        <StatCard
          label="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          hint="Action Required"
          icon={BarChart2}
          badge={<><span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" /> Active</>}
        />
        <StatCard
          label="Completed Orders"
          value={stats?.completedOrders ?? 0}
          hint={`Success Rate ${stats?.successRate ?? 0}%`}
          icon={CheckCircle2}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Mockups</h2>
          <Link to="/mockups" className="text-sm font-semibold text-brand-600">
            View all →
          </Link>
        </div>
        {mockups.length === 0 ? (
          <div className="card text-center text-sm text-slate-500">
            No mockups yet.{' '}
            {user.role === 'designer' && (
              <Link to="/mockups/new" className="font-semibold text-brand-600">
                Upload your first mockup
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {mockups.slice(0, 4).map((m) => (
              <Link
                key={m._id}
                to={`/mockups`}
                className="card group overflow-hidden p-0 transition hover:-translate-y-0.5"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={m.imageUrl}
                    alt={m.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(m.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-brand-600">${m.price}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {recentOrders.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            <Link to="/orders" className="text-sm font-semibold text-brand-600">
              View all →
            </Link>
          </div>
          <>
            <div className="space-y-3 md:hidden">
              {recentOrders.map((o) => (
                <div key={o._id} className="card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{o.mockup?.name}</div>
                      <div className="mt-1 text-xs capitalize text-slate-500">
                        {o.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">${o.totalPrice.toFixed(2)}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>Qty: {o.quantity}</div>
                    <div className="text-right">{new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden card overflow-x-auto p-0 md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Mockup</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td className="px-4 py-3 font-medium">{o.mockup?.name}</td>
                      <td className="px-4 py-3">{o.quantity}</td>
                      <td className="px-4 py-3">${o.totalPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 capitalize">{o.status.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
