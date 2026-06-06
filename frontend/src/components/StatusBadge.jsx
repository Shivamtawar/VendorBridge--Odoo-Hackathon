const colors = {
  draft: '#6b7280', published: '#3b82f6', closed: '#8b5cf6', awarded: '#10b981',
  pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
  submitted: '#3b82f6', accepted: '#10b981', active: '#10b981',
  sent: '#3b82f6', paid: '#10b981', cancelled: '#ef4444',
  issued: '#f59e0b',
};

export default function StatusBadge({ status }) {
  const color = colors[status] || '#6b7280';
  return (
    <span style={{ background: color + '20', color, border: `1px solid ${color}40`, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
}
