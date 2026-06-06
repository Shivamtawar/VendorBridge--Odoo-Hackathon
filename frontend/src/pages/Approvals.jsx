import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { approvalAPI, quotationAPI, rfqAPI } from '../api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

export default function Approvals() {
  const { user } = useAuth();
  const isOfficer = user?.role === 'procurement_officer';
  const canApprove = user?.role === 'manager' || user?.role === 'admin';
  const [approvals, setApprovals] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ quotation_id: '', remarks: '' });
  const [processModal, setProcessModal] = useState(null);
  const [decision, setDecision] = useState({ action: 'approved', remarks: '' });
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState('');

  const load = () => approvalAPI.list().then((r) => setApprovals(r.data.data?.approvals || r.data.data || []));
  useEffect(() => {
    load();
    if (isOfficer) rfqAPI.list().then((r) => setRfqs(r.data.data?.rfqs || r.data.data || []));
  }, [isOfficer]);

  const onRFQChange = async (rfqId) => {
    if (!rfqId) { setQuotations([]); return; }
    const r = await quotationAPI.byRFQ(rfqId);
    setQuotations(r.data.data || []);
  };

  const requestApproval = async (e) => {
    e.preventDefault(); setErr('');
    try { await approvalAPI.request(form); setShowForm(false); setForm({ quotation_id: '', remarks: '' }); load(); }
    catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const openProcess = (approval, action) => {
    setProcessModal(approval);
    setDecision({ action, remarks: '' });
    setErr('');
  };

  const processApproval = async (action) => {
    setErr(''); setProcessing(true);
    try {
      await approvalAPI.process(processModal.id, { action, remarks: decision.remarks });
      setProcessModal(null); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
    finally { setProcessing(false); }
  };

  const pending = approvals.filter((a) => a.status === 'pending');
  const rest = approvals.filter((a) => a.status !== 'pending');

  const cols = [
    { key: 'rfq_title', label: 'RFQ', render: (r) => <span style={{ fontWeight: 600 }}>{r.rfq_title || '—'}</span> },
    { key: 'company_name', label: 'Vendor', render: (r) => r.company_name || '—' },
    { key: 'price', label: 'Amount (₹)', render: (r) => r.price ? <span style={{ fontWeight: 600, color: 'var(--brand)' }}>₹{Number(r.price).toLocaleString('en-IN')}</span> : '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'remarks', label: 'Remarks', render: (r) => <span style={{ color: 'var(--muted)', fontSize: 12 }}>{r.remarks || '—'}</span> },
    { key: 'created_at', label: 'Date', render: (r) => new Date(r.created_at).toLocaleDateString('en-IN') },
    ...(canApprove ? [{
      key: '_actions', label: '',
      render: (r) => r.status === 'pending' ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-success" onClick={(e) => { e.stopPropagation(); openProcess(r, 'approved'); }}>✓ Approve</button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); openProcess(r, 'rejected'); }}>✕ Reject</button>
        </div>
      ) : null
    }] : []),
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Approvals</h1>
          <p className="page-subtitle">Quotation approval workflow</p>
        </div>
        {isOfficer && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Request Approval</button>}
      </div>

      {/* Pending banner for manager */}
      {canApprove && pending.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, color: '#92400e' }}>{pending.length} approval{pending.length > 1 ? 's' : ''} waiting for your review</span>
        </div>
      )}

      {/* Pending section */}
      {canApprove && pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ marginTop: 0 }}>Pending Review</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((a) => (
              <div key={a.id} style={{ background: 'var(--surface)', border: '1.5px solid #fde68a', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{a.rfq_title || 'RFQ'}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 16 }}>
                    <span>{a.company_name}</span>
                    {a.price && <span>₹{Number(a.price).toLocaleString('en-IN')}</span>}
                    {a.delivery_days && <span>{a.delivery_days} days delivery</span>}
                    <span>{new Date(a.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  {a.remarks && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>"{a.remarks}"</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-success" onClick={() => openProcess(a, 'approved')}>✓ Approve</button>
                  <button className="btn btn-danger" onClick={() => openProcess(a, 'rejected')}>✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All approvals table */}
      <h2 style={{ marginTop: 0 }}>All Approvals</h2>
      <Table columns={cols} data={approvals} />

      {/* Officer: request approval form */}
      {showForm && (
        <Modal title="Request Approval" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={requestApproval} className="form-stack">
            <div>
              <label>RFQ</label>
              <select onChange={(e) => onRFQChange(e.target.value)}>
                <option value="">Select RFQ</option>
                {rfqs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div>
              <label>Quotation</label>
              <select value={form.quotation_id} onChange={(e) => setForm({ ...form, quotation_id: e.target.value })} required>
                <option value="">Select Quotation</option>
                {quotations.map((q) => <option key={q.id} value={q.id}>
                  ₹{Number(q.price ?? q.total_amount ?? 0).toLocaleString('en-IN')} — {q.vendor_name || q.company_name}
                </option>)}
              </select>
            </div>
            <div><label>Remarks</label><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} placeholder="Why this quotation?" /></div>
            <button className="btn btn-primary">Submit for Approval</button>
          </form>
        </Modal>
      )}

      {/* Manager: approve / reject modal */}
      {processModal && (
        <Modal title="Review Approval" onClose={() => setProcessModal(null)}>
          {err && <div className="alert alert-error">{err}</div>}

          {/* Summary card */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{processModal.rfq_title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>Vendor</span><span style={{ fontWeight: 600 }}>{processModal.company_name}</span>
              <span style={{ color: 'var(--muted)' }}>Quoted Price</span><span style={{ fontWeight: 700, color: 'var(--brand)' }}>{processModal.price ? `₹${Number(processModal.price).toLocaleString('en-IN')}` : '—'}</span>
              <span style={{ color: 'var(--muted)' }}>Delivery</span><span>{processModal.delivery_days ? `${processModal.delivery_days} days` : '—'}</span>
              <span style={{ color: 'var(--muted)' }}>Requested on</span><span>{new Date(processModal.created_at).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          <div className="form-stack">
            <div>
              <label>Remarks (optional)</label>
              <textarea value={decision.remarks} onChange={(e) => setDecision({ ...decision, remarks: e.target.value })} rows={3} placeholder="Add a note for the procurement officer…" autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success w-full" disabled={processing} onClick={() => processApproval('approved')}>
                {processing && decision.action === 'approved' ? 'Approving…' : '✓ Approve'}
              </button>
              <button className="btn btn-danger w-full" disabled={processing} onClick={() => processApproval('rejected')}>
                {processing && decision.action === 'rejected' ? 'Rejecting…' : '✕ Reject'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
