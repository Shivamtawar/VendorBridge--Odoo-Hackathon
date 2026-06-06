import React, { useEffect, useState } from 'react';
import { reportAPI } from '../api';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="page"><h1>Reports</h1><div className="alert alert-error">Something went wrong loading reports.</div></div>;
    return this.props.children;
  }
}

function StatCard({ label, value, color = 'var(--brand)' }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Sora, sans-serif', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [perf, setPerf] = useState([]);
  const [trends, setTrends] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([reportAPI.procurementStats(), reportAPI.vendorPerformance(), reportAPI.monthlyTrends()])
      .then(([s, p, t]) => {
        if (!mounted) return;
        setStats(s?.data?.data ?? null);
        setPerf(p?.data?.data ?? []);
        setTrends(t?.data?.data ?? []);
      }).catch((err) => { if (mounted) setError(err); });
    return () => { mounted = false; };
  }, []);

  if (error) return <div className="page"><h1>Reports</h1><div className="alert alert-error">Failed to load reports.</div></div>;

  return (
    <ErrorBoundary>
      <div className="page">
        <div className="page-header">
          <div><h1>Reports & Analytics</h1><p className="page-subtitle">Procurement insights and performance</p></div>
        </div>

        {stats && (
          <>
            <h2>Procurement Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
              {stats.rfq_stats?.map((s, i) => (
                <StatCard key={i} label={`RFQs ${s.status}`} value={s.count} color={s.status === 'published' ? '#3b82f6' : s.status === 'awarded' ? '#10b981' : 'var(--muted)'} />
              ))}
              {stats.po_stats?.map((s, i) => (
                <StatCard key={i} label={`POs ${s.status}`} value={s.count} color={s.status === 'completed' ? '#10b981' : 'var(--brand)'} />
              ))}
            </div>

            <h2>Top Vendors by Spend</h2>
            {stats.top_vendors?.length ? (
              <div className="table-wrap" style={{marginBottom:28}}>
                <table>
                  <thead><tr><th>#</th><th>Vendor</th><th>Orders</th><th>Total Value (₹)</th></tr></thead>
                  <tbody>{stats.top_vendors.map((v, i) => (
                    <tr key={i}>
                      <td style={{color:'var(--muted)',fontWeight:700,fontSize:12}}>{i + 1}</td>
                      <td style={{fontWeight:600}}>{v.company_name}</td>
                      <td>{v.order_count}</td>
                      <td style={{fontWeight:600,color:'var(--brand)'}}>₹{Number(v.total_value ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="empty">No vendor data.</p>}
          </>
        )}

        <h2>Vendor Performance</h2>
        {Array.isArray(perf) && perf.length ? (
          <div className="table-wrap" style={{marginBottom:28}}>
            <table>
              <thead><tr><th>Vendor</th><th>Quotations</th><th>Accepted</th><th>Avg Amount (₹)</th><th>Acceptance Rate</th></tr></thead>
              <tbody>{perf.map((v, idx) => (
                <tr key={v?.vendor_id ?? idx}>
                  <td style={{fontWeight:500}}>{v?.company_name ?? '—'}</td>
                  <td>{v?.total_quotations ?? 0}</td>
                  <td>{v?.accepted_quotations ?? 0}</td>
                  <td>₹{Number(v?.avg_quote_amount ?? 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: Number(v?.acceptance_rate) > 50 ? '#16a34a' : 'var(--muted)' }}>
                      {v?.acceptance_rate ?? 0}%
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="empty">No performance data.</p>}

        <h2>Monthly Trends</h2>
        {Array.isArray(trends) && trends.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>RFQs</th><th>Quotations</th><th>POs</th><th>Total Spend (₹)</th></tr></thead>
              <tbody>{trends.map((t, i) => (
                <tr key={i}>
                  <td style={{fontWeight:600}}>{t?.month ?? '—'}</td>
                  <td>{t?.rfqs_created ?? 0}</td>
                  <td>{t?.quotations_submitted ?? 0}</td>
                  <td>{t?.pos_created ?? 0}</td>
                  <td style={{fontWeight:600,color:'var(--brand)'}}>₹{Number(t?.total_spend ?? 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="empty">No trend data.</p>}
      </div>
    </ErrorBoundary>
  );
}
