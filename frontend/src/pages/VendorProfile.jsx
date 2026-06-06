import { useEffect, useState } from 'react';
import { vendorAPI } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    vendorAPI.profile().then((r) => { setProfile(r.data.data); setForm(r.data.data); }).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    try {
      const r = await vendorAPI.update(profile.id, form);
      setProfile(r.data.data); setEditing(false); setOk('Profile updated successfully.');
    } catch (ex) { setErr(ex.response?.data?.message || 'Error'); }
  };

  if (!profile) return <div className="page"><div className="loading"><div className="loading-spinner" /><span>Loading profile…</span></div></div>;

  const fields = [['company_name','Company Name'],['gst_number','GST Number'],['contact_person','Contact Person'],['email','Email'],['phone','Phone'],['category','Category'],['address','Address']];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Vendor Profile</h1>
          <p className="page-subtitle">{profile.company_name}</p>
        </div>
        {!editing && <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit Profile</button>}
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}

      {editing ? (
        <form onSubmit={save} className="form-stack profile-form">
          {fields.map(([k, label]) => (
            <div key={k}><label>{label}</label><input value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-view">
          {[...fields, ['status', 'Status']].map(([k, label]) => (
            <div key={label} className="profile-row">
              <span className="profile-label">{label}</span>
              <span className="profile-value">
                {k === 'status' ? <StatusBadge status={profile[k]} /> : (profile[k] || '—')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
