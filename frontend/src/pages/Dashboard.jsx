import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../api';
import StatusBadge from '../components/StatusBadge';

const ACTION_LABELS = {
  RFQ_CREATED:            { label: 'RFQ Created',           dot: '#3b82f6' },
  RFQ_PUBLISHED:          { label: 'RFQ Published',         dot: '#3b82f6' },
  VENDORS_ASSIGNED:       { label: 'Vendors Assigned',      dot: '#8b5cf6' },
  QUOTATION_SUBMITTED:    { label: 'Quotation Submitted',   dot: '#f59e0b' },
  QUOTATION_UPDATED:      { label: 'Quotation Updated',     dot: '#f59e0b' },
  APPROVAL_REQUESTED:     { label: 'Approval Requested',    dot: '#f59e0b' },
  APPROVAL_APPROVED:      { label: 'Quotation Approved',    dot: '#10b981' },
  APPROVAL_REJECTED:      { label: 'Quotation Rejected',    dot: '#ef4444' },
  PURCHASE_ORDER_CREATED: { label: 'PO Created',            dot: '#10b981' },
  PO_STATUS_UPDATED:      { label: 'PO Status Updated',     dot: '#6b7280' },
  INVOICE_CREATED:        { label: 'Invoice Created',       dot: '#F4621F' },
  INVOICE_STATUS_UPDATED: { label: 'Invoice Paid',          dot: '#10b981' },
};

function KPICard({ label, value, color, icon }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
      <div className="kpi-icon" style={{ background: `${color}18`, color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>{icon}</div>
      <div className="kpi-value" style={{ color }}>{value ?? '—'}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  useEffect(() => {
    const fn = user?.role === 'vendor' ? dashboardAPI.vendor : dashboardAPI.get;
    fn().then((r) => setData(r.data.data)).catch(() => {});
  }, [user]);

  if (!data) return (
    <div className="page">
      <div className="loading"><div className="loading-spinner" /><span>Loading dashboard…</span></div>
    </div>
  );

  // Vendor dashboard
  if (user?.role === 'vendor') {
    const { vendor, stats, recent_quotations } = data;
    return (
      <div className="page">
        <div className="dashboard-welcome">
          <div>
            <h2>Good {timeOfDay}, {vendor?.company_name?.split(' ')[0] || user?.name?.split(' ')[0]}</h2>
            <p>Here's a summary of your quotation activity.</p>
          </div>
        </div>
        <div className="kpi-grid">
          <KPICard label="Total Quotations" value={stats?.total_quotations ?? 0} color="#3b82f6" icon="QT" />
          <KPICard label="Accepted" value={stats?.accepted_quotations ?? 0} color="#10b981" icon="OK" />
          <KPICard label="Pending" value={stats?.pending_quotations ?? 0} color="#f59e0b" icon="--" />
          <KPICard label="Revenue" value={`₹${Number(stats?.total_revenue ?? 0).toLocaleString('en-IN')}`} color="#F4621F" icon="₹" />
        </div>
        <h2>Recent Quotations</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>RFQ</th><th>Amount (₹)</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {recent_quotations?.map((q) => (
                <tr key={q.id}>
                  <td style={{ fontWeight: 500 }}>{q.rfq_title}</td>
                  <td>₹{Number(q.price ?? q.total_amount ?? 0).toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td style={{ color: 'var(--muted)' }}>{new Date(q.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!recent_quotations?.length && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>No quotations yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Admin / Manager / Officer dashboard
  const { kpis, recent_activity } = data;
  return (
    <div className="page">
      <div className="dashboard-welcome">
        <div>
          <h2>Good {timeOfDay}, {user?.name?.split(' ')[0]}</h2>
          <p>Here's what's happening in your procurement pipeline today.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="Active RFQs"       value={kpis?.active_rfqs ?? 0}       color="#3b82f6" icon="RFQ" />
        <KPICard label="Pending Approvals" value={kpis?.pending_approvals ?? 0}  color="#f59e0b" icon="APR" />
        <KPICard label="Active POs"        value={kpis?.active_pos ?? 0}         color="#10b981" icon="PO" />
        <KPICard label="Total Vendors"     value={kpis?.total_vendors ?? 0}      color="#8b5cf6" icon="VND" />
        <KPICard label="Monthly Spend"     value={`₹${Number(kpis?.monthly_spend ?? 0).toLocaleString('en-IN')}`} color="#F4621F" icon="₹" />
        <KPICard label="Pending Invoices"  value={kpis?.pending_invoices ?? 0}   color="#ef4444" icon="INV" />
      </div>

      <h2>Recent Activity</h2>
      <div className="activity-list">
        {recent_activity?.length ? recent_activity.map((a) => {
          const meta = ACTION_LABELS[a.action] || { label: a.action, dot: '#6b7280' };
          return (
            <div key={a.id} className="activity-item">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, flexShrink: 0, marginTop: 2 }} />
              <span className="activity-action" style={{ flex: 1 }}>{meta.label}</span>
              <span className="activity-user" style={{ color: 'var(--muted)', fontSize: 13 }}>{a.user_name || '—'}</span>
              <span className="activity-time" style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          );
        }) : (
          <p style={{ padding: '24px 20px', color: 'var(--muted)', fontSize: 13 }}>
            No recent activity. Start by creating an RFQ.
          </p>
        )}
      </div>
    </div>
  );
}
