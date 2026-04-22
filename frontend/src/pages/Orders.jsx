import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const STATUSES = ['pending', 'accepted', 'in_production', 'shipped', 'completed', 'cancelled'];
const POLL_INTERVAL_MS = 5000;

// Hashes the orders list so we can detect status changes and surface them as toasts.
const fingerprint = (orders) =>
  JSON.stringify(orders.map((o) => [o._id, o.status]).sort((a, b) => a[0].localeCompare(b[0])));

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const prevRef = useRef({});
  const [searchParams] = useSearchParams();
  const isDesigner = user.role === 'designer';
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const load = async (silent = false) => {
    try {
      const { data } = await api.get('/api/orders');
      const nextOrders = data.orders;

      // Diff: if a status changed since the last poll, toast the user.
      const prev = prevRef.current;
      if (Object.keys(prev).length > 0) {
        nextOrders.forEach((o) => {
          if (prev[o._id] && prev[o._id] !== o.status) {
            toast.success(
              `Order #${o._id.slice(-6)} → ${o.status.replace('_', ' ')}`,
              { id: `status-${o._id}-${o.status}` }
            );
          }
        });
      }
      prevRef.current = Object.fromEntries(nextOrders.map((o) => [o._id, o.status]));

      setOrders(nextOrders);
      setLastUpdated(new Date(data.serverTime || Date.now()));
    } catch (err) {
      if (!silent) toast.error(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load + polling loop. Pauses while the tab is hidden.
  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      await load(true);
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await api.delete(`/api/orders/${orderId}`);
      await load(true);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const visibleOrders = query
    ? orders.filter((o) => {
        const mockupName = o.mockup?.name || '';
        const category = o.mockup?.category || '';
        const otherParty = isDesigner ? o.client?.name || '' : o.mockup?.designer?.name || '';
        const status = o.status || '';
        return `${mockupName} ${category} ${otherParty} ${status}`.toLowerCase().includes(query);
      })
    : orders;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
          <p className="text-sm text-slate-500">
            {isDesigner
              ? 'Manage incoming orders on your mockups'
              : 'Track orders you have placed'}
          </p>
        </div>
        <div className="text-xs text-slate-400">
          {lastUpdated
            ? `Auto-refreshing · Updated ${lastUpdated.toLocaleTimeString()}`
            : 'Loading…'}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : visibleOrders.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          {query ? 'No orders match your search.' : 'No orders yet.'}
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {visibleOrders.map((o) => (
              <div key={o._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={o.mockup?.imageUrl}
                    alt=""
                    className="h-14 w-20 rounded-md object-cover bg-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{o.mockup?.name}</div>
                    <div className="text-xs text-slate-500">{o.mockup?.category}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {isDesigner ? 'Client' : 'Designer'}: {isDesigner ? o.client?.name : o.mockup?.designer?.name}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">Qty</div>
                    <div className="font-semibold">{o.quantity}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="font-semibold">${o.totalPrice.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusBadge status={o.status} />
                  <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="mt-3">
                  {isDesigner ? (
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o._id, e.target.value)}
                      className="input !py-2 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  ) : (
                    o.status === 'pending' && (
                      <button
                        onClick={() => cancelOrder(o._id)}
                        className="btn-ghost w-full justify-center text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Cancel Order
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden card overflow-x-auto p-0 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mockup</th>
                  <th className="px-4 py-3 text-left">{isDesigner ? 'Client' : 'Designer'}</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Placed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleOrders.map((o) => (
                  <tr key={o._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={o.mockup?.imageUrl}
                          alt=""
                          className="h-10 w-14 rounded-md object-cover bg-slate-100"
                        />
                        <div>
                          <div className="font-semibold">{o.mockup?.name}</div>
                          <div className="text-xs text-slate-500">{o.mockup?.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isDesigner ? o.client?.name : o.mockup?.designer?.name}
                    </td>
                    <td className="px-4 py-3">{o.quantity}</td>
                    <td className="px-4 py-3 font-semibold">${o.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isDesigner ? (
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o._id, e.target.value)}
                          className="input !py-1.5 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : (
                        o.status === 'pending' && (
                          <button
                            onClick={() => cancelOrder(o._id)}
                            className="btn-ghost text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Cancel
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;
