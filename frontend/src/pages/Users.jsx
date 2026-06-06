import { useEffect, useState } from 'react';
import { userAPI } from '../api';
import Table from '../components/Table';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const ROLES = ['admin', 'procurement_officer', 'manager', 'vendor'];
const emptyForm = { name: '', email: '', password: '', role: 'procurement_officer' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [err, setErr] = useState('');

  const load = () => userAPI.list().then((r) => setUsers(r.data.data?.users || r.data.data || []));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await userAPI.create(form);
      setShowForm(false); setForm(emptyForm); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  const toggle = async (u) => {
    await userAPI.update(u.id, { is_active: !u.is_active }); load();
  };

  const remove = async (id) => {
    if (!confirm('Delete user?')) return;
    await userAPI.delete(id); load();
  };

  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => r.role.replace('_', ' ') },
    { key: 'is_active', label: 'Active', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'cancelled'} /> },
    {
      key: '_actions', label: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); toggle(r); }}>
            {r.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); remove(r.id); }}>Delete</button>
        </div>
      )
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add User</button>
      </div>
      <Table columns={cols} data={users} />

      {showForm && (
        <Modal title="Add User" onClose={() => setShowForm(false)}>
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={save} className="form-stack">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
            <button className="btn btn-primary">Create User</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
