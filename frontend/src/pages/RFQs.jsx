import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { rfqAPI, vendorAPI } from '../api';
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

  const publish = async (id) => {
    await rfqAPI.publish(id); load();
  };

  const assignVendors = async (rfqId, vids) => {
    await rfqAPI.assignVendors(rfqId, vids); load(); setSelected(null);
  };

  const cols = [
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'deadline', label: 'Deadline', render: (r) => r.deadline ? new Date(r.deadline).toLocaleDateString() : '—' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit', label: 'Unit' },
    ...(isOfficer ? [{
      key: '_actions', label: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {r.status === 'draft' && <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); publish(r.id); }}>Publish</button>}
          <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>Assign Vendors</button>
        </div>
      )
    }] : []),
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>RFQs</h1>
        {isOfficer && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create RFQ</button>}
      </div>
      <Table columns={cols} data={rfqs} />

      {showForm && (
        <Modal title="Create RFQ" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={save} className="form-stack">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            <div className="form-row">
              <div><label>Quantity</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><label>Unit</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg…" /></div>
            </div>
            <label>Deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <button className="btn btn-primary">Create</button>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={`Assign Vendors — ${selected.title}`} onClose={() => setSelected(null)}>
          <AssignVendors rfq={selected} vendors={vendors} onAssign={assignVendors} />
        </Modal>
      )}
    </div>
  );
}

function AssignVendors({ rfq, vendors, onAssign }) {
  const [selected, setSelected] = useState([]);
  const toggle = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  return (
    <div className="form-stack">
      <p>Select vendors to assign to this RFQ:</p>
      <div className="vendor-checklist">
        {vendors.map((v) => (
          <label key={v.id} className="check-item">
            <input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggle(v.id)} />
            {v.company_name} <span className="text-muted">({v.category})</span>
          </label>
        ))}
      </div>
      <button className="btn btn-primary" disabled={!selected.length} onClick={() => onAssign(rfq.id, selected)}>
        Assign {selected.length} vendor{selected.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
}
