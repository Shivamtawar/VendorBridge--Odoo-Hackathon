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
  const [comparison, setComparison] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [form, setForm] = useState({ rfq_id: '', total_amount: '', delivery_days: '', notes: '' });
  const [err, setErr] = useState('');

  useEffect(() => {
    rfqAPI.list().then((r) => setRfqs(r.data.data?.rfqs || r.data.data || []));
  }, []);

  useEffect(() => {
    if (!selectedRFQ) { setQuotations([]); return; }
    if (!isVendor) quotationAPI.byRFQ(selectedRFQ).then((r) => setQuotations(r.data.data || []));
  }, [selectedRFQ, isVendor]);

  const submitQuote = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await quotationAPI.submit({ ...form, total_amount: Number(form.total_amount), delivery_days: Number(form.delivery_days) });
      setShowForm(false); setForm({ rfq_id: '', total_amount: '', delivery_days: '', notes: '' });
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const loadComparison = async () => {
    if (!selectedRFQ) return;
    const r = await quotationAPI.compare(selectedRFQ);
    setComparison(r.data.data || []);
    setShowCompare(true);
  };

  const publishedRFQs = rfqs.filter((r) => r.status === 'published');
  const minAmount = comparison.length ? Math.min(...comparison.map(q => Number(q.total_amount))) : null;

  const cols = [
    { key: 'vendor_name', label: 'Vendor', render: (r) => <span style={{fontWeight:600}}>{r.vendor_name}</span> },
    { key: 'total_amount', label: 'Amount (₹)', render: (r) => <span style={{fontWeight:600}}>₹{Number(r.total_amount).toLocaleString('en-IN')}</span> },
    { key: 'delivery_days', label: 'Delivery (days)' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Submitted', render: (r) => new Date(r.created_at).toLocaleDateString('en-IN') },
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

      {!isVendor && (
        <div className="filter-bar">
          <label>Select RFQ:</label>
          <select value={selectedRFQ} onChange={(e) => setSelectedRFQ(e.target.value)}>
            <option value="">— choose an RFQ —</option>
            {rfqs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          {selectedRFQ && quotations.length >= 2 && (
            <button className="btn btn-outline" onClick={loadComparison}>📊 Compare Quotations</button>
          )}
        </div>
      )}

      <Table columns={cols} data={quotations} />

      {showForm && (
        <Modal title="Submit Quotation" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={submitQuote} className="form-stack">
            <div>
              <label>RFQ</label>
              <select value={form.rfq_id} onChange={(e) => setForm({ ...form, rfq_id: e.target.value })} required>
                <option value="">Select RFQ</option>
                {publishedRFQs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div><label>Total Amount (₹)</label><input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required /></div>
              <div><label>Delivery Days</label><input type="number" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} required /></div>
            </div>
            <div><label>Notes / Comments</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any special terms or conditions…" /></div>
            <button className="btn btn-primary">Submit Quotation</button>
          </form>
        </Modal>
      )}

      {showCompare && (
        <Modal title="Quotation Comparison" onClose={() => setShowCompare(false)} wide>
          <div className="table-wrap" style={{margin:0}}>
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Amount (₹)</th>
                  <th>Delivery (days)</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((q) => {
                  const isLowest = Number(q.total_amount) === minAmount;
                  return (
                    <tr key={q.id} className={isLowest ? 'highlight-row' : ''}>
                      <td style={{fontWeight:600}}>{q.vendor_name} {isLowest && <span style={{fontSize:10,background:'#d1fae5',color:'#065f46',padding:'1px 6px',borderRadius:3,fontWeight:700,marginLeft:4}}>LOWEST</span>}</td>
                      <td><span className={isLowest ? 'compare-winner' : ''}>₹{Number(q.total_amount).toLocaleString('en-IN')}</span></td>
                      <td>{q.delivery_days} days</td>
                      <td><StatusBadge status={q.status} /></td>
                      <td style={{color:'var(--muted)',maxWidth:200,fontSize:12}}>{q.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
