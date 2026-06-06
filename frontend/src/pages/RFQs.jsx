import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { rfqAPI, vendorAPI } from '../api';
import api from '../api/client';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const empty = { title: '', description: '', quantity: '', unit: '', deadline: '', vendor_ids: [], items: [] };

export default function RFQs() {
  const { user } = useAuth();
  const isOfficer = user?.role === 'procurement_officer';
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [qrRFQ, setQrRFQ] = useState(null);
  const [qrSnapshot, setQrSnapshot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');

  const load = () => rfqAPI.list().then((r) => setRfqs(r.data.data?.rfqs || r.data.data || []));
  useEffect(() => {
    load();
    vendorAPI.list().then((r) => setVendors(r.data.data?.vendors || r.data.data || []));
  }, []);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await rfqAPI.create({ ...form, quantity: Number(form.quantity) });
      setShowForm(false); setForm(empty); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const publish = async (id) => { await rfqAPI.publish(id); load(); };
  const assignVendors = async (rfqId, vids) => { await rfqAPI.assignVendors(rfqId, vids); load(); setSelected(null); };

  const cols = [
    { key: 'title', label: 'Title', render: (r) => <span style={{fontWeight:600,color:'var(--text)'}}>{r.title}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'deadline', label: 'Deadline', render: (r) => r.deadline ? new Date(r.deadline).toLocaleDateString('en-IN') : '—' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit', label: 'Unit' },
    ...(isOfficer ? [{ key: '_actions', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        {r.status === 'draft' && <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); publish(r.id); }}>Publish</button>}
        <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>Assign Vendors</button>
      </div>
    )}] : []),
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>RFQs</h1>
          <p className="page-subtitle">Requests for Quotation</p>
        </div>
        {isOfficer && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create RFQ</button>}
      </div>
      <Table columns={cols} data={rfqs} />

      {showForm && (
        <Modal title="Create RFQ" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={save} className="form-stack">
            <div><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Office Furniture Procurement Q2" /></div>
            <div><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Detailed specifications…" /></div>
            <div className="form-row">
              <div><label>Quantity</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><label>Unit</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, sets…" /></div>
            </div>
            <div><label>Deadline</label><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            <button className="btn btn-primary">Create RFQ</button>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={`Assign Vendors — ${selected.title}`} onClose={() => setSelected(null)}>
          <AssignVendors rfq={selected} vendors={vendors} onAssign={assignVendors} />
        </Modal>
      )}

      {qrRFQ && (
        <Modal title={`QR Code — ${qrRFQ.title}`} onClose={() => { setQrRFQ(null); setQrSnapshot(null); }}>
          <RFQQRModal rfq={qrRFQ} snapshot={qrSnapshot} />
        </Modal>
      )}
    </div>
  );
}

function RFQQRModal({ rfq, snapshot }) {
  const [qrObjectUrl, setQrObjectUrl] = useState(null);

  useEffect(() => {
    api.get(`/rfqs/${rfq.id}/qr`, { responseType: 'blob' })
      .then((res) => setQrObjectUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
    return () => { if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl); };
  }, [rfq.id]);

  return (
    <div className="qr-modal">
      <div className="qr-image-wrap">
        {qrObjectUrl
          ? <img src={qrObjectUrl} alt="RFQ QR Code" className="qr-img" />
          : <div className="qr-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>Loading…</div>
        }
        {qrObjectUrl && (
          <a href={qrObjectUrl} download={`rfq-${rfq.id}-qr.png`} className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
            Download QR
          </a>
        )}
      </div>

      {snapshot ? (
        <div className="qr-snapshot">
          <SnapSection title="RFQ Info">
            <SnapRow label="ID" value={snapshot.id} mono />
            <SnapRow label="Title" value={snapshot.title} />
            <SnapRow label="Status" value={snapshot.status} />
            <SnapRow label="Created By" value={snapshot.created_by} />
            <SnapRow label="Quantity" value={`${snapshot.quantity} ${snapshot.unit}`} />
            <SnapRow label="Deadline" value={snapshot.deadline ? new Date(snapshot.deadline).toLocaleDateString() : '—'} />
          </SnapSection>

          {snapshot.vendors_assigned?.length > 0 && (
            <SnapSection title="Vendors Assigned">
              {snapshot.vendors_assigned.map((v, i) => <div key={i} className="snap-tag">{v}</div>)}
            </SnapSection>
          )}

          {snapshot.quotations?.length > 0 && (
            <SnapSection title="Quotations">
              {snapshot.quotations.map((q, i) => (
                <div key={i} className="snap-card">
                  <SnapRow label="Vendor" value={q.vendor} />
                  <SnapRow label="Amount" value={q.amount} />
                  <SnapRow label="Delivery" value={`${q.delivery_days} days`} />
                  <SnapRow label="Status" value={q.status} />
                </div>
              ))}
            </SnapSection>
          )}

          {snapshot.approvals?.length > 0 && (
            <SnapSection title="Approvals">
              {snapshot.approvals.map((a, i) => (
                <div key={i} className="snap-card">
                  <SnapRow label="Status" value={a.status} />
                  <SnapRow label="Approved By" value={a.approved_by || '—'} />
                  <SnapRow label="Remarks" value={a.remarks || '—'} />
                </div>
              ))}
            </SnapSection>
          )}

          {snapshot.purchase_orders?.length > 0 && (
            <SnapSection title="Purchase Orders">
              {snapshot.purchase_orders.map((p, i) => (
                <div key={i} className="snap-card">
                  <SnapRow label="PO Number" value={p.po_number} mono />
                  <SnapRow label="Vendor" value={p.vendor} />
                  <SnapRow label="Amount" value={p.amount} />
                  <SnapRow label="Status" value={p.status} />
                  <SnapRow label="Expected Delivery" value={p.expected_delivery ? new Date(p.expected_delivery).toLocaleDateString() : '—'} />
                </div>
              ))}
            </SnapSection>
          )}

          {snapshot.invoices?.length > 0 && (
            <SnapSection title="Invoices">
              {snapshot.invoices.map((inv, i) => (
                <div key={i} className="snap-card">
                  <SnapRow label="Invoice #" value={inv.invoice_number} mono />
                  <SnapRow label="Total" value={inv.total} />
                  <SnapRow label="Status" value={inv.status} />
                  <SnapRow label="Due Date" value={inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'} />
                </div>
              ))}
            </SnapSection>
          )}

          <p className="snap-footer">Generated at {new Date(snapshot.generated_at).toLocaleString()}</p>
        </div>
      ) : (
        <div className="loading" style={{ padding: 20 }}>Loading snapshot…</div>
      )}
    </div>
  );
}

function SnapSection({ title, children }) {
  return (
    <div className="snap-section">
      <div className="snap-section-title">{title}</div>
      {children}
    </div>
  );
}

function SnapRow({ label, value, mono }) {
  return (
    <div className="snap-row">
      <span className="snap-label">{label}</span>
      <span className={`snap-value${mono ? ' snap-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

function AssignVendors({ rfq, vendors, onAssign }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const toggle = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  return (
    <div className="form-stack">
      <p style={{color:'var(--muted)',fontSize:13}}>Select vendors to receive this RFQ:</p>
      <div className="vendor-checklist">
        {vendors.map((v) => (
          <label key={v.id} className="check-item">
            <input type="checkbox" checked={selectedIds.includes(v.id)} onChange={() => toggle(v.id)} />
            <span style={{fontWeight:500}}>{v.company_name}</span>
            <span className="text-muted" style={{fontSize:12}}>({v.category || 'Uncategorized'})</span>
          </label>
        ))}
      </div>
      <button className="btn btn-primary" disabled={!selectedIds.length} onClick={() => onAssign(rfq.id, selectedIds)}>
        Assign {selectedIds.length} vendor{selectedIds.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
}
