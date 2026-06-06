import React, { useEffect, useState } from 'react';
import { reportAPI } from '../api';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="page"><h1>Reports</h1><div className="alert alert-error">Something went wrong.</div></div>;
    return this.props.children;
  }
}

function StatsTable({ title, rows, columns }) {
  if (!rows?.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--muted)', textTransform: 'capitalize' }}>{title}</h3>
      <div className="table-wrap">
        <table>
          <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => (
            <tr key={i}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
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
    Promise.all([
      reportAPI.procurementStats(),
      reportAPI.vendorPerformance(),
      reportAPI.monthlyTrends(),
    ]).then(([s, p, t]) => {
      if (!mounted) return;
      setStats(s?.data?.data ?? null);
      setPerf(p?.data?.data ?? []);
      setTrends(t?.data?.data ?? []);
    }).catch((err) => { if (mounted) setError(err); });
    return () => { mounted = false; };
  }, []);

  if (error) return (
    <div className="page"><h1>Reports</h1>
      <div className="alert alert-error">Failed to load reports.</div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="page">
        <h1>Reports</h1>

        {stats && (
          <section>
            <h2>Procurement Stats</h2>
            <StatsTable
              title="RFQ breakdown by status"
              rows={stats.rfq_stats}
              columns={[
                { key: 'status', label: 'Status' },
                { key: 'count', label: 'Count' },
              ]}
            />
            <StatsTable
              title="Purchase Orders by status"
              rows={stats.po_stats}
              columns={[
                { key: 'status', label: 'Status' },
                { key: 'count', label: 'Count' },
                { key: 'total_value', label: 'Total Value (₹)', render: (r) => `₹${Number(r.total_value ?? 0).toLocaleString('en-IN')}` },
              ]}
            />
            <StatsTable
              title="Invoices by status"
              rows={stats.invoice_stats}
              columns={[
                { key: 'status', label: 'Status' },
                { key: 'count', label: 'Count' },
                { key: 'total_value', label: 'Total Value (₹)', render: (r) => `₹${Number(r.total_value ?? 0).toLocaleString('en-IN')}` },
              ]}
            />
            <StatsTable
              title="Top Vendors"
              rows={stats.top_vendors}
              columns={[
                { key: 'company_name', label: 'Vendor' },
                { key: 'order_count', label: 'Orders' },
                { key: 'total_value', label: 'Total Value (₹)', render: (r) => `₹${Number(r.total_value ?? 0).toLocaleString('en-IN')}` },
              ]}
            />
          </section>
        )}

        <section>
          <h2>Vendor Performance</h2>
          {Array.isArray(perf) && perf.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Vendor</th><th>Quotations</th><th>Accepted</th><th>Avg Amount (₹)</th><th>Acceptance Rate</th></tr></thead>
                <tbody>{perf.map((v, idx) => (
                  <tr key={v?.vendor_id ?? idx}>
                    <td>{v?.company_name ?? '—'}</td>
                    <td>{v?.total_quotations ?? 0}</td>
                    <td>{v?.accepted_quotations ?? 0}</td>
                    <td>₹{Number(v?.avg_quote_amount ?? 0).toLocaleString('en-IN')}</td>
                    <td>{v?.acceptance_rate ?? 0}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="empty">No data.</p>}
        </section>

        <section>
          <h2>Monthly Trends</h2>
          {Array.isArray(trends) && trends.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Month</th><th>RFQs</th><th>Quotations</th><th>POs</th><th>Spend (₹)</th></tr></thead>
                <tbody>{trends.map((t, i) => (
                  <tr key={i}>
                    <td>{t?.month ?? '—'}</td>
                    <td>{t?.rfqs_created ?? 0}</td>
                    <td>{t?.quotations_submitted ?? 0}</td>
                    <td>{t?.pos_created ?? 0}</td>
                    <td>₹{Number(t?.total_spend ?? 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="empty">No data.</p>}
        </section>
      </div>
    </ErrorBoundary>
  );
}
