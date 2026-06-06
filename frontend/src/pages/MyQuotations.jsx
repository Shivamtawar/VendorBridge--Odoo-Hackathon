import { useEffect, useState } from 'react';
import { quotationAPI, rfqAPI } from '../api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const emptyForm = { rfq_id: '', price: '', delivery_days: '', notes: '' };

export default function MyQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => quotationAPI.myQuotations().then((r) => setQuotations(r.data.data || []));

  useEffect(() => {
    load();
    // load vendor's assigned RFQs (published ones they can quote on)
    rfqAPI.list().then((r) => {
      const all = r.data.data?.rfqs || r.data.data || [];
      setRfqs(all.filter((rfq) => rfq.status === 'published' || rfq.status === 'open'));
    });
  }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setErr(''); setShowForm(true); };
  const openEdit = (q) => {
    if (q.status !== 'submitted') return;
    setEditing(q);
    setForm({ rfq_id: q.rfq_id, price: q.price ?? q.total_amount ?? '', delivery_days: q.delivery_days, notes: q.notes || '' });
    setErr('');
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      if (editing) {
        await quotationAPI.update(editing.id, { price: Number(form.price), delivery_days: Number(form.delivery_days), notes: form.notes });
      } else {
        await quotationAPI.submit({ rfq_id: form.rfq_id, price: Number(form.price), delivery_days: Number(form.delivery_days), notes: form.notes });
      }
      setShowForm(false); setForm(emptyForm); load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const cols = [
    { key: 'rfq_title', label: 'RFQ', render: (r) => <span style={{ fontWeight: 600 }}>{r.rfq_title}</span> },
    { key: 'price', label: 'Your Price (₹)', render: (r) => <span style={{ fontWeight: 700, color: 'var(--brand)' }}>₹{Number(r.price ?? r.total_amount ?? 0).toLocaleString('en-IN')}</span> },
    { key: 'delivery_days', label: 'Delivery (days)' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Submitted', render: (r) => new Date(r.created_at).toLocaleDateString('en-IN') },
    {
      key: '_edit', label: '',
      render: (r) => r.status === 'submitted' ? (
        <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</button>
      ) : null
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Quotations</h1>
          <p className="page-subtitle">{quotations.length} submitted quotation{quotations.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Submit Quotation</button>
      </div>

      <Table columns={cols} data={quotations} />

      {showForm && (
        <Modal title={editing ? 'Edit Quotation' : 'Submit Quotation'} onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={submit} className="form-stack">
            <div>
              <label>RFQ</label>
              {editing ? (
                <input value={quotations.find((q) => q.id === editing.id)?.rfq_title || form.rfq_id} disabled />
              ) : (
                <select value={form.rfq_id} onChange={set('rfq_id')} required>
                  <option value="">— select an RFQ —</option>
                  {rfqs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              )}
              {!editing && rfqs.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>No published RFQs available to quote on yet.</p>
              )}
            </div>
            <div className="form-row">
              <div>
                <label>Your Price (₹)</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required placeholder="e.g. 50000" />
              </div>
              <div>
                <label>Delivery Days</label>
                <input type="number" min="1" value={form.delivery_days} onChange={set('delivery_days')} required placeholder="e.g. 14" />
              </div>
            </div>
            <div>
              <label>Notes / Terms</label>
              <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Any special conditions, warranty, payment terms…" />
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : editing ? 'Update Quotation' : 'Submit Quotation'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
