import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Trash2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';
import { orderSchema, zodErrorsToFieldMap } from '../schemas/validation.js';
import FieldError from '../components/FieldError.jsx';

const CATEGORIES = ['All assets', 'Packaging', 'Bottles', 'Apparel', 'Beverage', 'Other'];

const OrderModal = ({ mockup, onClose, onPlaced }) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => (Number(quantity) || 0) * Number(mockup.price), [quantity, mockup.price]);

  const placeOrder = async (e) => {
    e.preventDefault();
    const parsed = orderSchema.safeParse({ quantity, notes });
    if (!parsed.success) {
      setErrors(zodErrorsToFieldMap(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await api.post('/api/orders', {
        mockupId: mockup._id,
        quantity: parsed.data.quantity,
        notes: parsed.data.notes,
      });
      toast.success('Order placed');
      onPlaced?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold">Place Order</h2>
        <p className="text-sm text-slate-500">{mockup.name}</p>

        <form onSubmit={placeOrder} className="mt-4 space-y-4">
          <div>
            <label className="label">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input mt-1"
            />
            <FieldError message={errors.quantity} />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input mt-1 resize-none"
              placeholder="Any customisations or delivery notes..."
            />
            <FieldError message={errors.notes} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Unit price: <span className="font-semibold text-slate-900">${mockup.price}</span>
            </span>
            <span className="text-base font-bold">Total: ${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Placing…' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Mockups = () => {
  const { user } = useAuth();
  const [mockups, setMockups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All assets');
  const [selected, setSelected] = useState(null);
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim().toLowerCase();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/mockups');
      setMockups(data.mockups);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const byCategory =
      category === 'All assets' ? mockups : mockups.filter((m) => m.category === category);

    if (!query) return byCategory;

    return byCategory.filter((m) => {
      const haystack = [m.name, m.description, m.category, m.designer?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [mockups, category, query]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this mockup? This cannot be undone.')) return;
    try {
      await api.delete(`/api/mockups/${id}`);
      toast.success('Mockup deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mockups</h1>
          <p className="text-sm text-slate-500">
            {user.role === 'designer' ? 'Manage your uploaded mockups' : 'Browse mockups and place an order'}
          </p>
        </div>
        {user.role === 'designer' && (
          <Link to="/mockups/new" className="btn-secondary">
            + New Mockup
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`pb-2 text-sm font-semibold transition ${
              category === c
                ? 'border-b-2 border-brand-600 text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          {query ? 'No mockups match your search.' : 'No mockups in this category.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((m) => (
            <div key={m._id} className="card group overflow-hidden p-0">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                <img
                  src={m.imageUrl}
                  alt={m.name}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  {m.category}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="line-clamp-2 text-xs text-slate-500">
                      {m.description || 'No description provided.'}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-brand-600">${m.price}</span>
                </div>
                {user.role === 'designer' ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/mockups/${m._id}/edit`}
                      className="btn-secondary flex-1 !py-2 text-xs"
                    >
                      <Pencil size={14} /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(m._id)}
                      className="btn-secondary !px-3 !py-2 text-xs"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelected(m)}
                    className="btn-primary w-full !py-2 text-xs"
                  >
                    <ShoppingCart size={14} /> Order
                  </button>
                )}
                <div className="text-[11px] text-slate-400">by {m.designer?.name}</div>
              </div>
            </div>
          ))}

          {user.role === 'designer' && (
            <Link
              to="/mockups/new"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 transition hover:border-brand-300 hover:text-brand-600"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Plus size={20} />
              </div>
              <div>
                <div className="font-semibold text-slate-700">Create New</div>
                <div className="text-xs">Start with a blank canvas or import a mockup.</div>
              </div>
            </Link>
          )}
        </div>
      )}

      {selected && <OrderModal mockup={selected} onClose={() => setSelected(null)} onPlaced={load} />}
    </div>
  );
};

export default Mockups;
