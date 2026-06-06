import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { poAPI, approvalAPI } from '../api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['draft', 'sent', 'acknowledged', 'completed', 'cancelled'];

export default function PurchaseOrders() {
  const { user } = useAuth();
  const isOfficer = user?.role === 'procurement_officer';
  const [pos, setPOs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ approval_id: '', delivery_address: '', terms: '', expected_delivery: '' });
  const [statusModal, setStatusModal] = useState(null);
  const [err, setErr] = useState('');

  const load = () => poAPI.list().then((r) => setPOs(r.data.data?.purchase_orders || r.data.data || []));
  useEffect(() => {
    load();
    if (isOfficer) approvalAPI.list().then((r) => setApprovals(r.data.data?.approvals || r.data.data || []));
  }, [isOfficer]);

  const create = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await poAPI.create(form);
      setShowForm(false); setForm({ approval_id: '', delivery_address: '', terms: '', expected_delivery: '' }); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const updateStatus = async (id, status) => {
    await poAPI.updateStatus(id, status); setStatusModal(null); load();
  };

  const approved = approvals.filter((a) => a.status === 'approved');

  const cols = [
    { key: 'po_number', label: 'PO Number' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'total_amount', label: 'Amount (₹)', render: (r) => `₹${Number(r.total_amount).toLocaleString('en-IN')}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'expected_delivery', label: 'Expected Delivery', render: (r) => r.expected_delivery ? new Date(r.expected_delivery).toLocaleDateString() : '—' },
    ...(isOfficer ? [{
      key: '_actions', label: '',
      render: (r) => (
        <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setStatusModal(r); }}>Update Status</button>
      )
    }] : []),
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Purchase Orders</h1>
        {isOfficer && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create PO</button>}
      </div>
      <Table columns={cols} data={pos} />

      {showForm && (
        <Modal title="Create Purchase Order" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={create} className="form-stack">
            <label>Approved Quotation</label>
            <select value={form.approval_id} onChange={(e) => setForm({ ...form, approval_id: e.target.value })} required>
              <option value="">Select approved quotation</option>
              {approved.map((a) => <option key={a.id} value={a.id}>Approval — {a.id.slice(0, 8)}… </option>)}
            </select>
            <label>Delivery Address</label>
            <input value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} />
            <label>Terms</label>
            <textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} />
            <label>Expected Delivery</label>
            <input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} />
            <button className="btn btn-primary">Create PO</button>
          </form>
        </Modal>
      )}

      {statusModal && (
        <Modal title={`Update Status — ${statusModal.po_number}`} onClose={() => setStatusModal(null)}>
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
