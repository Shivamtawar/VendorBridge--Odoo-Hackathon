import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../api';
import StatusBadge from '../components/StatusBadge';

function KPICard({ label, value, color, icon }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
      <div className="kpi-icon">{icon}</div>
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

  if (user?.role === 'vendor') {
    const { vendor, stats, recent_quotations } = data;
    return (
      <div className="page">
        <div className="dashboard-welcome">
          <div>
            <h2>Good {timeOfDay}, {vendor?.company_name?.split(' ')[0]} 👋</h2>
            <p>Here's a summary of your quotation activity.</p>
          </div>
        </div>
        <div className="kpi-grid">
          <KPICard label="Total Quotations" value={stats?.total_quotations} color="#3b82f6" icon="💬" />
          <KPICard label="Accepted" value={stats?.accepted_quotations} color="#10b981" icon="✅" />
          <KPICard label="Pending" value={stats?.pending_quotations} color="#f59e0b" icon="⏳" />
          <KPICard label="Revenue" value={stats?.total_revenue ? `₹${Number(stats.total_revenue).toLocaleString('en-IN')}` : '₹0'} color="#F4621F" icon="💰" />
        </div>
        <h2>Recent Quotations</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>RFQ</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {recent_quotations?.map((q) => (
                <tr key={q.id}>
                  <td style={{fontWeight:500}}>{q.rfq_title}</td>
                  <td>₹{Number(q.total_amount).toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td style={{color:'var(--muted)'}}>{new Date(q.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {!recent_quotations?.length && <tr><td colSpan={4} style={{textAlign:'center',color:'var(--muted)',padding:'24px'}}>No quotations yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const { kpis, recent_activity } = data;
  return (
    <div className="page">
      <div className="dashboard-welcome">
        <div>
          <h2>Good {timeOfDay}, {user?.name?.split(' ')[0]} 👋</h2>
          <p>Here's what's happening in your procurement pipeline today.</p>
        </div>
      </div>
      <div className="kpi-grid">
        <KPICard label="Active RFQs" value={kpis?.active_rfqs} color="#3b82f6" icon="📋" />
        <KPICard label="Pending Approvals" value={kpis?.pending_approvals} color="#f59e0b" icon="⏳" />
        <KPICard label="Active POs" value={kpis?.active_pos} color="#10b981" icon="📦" />
        <KPICard label="Total Vendors" value={kpis?.total_vendors} color="#8b5cf6" icon="🏢" />
        <KPICard label="Monthly Spend" value={kpis?.monthly_spend ? `₹${Number(kpis.monthly_spend).toLocaleString('en-IN')}` : '₹0'} color="#F4621F" icon="💰" />
        <KPICard label="Pending Invoices" value={kpis?.pending_invoices} color="#ef4444" icon="🧾" />
      </div>
      <h2>Recent Activity</h2>
      <div className="activity-list">
        {recent_activity?.length ? recent_activity.map((a) => (
          <div key={a.id} className="activity-item">
            <div className="activity-dot" />
            <span className="activity-action">{a.action}</span>
            <span className="activity-user">{a.user_name}</span>
            <span className="activity-time">{new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
        )) : <p style={{padding:'24px 20px',color:'var(--muted)',fontSize:13}}>No recent activity.</p>}
      </div>
    </div>
  );
}
