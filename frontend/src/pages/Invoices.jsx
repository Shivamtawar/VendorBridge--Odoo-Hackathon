import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { invoiceAPI, poAPI } from '../api';
import api from '../api/client';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['sent', 'paid', 'cancelled'];

function PaidOverlay({ invoice, onDone }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '48px 56px',
        textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        animation: 'paid-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Animated checkmark circle */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg,#10b981,#059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          animation: 'paid-pulse 0.6s ease 0.2s both',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', marginBottom: 6 }}>Payment Confirmed!</div>
        <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 4 }}>
          Invoice <strong style={{ color: '#111' }}>{invoice.invoice_number}</strong>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 24 }}>
          ₹{Number(invoice.total ?? 0).toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>
          Paid to <strong>{invoice.company_name}</strong>
        </div>
        <button className="btn btn-success" style={{ minWidth: 140, fontSize: 15 }} onClick={onDone}>
          Done
        </button>
      </div>

      <style>{`
        @keyframes paid-pop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes paid-pulse {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function Invoices() {
  const { user } = useAuth();
  const isOfficer = user?.role === 'procurement_officer';
  const canAct = isOfficer || user?.role === 'manager' || user?.role === 'admin';

  const [invoices, setInvoices] = useState([]);
  const [pos, setPOs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [form, setForm] = useState({ subtotal: '', tax: '', due_date: '', notes: '' });
  const [pdfLoading, setPdfLoading] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [paidInvoice, setPaidInvoice] = useState(null);
  const [err, setErr] = useState('');

  const load = () => invoiceAPI.list().then((r) => setInvoices(r.data.data?.invoices || r.data.data || []));

  useEffect(() => {
    load();
    if (isOfficer) {
      poAPI.list().then((r) => {
        const all = r.data.data?.purchase_orders || r.data.data || [];
        setPOs(all.filter((p) => p.status !== 'cancelled'));
      });
    }
  }, [isOfficer]);

  const openForm = () => {
    setSelectedPO(null);
    setForm({ subtotal: '', tax: '', due_date: '', notes: '' });
    setErr('');
    setShowForm(true);
  };

  const selectPO = (po) => {
    setSelectedPO(po);
    setForm((f) => ({ ...f, subtotal: po.total_amount ? String(Number(po.total_amount)) : '' }));
  };

  const create = async (e) => {
    e.preventDefault(); setErr('');
    if (!selectedPO) { setErr('Please select a Purchase Order'); return; }
    try {
      await invoiceAPI.create({
        po_id: selectedPO.id,
        subtotal: Number(form.subtotal),
        tax: Number(form.tax || 0),
        due_date: form.due_date || undefined,
        notes: form.notes,
      });
      setShowForm(false); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const quickStatus = async (invoice, newStatus) => {
    setActionLoading(`${invoice.id}-${newStatus}`);
    try {
      await invoiceAPI.updateStatus(invoice.id, newStatus);
      if (newStatus === 'paid') {
        await load();
        setPaidInvoice({ ...invoice, status: 'paid' });
      } else {
        load();
      }
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const downloadPDF = async (id, invoiceNumber) => {
    setPdfLoading(id);
    try {
      const res = await api.get(`/invoices/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${invoiceNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setPdfLoading(null); }
  };

  const total = (Number(form.subtotal || 0) + Number(form.tax || 0));

  const cols = [
    { key: 'invoice_number', label: 'Invoice #', render: (r) => <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand)' }}>{r.invoice_number}</span> },
    { key: 'po_number', label: 'PO #', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{r.po_number || '—'}</span> },
    { key: 'company_name', label: 'Vendor', render: (r) => <span style={{ fontWeight: 500 }}>{r.company_name || '—'}</span> },
    { key: 'total', label: 'Total (₹)', render: (r) => <span style={{ fontWeight: 600 }}>₹{Number(r.total ?? 0).toLocaleString('en-IN')}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'due_date', label: 'Due Date', render: (r) => r.due_date ? new Date(r.due_date).toLocaleDateString('en-IN') : '—' },
    {
      key: '_actions', label: '', render: (r) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>

          {/* Publish — draft → sent */}
          {canAct && r.status === 'draft' && (
            <button
              className="btn btn-sm btn-outline"
              disabled={actionLoading === `${r.id}-sent`}
              onClick={(e) => { e.stopPropagation(); quickStatus(r, 'sent'); }}
              style={{ borderColor: '#3b82f6', color: '#3b82f6', fontWeight: 600 }}
            >
              {actionLoading === `${r.id}-sent` ? '…' : 'Publish'}
            </button>
          )}

          {/* Pay — sent → paid */}
          {canAct && r.status === 'sent' && (
            <button
              className="btn btn-sm btn-success"
              disabled={actionLoading === `${r.id}-paid`}
              onClick={(e) => { e.stopPropagation(); quickStatus(r, 'paid'); }}
              style={{ fontWeight: 700 }}
            >
              {actionLoading === `${r.id}-paid` ? '…' : 'Pay'}
            </button>
          )}

          <button
            className="btn btn-sm btn-outline"
            disabled={pdfLoading === r.id}
            onClick={(e) => { e.stopPropagation(); downloadPDF(r.id, r.invoice_number); }}
          >
            {pdfLoading === r.id ? '…' : 'Download PDF'}
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="page">
      {paidInvoice && (
        <PaidOverlay invoice={paidInvoice} onDone={() => setPaidInvoice(null)} />
      )}

      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        {isOfficer && <button className="btn btn-primary" onClick={openForm}>+ Create Invoice</button>}
      </div>

      <Table columns={cols} data={invoices} />

      {showForm && (
        <Modal title="Create Invoice" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={create} className="form-stack">

            <div>
              <label>Purchase Order</label>
              {pos.length === 0 ? (
                <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--muted)' }}>
                  No purchase orders found. Create a PO first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                  {pos.map((p) => {
                    const isSelected = selectedPO?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => selectPO(p)}
                        style={{
                          border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                          borderRadius: 10,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          background: isSelected ? '#fff7f3' : 'var(--surface)',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand)', fontSize: 13 }}>{p.po_number}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4, display: 'flex', gap: 16, color: 'var(--muted)' }}>
                          <span>{p.company_name || '—'}</span>
                          {p.rfq_title && <span>{p.rfq_title}</span>}
                          <span style={{ fontWeight: 600, color: 'var(--brand)' }}>₹{Number(p.total_amount ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedPO && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                ✓ <strong>{selectedPO.po_number}</strong> — {selectedPO.company_name} — ₹{Number(selectedPO.total_amount ?? 0).toLocaleString('en-IN')}
              </div>
            )}

            <div className="form-row">
              <div>
                <label>Subtotal (₹)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.subtotal}
                  onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                  required
                  placeholder="Auto-filled from PO"
                />
              </div>
              <div>
                <label>Tax (₹)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.tax}
                  onChange={(e) => setForm({ ...form, tax: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {form.subtotal && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--muted)' }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--brand)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div>
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <label>Notes (optional)</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any additional notes…" />
            </div>

            <button className="btn btn-primary" disabled={!selectedPO}>Create Invoice</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
