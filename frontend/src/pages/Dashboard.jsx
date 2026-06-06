import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../api';

function KPICard({ label, value, color }) {
  return (
    <div className="kpi-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="kpi-value">{value ?? '—'}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fn = user?.role === 'vendor' ? dashboardAPI.vendor : dashboardAPI.get;
    fn().then((r) => setData(r.data.data)).catch(() => {});
  }, [user]);

  if (!data) return <div className="loading">Loading dashboard…</div>;

  if (user?.role === 'vendor') {
    const { vendor, stats, recent_quotations } = data;
    return (
      <div className="page">
        <h1>Welcome, {vendor?.company_name}</h1>
        <div className="kpi-grid">
          <KPICard label="Total Quotations" value={stats?.total_quotations} color="#3b82f6" />
          <KPICard label="Accepted" value={stats?.accepted_quotations} color="#10b981" />
          <KPICard label="Pending" value={stats?.pending_quotations} color="#f59e0b" />
          <KPICard label="Revenue (₹)" value={stats?.total_revenue ? `₹${Number(stats.total_revenue).toLocaleString('en-IN')}` : '₹0'} color="#8b5cf6" />
        </div>
        <h2>Recent Quotations</h2>
        <table><thead><tr><th>RFQ</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{recent_quotations?.map((q) => (
            <tr key={q.id}><td>{q.rfq_title}</td><td>₹{Number(q.total_amount).toLocaleString('en-IN')}</td><td>{q.status}</td><td>{new Date(q.created_at).toLocaleDateString()}</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  }

  const { kpis, recent_activity } = data;
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="kpi-grid">
        <KPICard label="Active RFQs" value={kpis?.active_rfqs} color="#3b82f6" />
        <KPICard label="Pending Approvals" value={kpis?.pending_approvals} color="#f59e0b" />
        <KPICard label="Active POs" value={kpis?.active_pos} color="#10b981" />
        <KPICard label="Total Vendors" value={kpis?.total_vendors} color="#8b5cf6" />
        <KPICard label="Monthly Spend (₹)" value={kpis?.monthly_spend ? `₹${Number(kpis.monthly_spend).toLocaleString('en-IN')}` : '₹0'} color="#ef4444" />
        <KPICard label="Pending Invoices" value={kpis?.pending_invoices} color="#f97316" />
      </div>
      <h2>Recent Activity</h2>
      <div className="activity-list">
        {recent_activity?.length ? recent_activity.map((a) => (
          <div key={a.id} className="activity-item">
            <span className="activity-action">{a.action}</span>
            <span className="activity-user">{a.user_name}</span>
            <span className="activity-time">{new Date(a.created_at).toLocaleString()}</span>
          </div>
        )) : <p className="empty">No recent activity.</p>}
      </div>
    </div>
  );
}
