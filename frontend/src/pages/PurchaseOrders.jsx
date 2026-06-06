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
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [form, setForm] = useState({ delivery_address: '', notes: '', expected_delivery: '' });
  const [statusModal, setStatusModal] = useState(null);
  const [err, setErr] = useState('');

  const load = () => poAPI.list().then((r) => setPOs(r.data.data?.purchase_orders || r.data.data || []));

  useEffect(() => {
    load();
    if (isOfficer) {
      approvalAPI.list().then((r) => {
        const all = r.data.data?.approvals || r.data.data || [];
        setApprovals(all.filter((a) => a.status === 'approved'));
      });
    }
  }, [isOfficer]);

  const openForm = () => {
    setSelectedApproval(null);
    setForm({ delivery_address: '', notes: '', expected_delivery: '' });
    setErr('');
    setShowForm(true);
  };

  const create = async (e) => {
    e.preventDefault(); setErr('');
    if (!selectedApproval) { setErr('Please select an approved quotation'); return; }
    try {
      await poAPI.create({ quotation_id: selectedApproval.quotation_id, notes: form.notes });
      setShowForm(false); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const updateStatus = async (id, status) => { await poAPI.updateStatus(id, status); setStatusModal(null); load(); };

  const cols = [
    { key: 'po_number', label: 'PO Number', render: (r) => <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand)' }}>{r.po_number}</span> },
    { key: 'company_name', label: 'Vendor', render: (r) => <span style={{ fontWeight: 500 }}>{r.company_name || r.vendor_name || '—'}</span> },
    { key: 'total_amount', label: 'Amount (₹)', render: (r) => <span style={{ fontWeight: 600 }}>₹{Number(r.total_amount ?? 0).toLocaleString('en-IN')}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'expected_delivery', label: 'Expected Delivery', render: (r) => r.expected_delivery ? new Date(r.expected_delivery).toLocaleDateString('en-IN') : '—' },
    ...(isOfficer ? [{ key: '_actions', label: '', render: (r) => (
      <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setStatusModal(r); }}>Update Status</button>
    )}] : []),
  ];

  const statusColors = { draft: 'btn-outline', sent: 'btn-outline', acknowledged: 'btn-outline', completed: 'btn-success', cancelled: 'btn-danger' };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Purchase Orders</h1>
          <p className="page-subtitle">{pos.length} purchase order{pos.length !== 1 ? 's' : ''}</p>
        </div>
        {isOfficer && <button className="btn btn-primary" onClick={openForm}>+ Create PO</button>}
      </div>
      <Table columns={cols} data={pos} />

      {showForm && (
        <Modal title="Create Purchase Order" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={create} className="form-stack">
            <div>
              <label>Approved Quotation</label>
              {approvals.length === 0 ? (
                <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--muted)' }}>
                  No approved quotations yet. Manager must approve a quotation first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {approvals.map((a) => {
                    const isSelected = selectedApproval?.id === a.id;
                    return (
                      <div
                        key={a.id}
                        onClick={() => setSelectedApproval(a)}
                        style={{
                          border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                          borderRadius: 10,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          background: isSelected ? '#fff7f3' : 'var(--surface)',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{a.rfq_title || 'RFQ'}</div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)' }}>
                          <span>{a.company_name}</span>
                          <span style={{ fontWeight: 600, color: 'var(--brand)' }}>₹{Number(a.price ?? 0).toLocaleString('en-IN')}</span>
                          {a.delivery_days && <span>Delivery: {a.delivery_days} days</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedApproval && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                ✓ Selected: <strong>{selectedApproval.rfq_title}</strong> from <strong>{selectedApproval.company_name}</strong> — ₹{Number(selectedApproval.price ?? 0).toLocaleString('en-IN')}
              </div>
            )}

            <div>
              <label>Notes (optional)</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any special delivery instructions…" />
            </div>

            <button className="btn btn-primary" disabled={!selectedApproval}>Create Purchase Order</button>
          </form>
        </Modal>
      )}

      {statusModal && (
        <Modal title={`Update Status — ${statusModal.po_number}`} onClose={() => setStatusModal(null)}>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>Current: <StatusBadge status={statusModal.status} /></p>
          <div className="form-stack">
            {STATUSES.map((s) => (
              <button key={s} className={`btn ${statusModal.status === s ? 'btn-primary' : statusColors[s] || 'btn-outline'}`} onClick={() => updateStatus(statusModal.id, s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
