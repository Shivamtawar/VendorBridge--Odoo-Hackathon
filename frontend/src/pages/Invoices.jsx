import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { invoiceAPI, poAPI } from '../api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['issued', 'paid', 'cancelled'];

export default function Invoices() {
  const { user } = useAuth();
  const isOfficer = user?.role === 'procurement_officer';
  const [invoices, setInvoices] = useState([]);
  const [pos, setPOs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ po_id: '', subtotal: '', tax: '', due_date: '', notes: '' });
  const [statusModal, setStatusModal] = useState(null);
  const [err, setErr] = useState('');

  const load = () => invoiceAPI.list().then((r) => setInvoices(r.data.data?.invoices || r.data.data || []));
  useEffect(() => {
    load();
    if (isOfficer) poAPI.list().then((r) => setPOs(r.data.data?.purchase_orders || r.data.data || []));
  }, [isOfficer]);

  const create = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await invoiceAPI.create({ ...form, subtotal: Number(form.subtotal), tax: Number(form.tax) });
      setShowForm(false); setForm({ po_id: '', subtotal: '', tax: '', due_date: '', notes: '' }); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const updateStatus = async (id, status) => {
    await invoiceAPI.updateStatus(id, status); setStatusModal(null); load();
  };

  const cols = [
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'total', label: 'Total (₹)', render: (r) => `₹${Number(r.total).toLocaleString('en-IN')}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'due_date', label: 'Due Date', render: (r) => r.due_date ? new Date(r.due_date).toLocaleDateString() : '—' },
    {
      key: '_actions', label: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <a href={invoiceAPI.downloadUrl(r.id)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline" onClick={(e) => e.stopPropagation()}>PDF</a>
          {isOfficer && <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setStatusModal(r); }}>Status</button>}
        </div>
      )
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Invoices</h1>
        {isOfficer && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Invoice</button>}
      </div>
      <Table columns={cols} data={invoices} />

      {showForm && (
        <Modal title="Create Invoice" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={create} className="form-stack">
            <label>Purchase Order</label>
            <select value={form.po_id} onChange={(e) => setForm({ ...form, po_id: e.target.value })} required>
              <option value="">Select PO</option>
              {pos.map((p) => <option key={p.id} value={p.id}>{p.po_number} — {p.vendor_name}</option>)}
            </select>
            <div className="form-row">
              <div><label>Subtotal (₹)</label><input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} required /></div>
              <div><label>Tax (₹)</label><input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></div>
            </div>
            <label>Due Date</label>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            <button className="btn btn-primary">Create Invoice</button>
          </form>
        </Modal>
      )}

      {statusModal && (
        <Modal title={`Update Status — ${statusModal.invoice_number}`} onClose={() => setStatusModal(null)}>
          <div className="form-stack">
            {STATUSES.map((s) => (
              <button key={s} className={`btn ${statusModal.status === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => updateStatus(statusModal.id, s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
