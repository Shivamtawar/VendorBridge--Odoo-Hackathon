import { useEffect, useState } from 'react';
import { vendorAPI } from '../api';

export default function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    vendorAPI.profile().then((r) => {
      setProfile(r.data.data);
      setForm(r.data.data);
    }).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    try {
      const r = await vendorAPI.update(profile.id, form);
      setProfile(r.data.data); setEditing(false); setOk('Profile updated.');
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  if (!profile) return <div className="loading">Loading profile…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Vendor Profile</h1>
        {!editing && <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit</button>}
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}

      {editing ? (
        <form onSubmit={save} className="form-stack profile-form">
          {[['company_name','Company Name'],['gst_number','GST Number'],['contact_person','Contact Person'],['email','Email'],['phone','Phone'],['category','Category'],['address','Address']].map(([k, label]) => (
            <div key={k}>
              <label>{label}</label>
              <input value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-view">
          {[['Company Name', profile.company_name],['GST Number', profile.gst_number],['Contact Person', profile.contact_person],['Email', profile.email],['Phone', profile.phone],['Category', profile.category],['Address', profile.address],['Status', profile.status]].map(([label, val]) => (
            <div key={label} className="profile-row">
              <span className="profile-label">{label}</span>
              <span className="profile-value">{val || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
