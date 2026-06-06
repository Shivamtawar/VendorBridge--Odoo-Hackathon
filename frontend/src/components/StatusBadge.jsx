const configs = {
  draft:     { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
  published: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  closed:    { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  awarded:   { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  pending:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  approved:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  rejected:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  submitted: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  accepted:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  active:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  sent:      { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  paid:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  cancelled: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  issued:    { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  acknowledged: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  completed: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'capitalize',
      letterSpacing: '0.2px',
      display: 'inline-block',
    }}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
}
