import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { vendorAPI } from '../api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const emptyForm = { company_name: '', gst_number: '', contact_person: '', email: '', phone: '', address: '', category: '' };

export default function Vendors() {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'procurement_officer';
  const canDelete = user?.role === 'admin';
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');

  const load = () => vendorAPI.list().then((r) => setVendors(r.data.data?.vendors || r.data.data || []));
  useEffect(() => { load(); }, []);

  const openEdit = (v) => { setEditing(v); setForm({ company_name: v.company_name, gst_number: v.gst_number || '', contact_person: v.contact_person || '', email: v.email || '', phone: v.phone || '', address: v.address || '', category: v.category || '' }); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      editing ? await vendorAPI.update(editing.id, form) : await vendorAPI.create(form);
      setShowForm(false); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Error saving vendor'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    await vendorAPI.delete(id); load();
  };

  const filtered = vendors.filter(v => !search || v.company_name?.toLowerCase().includes(search.toLowerCase()) || v.category?.toLowerCase().includes(search.toLowerCase()));

  const cols = [
    { key: 'company_name', label: 'Company', render: (r) => <span style={{fontWeight:600,color:'var(--text)'}}>{r.company_name}</span> },
    { key: 'category', label: 'Category', render: (r) => r.category ? <span style={{background:'var(--surface-2)',color:'var(--muted)',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600}}>{r.category}</span> : '—' },
    { key: 'contact_person', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    ...(canEdit ? [{ key: '_actions', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</button>
        {canDelete && <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); remove(r.id); }}>Delete</button>}
      </div>
    )}] : []),
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Vendors</h1>
          <p className="page-subtitle">{vendors.length} registered vendor{vendors.length !== 1 ? 's' : ''}</p>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={openNew}>+ Add Vendor</button>}
      </div>
      <div className="filter-bar">
        <input style={{maxWidth:300}} placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Table columns={cols} data={filtered} />

      {showForm && (
        <Modal title={editing ? 'Edit Vendor' : 'Add Vendor'} onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={save} className="form-stack">
            <div className="form-row">
              <div><label>Company Name</label><input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required /></div>
              <div><label>GST Number</label><input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div><label>Contact Person</label><input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="IT, Manufacturing…" /></div>
            </div>
            <div><label>Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <button className="btn btn-primary">{editing ? 'Save Changes' : 'Add Vendor'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
