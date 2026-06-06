import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { quotationAPI, rfqAPI } from '../api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

export default function Quotations() {
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';
  const [rfqs, setRfqs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rfq_id: '', total_amount: '', delivery_days: '', notes: '' });
  const [err, setErr] = useState('');

  useEffect(() => {
    rfqAPI.list().then((r) => {
      const list = r.data.data?.rfqs || r.data.data || [];
      setRfqs(list);
    });
  }, []);

  useEffect(() => {
    if (!selectedRFQ) { setQuotations([]); return; }
    const fn = isVendor ? null : () => quotationAPI.byRFQ(selectedRFQ);
    if (fn) fn().then((r) => setQuotations(r.data.data || []));
  }, [selectedRFQ, isVendor]);

  const submitQuote = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await quotationAPI.submit({ ...form, total_amount: Number(form.total_amount), delivery_days: Number(form.delivery_days) });
      setShowForm(false); setForm({ rfq_id: '', total_amount: '', delivery_days: '', notes: '' });
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const cols = [
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'total_amount', label: 'Amount (₹)', render: (r) => `₹${Number(r.total_amount).toLocaleString('en-IN')}` },
    { key: 'delivery_days', label: 'Delivery (days)' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Submitted', render: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  const publishedRFQs = rfqs.filter((r) => r.status === 'published');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quotations</h1>
        {isVendor && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Submit Quotation</button>}
      </div>

      {!isVendor && (
        <div className="filter-bar">
          <label>Select RFQ:</label>
          <select value={selectedRFQ} onChange={(e) => setSelectedRFQ(e.target.value)}>
            <option value="">— pick an RFQ —</option>
            {rfqs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
      )}

      <Table columns={cols} data={quotations} />

      {showForm && (
        <Modal title="Submit Quotation" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={submitQuote} className="form-stack">
            <label>RFQ</label>
            <select value={form.rfq_id} onChange={(e) => setForm({ ...form, rfq_id: e.target.value })} required>
              <option value="">Select RFQ</option>
              {publishedRFQs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
            <label>Total Amount (₹)</label>
            <input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
            <label>Delivery Days</label>
            <input type="number" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} required />
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            <button className="btn btn-primary">Submit</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
