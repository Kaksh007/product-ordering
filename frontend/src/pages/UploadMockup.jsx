import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UploadCloud } from 'lucide-react';
import api from '../api/axios';
import { mockupSchema, zodErrorsToFieldMap } from '../schemas/validation.js';
import FieldError from '../components/FieldError.jsx';

const CATEGORIES = ['Packaging', 'Bottles', 'Apparel', 'Beverage', 'Other'];

const UploadMockup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Beverage',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/mockups/${id}`);
        setForm({
          name: data.mockup.name,
          description: data.mockup.description,
          price: String(data.mockup.price),
          category: data.mockup.category,
        });
        setPreview(data.mockup.imageUrl);
      } catch (err) {
        toast.error(err.message);
        navigate('/mockups');
      }
    })();
  }, [id, editing, navigate]);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      toast.error('File exceeds 20 MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = mockupSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrorsToFieldMap(parsed.error));
      return;
    }
    if (!editing && !file) {
      setErrors({ image: 'Please select an image to upload' });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('name', parsed.data.name);
      body.append('description', parsed.data.description || '');
      body.append('price', String(parsed.data.price));
      body.append('category', parsed.data.category);
      if (file) body.append('image', file);

      if (editing) {
        await api.put(`/api/mockups/${id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mockup updated');
      } else {
        await api.post('/api/mockups', body, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Mockup uploaded');
      }
      navigate('/mockups');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside>
        <h1 className="text-2xl font-bold tracking-tight">
          {editing ? 'Edit Mockup' : 'Upload Mockup'}
        </h1>
        <p className="text-sm text-slate-500">
          {editing ? 'Update your mockup details' : 'Add new mockup to library'}
        </p>
        <div className="mt-6 space-y-2 rounded-xl bg-brand-50/60 p-4 text-sm text-brand-800">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> Optimized for WebP
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> Auto-tagging enabled
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> Commercial License check
          </div>
        </div>
      </aside>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Mockup name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Minimalist Coffee Pouch v2"
            className="input mt-1"
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe the material, finish, and lighting setup..."
            className="input mt-1 resize-none"
          />
          <FieldError message={errors.description} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Price (USD)</label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <FieldError message={errors.price} />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="input mt-1"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FieldError message={errors.category} />
          </div>
        </div>

        <div>
          <label className="label">Mockup preview</label>
          <label
            className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-8 text-center text-sm text-slate-600 transition hover:border-brand-400"
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-64 rounded-lg object-contain" />
            ) : (
              <>
                <UploadCloud size={28} className="text-brand-500" />
                <div className="font-semibold text-slate-700">
                  Click to upload or drag and drop
                </div>
                <div className="text-xs text-slate-400">PNG, JPG or WebP (Max. 20MB)</div>
              </>
            )}
          </label>
          <FieldError message={errors.image} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/mockups')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Upload Mockup'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadMockup;
