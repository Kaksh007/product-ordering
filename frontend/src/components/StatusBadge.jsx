const COLORS = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  accepted: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_production: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  shipped: 'bg-purple-50 text-purple-700 ring-purple-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_production: 'In Production',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const StatusBadge = ({ status }) => {
  const classes = COLORS[status] || 'bg-slate-50 text-slate-700 ring-slate-200';
  return (
    <span className={`badge ring-1 ${classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status] || status}
    </span>
  );
};

export default StatusBadge;
