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

  const processApproval = async (e) => {
    e.preventDefault(); setErr('');
    try { await approvalAPI.process(processModal.id, decision); setProcessModal(null); load(); }
    catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const cols = [
    { key: 'quotation_id', label: 'Quotation', render: (r) => <code style={{fontSize:11,background:'var(--surface-2)',padding:'2px 6px',borderRadius:4}}>{r.quotation_id?.slice(0, 8)}…</code> },
    { key: 'requested_by_name', label: 'Requested By' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'remarks', label: 'Remarks', render: (r) => <span style={{color:'var(--muted)',fontSize:12}}>{r.remarks || '—'}</span> },
    { key: 'created_at', label: 'Date', render: (r) => new Date(r.created_at).toLocaleDateString('en-IN') },
    ...(canApprove ? [{ key: '_actions', label: '', render: (r) => r.status === 'pending' ? (
      <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setProcessModal(r); setDecision({ action: 'approved', remarks: '' }); }}>Review</button>
    ) : null }] : []),
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
      <Table columns={cols} data={approvals} />

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
                {quotations.map((q) => <option key={q.id} value={q.id}>₹{Number(q.total_amount).toLocaleString('en-IN')} — {q.vendor_name}</option>)}
              </select>
            </div>
            <div><label>Remarks</label><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} /></div>
            <button className="btn btn-primary">Submit for Approval</button>
          </form>
        </Modal>
      )}

      {processModal && (
        <Modal title="Process Approval" onClose={() => setProcessModal(null)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={processApproval} className="form-stack">
            <div>
              <label>Decision</label>
              <select value={decision.action} onChange={(e) => setDecision({ ...decision, action: e.target.value })}>
                <option value="approved">✅ Approve</option>
                <option value="rejected">❌ Reject</option>
              </select>
            </div>
            <div><label>Remarks</label><textarea value={decision.remarks} onChange={(e) => setDecision({ ...decision, remarks: e.target.value })} rows={3} placeholder="Optional remarks…" /></div>
            <button className={`btn ${decision.action === 'approved' ? 'btn-success' : 'btn-danger'}`}>
              {decision.action === 'approved' ? '✅ Approve' : '❌ Reject'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
