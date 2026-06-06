import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { quotationAPI, rfqAPI, approvalAPI } from '../api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

export default function Quotations() {
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';
  const canApprove = user?.role === 'manager' || user?.role === 'admin';
  const canCompare = !isVendor;

  const [tab, setTab] = useState('quotations');
  const [rfqs, setRfqs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [compareRFQ, setCompareRFQ] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareErr, setCompareErr] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewQuotation, setViewQuotation] = useState(null);
  const [form, setForm] = useState({ rfq_id: '', price: '', delivery_days: '', notes: '' });
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    rfqAPI.list().then((r) => {
      const d = r.data.data;
      setRfqs(Array.isArray(d) ? d : (d?.rfqs || []));
    });
  }, []);

  const loadQuotations = (rfqId) => {
    if (!rfqId) { setQuotations([]); return; }
    if (!isVendor) quotationAPI.byRFQ(rfqId).then((r) => setQuotations(r.data.data || []));
  };

  useEffect(() => { loadQuotations(selectedRFQ); }, [selectedRFQ, isVendor]);

  const loadComparison = async (rfqId) => {
    if (!rfqId) { setComparison([]); return; }
    setCompareLoading(true); setCompareErr('');
    try {
      const r = await quotationAPI.compare(rfqId);
      const data = r.data.data;
      // response shape: { rfq, quotations } or plain array
      const rows = Array.isArray(data) ? data : (data?.quotations ?? []);
      setComparison(rows);
    } catch (ex) {
      setCompareErr(ex.response?.data?.message || ex.message || 'Failed to load comparison');
      setComparison([]);
    }
    finally { setCompareLoading(false); }
  };

  useEffect(() => { loadComparison(compareRFQ); }, [compareRFQ]);

  const submitQuote = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await quotationAPI.submit({ ...form, price: Number(form.price), delivery_days: Number(form.delivery_days) });
      setShowForm(false); setForm({ rfq_id: '', price: '', delivery_days: '', notes: '' });
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const handleApproval = async (action) => {
    setProcessing(true); setErr('');
    try {
      await approvalAPI.processQuotation(viewQuotation.id, { status: action, remarks });
      setViewQuotation(null); setRemarks('');
      loadQuotations(selectedRFQ);
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
    finally { setProcessing(false); }
  };

  const openView = (q) => { setViewQuotation(q); setRemarks(''); setErr(''); };

  const availableRFQs = rfqs.filter((r) => r.status === 'published' || r.status === 'open');

  // Comparison derived values
  const minPrice = comparison.length ? Math.min(...comparison.map((q) => Number(q.price ?? 0))) : null;
  const minDelivery = comparison.length ? Math.min(...comparison.map((q) => Number(q.delivery_days ?? 9999))) : null;

  const cols = [
    { key: 'company_name', label: 'Vendor', render: (r) => <span style={{ fontWeight: 600 }}>{r.company_name || r.vendor_name || '—'}</span> },
    { key: 'price', label: 'Amount (₹)', render: (r) => <span style={{ fontWeight: 600, color: 'var(--brand)' }}>₹{Number(r.price ?? 0).toLocaleString('en-IN')}</span> },
    { key: 'delivery_days', label: 'Delivery (days)' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Submitted', render: (r) => new Date(r.created_at).toLocaleDateString('en-IN') },
    {
      key: '_view', label: '',
      render: (r) => (
        <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openView(r); }}>
          View
        </button>
      )
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Quotations</h1>
          <p className="page-subtitle">Vendor responses to RFQs</p>
        </div>
        {isVendor && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Submit Quotation</button>}
      </div>

      {/* Tabs — only for non-vendors */}
      {canCompare && (
        <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
          {[
            { key: 'quotations', label: 'Quotations' },
            { key: 'compare', label: 'Compare' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 20px',
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: 14,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderBottom: tab === t.key ? '2px solid var(--brand)' : '2px solid transparent',
                marginBottom: -2,
                color: tab === t.key ? 'var(--brand)' : 'var(--muted)',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab: Quotations ── */}
      {(tab === 'quotations' || isVendor) && (
        <>
          {!isVendor && (
            <div className="filter-bar">
              <label>Select RFQ:</label>
              <select value={selectedRFQ} onChange={(e) => setSelectedRFQ(e.target.value)}>
                <option value="">— choose an RFQ —</option>
                {rfqs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
          )}
          <Table columns={cols} data={quotations} />
        </>
      )}

      {/* ── Tab: Compare ── */}
      {tab === 'compare' && canCompare && (
        <div>
          <div className="filter-bar" style={{ marginBottom: 28 }}>
            <label>Select RFQ to compare:</label>
            <select value={compareRFQ} onChange={(e) => setCompareRFQ(e.target.value)}>
              <option value="">— choose an RFQ —</option>
              {rfqs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>

          {!compareRFQ && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>≡</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Select an RFQ to compare quotations</div>
              <div style={{ fontSize: 13 }}>Side-by-side comparison of vendor price, delivery, and rating</div>
            </div>
          )}

          {compareRFQ && compareLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Loading quotations…</div>
          )}

          {compareErr && (
            <div className="alert alert-error">{compareErr}</div>
          )}

          {compareRFQ && !compareLoading && !compareErr && comparison.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              No quotations found for this RFQ.
            </div>
          )}

          {compareRFQ && !compareLoading && comparison.length > 0 && (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#d1fae5', display: 'inline-block' }} />
                  Best value
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#dbeafe', display: 'inline-block' }} />
                  Fastest delivery
                </span>
              </div>

              {/* Comparison cards */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(comparison.length, 3)}, 1fr)`, gap: 16 }}>
                {comparison.map((q, idx) => {
                  const price = Number(q.price ?? 0);
                  const delivery = Number(q.delivery_days ?? 0);
                  const isCheapest = price === minPrice;
                  const isFastest = delivery === minDelivery;
                  const hasBadge = isCheapest || isFastest;

                  return (
                    <div
                      key={q.id}
                      style={{
                        border: `2px solid ${isCheapest ? '#6ee7b7' : isFastest ? '#93c5fd' : 'var(--border)'}`,
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: 'var(--surface)',
                        position: 'relative',
                      }}
                    >
                      {/* Card header */}
                      <div style={{
                        background: isCheapest ? '#d1fae5' : isFastest ? '#dbeafe' : 'var(--surface-2)',
                        padding: '14px 18px 12px',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{q.company_name || '—'}</div>
                            {q.contact_person && (
                              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{q.contact_person}</div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            {isCheapest && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                                BEST PRICE
                              </span>
                            )}
                            {isFastest && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                                FASTEST
                              </span>
                            )}
                          </div>
                        </div>
                        {q.rating && (
                          <div style={{ marginTop: 6, fontSize: 12, color: '#b45309' }}>
                            {'★'.repeat(Math.round(q.rating))}{'☆'.repeat(5 - Math.round(q.rating))} <span style={{ color: 'var(--muted)' }}>({q.rating})</span>
                          </div>
                        )}
                      </div>

                      {/* Card body — metrics */}
                      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Price */}
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Quoted Price</div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: isCheapest ? '#059669' : 'var(--text)' }}>
                            ₹{price.toLocaleString('en-IN')}
                          </div>
                          {/* Price bar relative to max */}
                          {(() => {
                            const maxPrice = Math.max(...comparison.map((x) => Number(x.price ?? 0)));
                            const pct = maxPrice > 0 ? Math.round((price / maxPrice) * 100) : 100;
                            return (
                              <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: isCheapest ? '#059669' : '#f97316', borderRadius: 2, transition: 'width 0.4s' }} />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Delivery */}
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Delivery Time</div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: isFastest ? '#2563eb' : 'var(--text)' }}>
                            {delivery} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)' }}>days</span>
                          </div>
                          {(() => {
                            const maxDel = Math.max(...comparison.map((x) => Number(x.delivery_days ?? 0)));
                            const pct = maxDel > 0 ? Math.round((delivery / maxDel) * 100) : 100;
                            return (
                              <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: isFastest ? '#2563eb' : '#94a3b8', borderRadius: 2, transition: 'width 0.4s' }} />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Status + Submitted */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                          <StatusBadge status={q.status} />
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {q.submitted_at
                              ? new Date(q.submitted_at).toLocaleDateString('en-IN')
                              : q.created_at
                              ? new Date(q.created_at).toLocaleDateString('en-IN')
                              : '—'}
                          </span>
                        </div>

                        {/* Notes */}
                        {q.notes && (
                          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                            "{q.notes}"
                          </div>
                        )}

                        {/* Approve / Reject for manager */}
                        {canApprove && q.status === 'submitted' && (
                          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                            <button
                              className="btn btn-success w-full"
                              style={{ fontSize: 13 }}
                              onClick={() => openView(q)}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-danger w-full"
                              style={{ fontSize: 13 }}
                              onClick={() => { setViewQuotation(q); setRemarks(''); setErr(''); }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary table below cards */}
              <div style={{ marginTop: 32 }}>
                <h3 style={{ marginBottom: 12 }}>Summary Table</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)' }}>
                        <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, borderBottom: '2px solid var(--border)' }}>Vendor</th>
                        <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, borderBottom: '2px solid var(--border)' }}>Price (₹)</th>
                        <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, borderBottom: '2px solid var(--border)' }}>Delivery (days)</th>
                        <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, borderBottom: '2px solid var(--border)' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, borderBottom: '2px solid var(--border)' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((q) => {
                        const price = Number(q.price ?? 0);
                        const delivery = Number(q.delivery_days ?? 0);
                        const isCheapest = price === minPrice;
                        const isFastest = delivery === minDelivery;
                        return (
                          <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                              {q.company_name || '—'}
                              <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                                {isCheapest && <span style={{ fontSize: 10, background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>BEST PRICE</span>}
                                {isFastest && <span style={{ fontSize: 10, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>FASTEST</span>}
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: isCheapest ? '#059669' : 'var(--text)' }}>
                              ₹{price.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: isFastest ? '#2563eb' : 'var(--text)' }}>
                              {delivery}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <StatusBadge status={q.status} />
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 12, maxWidth: 200 }}>{q.notes || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Vendor: submit form */}
      {showForm && (
        <Modal title="Submit Quotation" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={submitQuote} className="form-stack">
            <div>
              <label>RFQ</label>
              <select value={form.rfq_id} onChange={(e) => setForm({ ...form, rfq_id: e.target.value })} required>
                <option value="">Select RFQ</option>
                {availableRFQs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div><label>Your Price (₹)</label><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
              <div><label>Delivery Days</label><input type="number" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} required /></div>
            </div>
            <div><label>Notes / Comments</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any special terms or conditions…" /></div>
            <button className="btn btn-primary">Submit Quotation</button>
          </form>
        </Modal>
      )}

      {/* View quotation detail + approve/reject for manager */}
      {viewQuotation && (
        <Modal title="Quotation Details" onClose={() => { setViewQuotation(null); setErr(''); }}>
          {err && <div className="alert alert-error">{err}</div>}

          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '16px 18px', marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 0', fontSize: 14 }}>
              <span style={{ color: 'var(--muted)' }}>Vendor</span>
              <span style={{ fontWeight: 700 }}>{viewQuotation.company_name || viewQuotation.vendor_name || '—'}</span>

              <span style={{ color: 'var(--muted)' }}>Contact</span>
              <span>{viewQuotation.contact_person || '—'}</span>

              <span style={{ color: 'var(--muted)' }}>Quoted Price</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--brand)' }}>
                ₹{Number(viewQuotation.price ?? 0).toLocaleString('en-IN')}
              </span>

              <span style={{ color: 'var(--muted)' }}>Delivery</span>
              <span>{viewQuotation.delivery_days} days</span>

              <span style={{ color: 'var(--muted)' }}>Status</span>
              <span><StatusBadge status={viewQuotation.status} /></span>

              <span style={{ color: 'var(--muted)' }}>Submitted</span>
              <span>{new Date(viewQuotation.created_at).toLocaleDateString('en-IN')}</span>

              {viewQuotation.rating && <>
                <span style={{ color: 'var(--muted)' }}>Vendor Rating</span>
                <span>{'★'.repeat(Math.round(viewQuotation.rating))}{'☆'.repeat(5 - Math.round(viewQuotation.rating))} ({viewQuotation.rating})</span>
              </>}
            </div>

            {viewQuotation.notes && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>Notes / Terms</div>
                <div style={{ fontSize: 13 }}>{viewQuotation.notes}</div>
              </div>
            )}
          </div>

          {canApprove && viewQuotation.status === 'submitted' && (
            <div className="form-stack">
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
                This quotation is awaiting your approval decision.
              </div>
              <div>
                <label>Remarks (optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  placeholder="Add a note for the procurement team…"
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-success w-full" disabled={processing} onClick={() => handleApproval('approved')} style={{ fontSize: 15, padding: '10px 0' }}>
                  {processing ? '…' : '✓ Approve'}
                </button>
                <button className="btn btn-danger w-full" disabled={processing} onClick={() => handleApproval('rejected')} style={{ fontSize: 15, padding: '10px 0' }}>
                  {processing ? '…' : '✕ Reject'}
                </button>
              </div>
            </div>
          )}

          {canApprove && viewQuotation.status !== 'submitted' && (
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, color: 'var(--muted)' }}>
              This quotation has already been <strong>{viewQuotation.status}</strong>.
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
