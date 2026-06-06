import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'procurement_officer', 'manager', 'vendor'];

const VendexIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:24,height:24}}>
    <path d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 9L12 17L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'vendor', company_name: '', gst_number: '', contact_person: '', phone: '', address: '', category: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await register(form); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-decoration">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
      </div>
      <div className="auth-panel" style={{padding: '40px 24px'}}>
        <div className="auth-card auth-card-wide">
          <div className="auth-logo">
            <div className="auth-logo-icon"><VendexIcon /></div>
            <div>
              <div className="auth-brand-name">Vendex</div>
              <span className="auth-brand-sub">Vendor Management</span>
            </div>
          </div>
          <h2>Create account</h2>
          <p className="auth-subtitle">Join your organization's procurement platform</p>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <form onSubmit={handle}>
            <div className="form-row">
              <div><label>Full Name</label><input value={form.name} onChange={set('name')} placeholder="Jane Smith" required /></div>
              <div><label>Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com" required /></div>
            </div>
            <div className="form-row">
              <div><label>Password</label><input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required /></div>
              <div>
                <label>Role</label>
                <select value={form.role} onChange={set('role')}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
            </div>

            {form.role === 'vendor' && (
              <>
                <hr />
                <p className="section-label" style={{color:'rgba(255,255,255,0.35)'}}>Vendor Details</p>
                <div className="form-row">
                  <div><label>Company Name</label><input value={form.company_name} onChange={set('company_name')} placeholder="Acme Supplies Ltd." /></div>
                  <div><label>GST Number</label><input value={form.gst_number} onChange={set('gst_number')} placeholder="22AAAAA0000A1Z5" /></div>
                </div>
                <div className="form-row">
                  <div><label>Contact Person</label><input value={form.contact_person} onChange={set('contact_person')} /></div>
                  <div><label>Phone</label><input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></div>
                </div>
                <div className="form-row">
                  <div><label>Category</label><input value={form.category} onChange={set('category')} placeholder="IT, Manufacturing…" /></div>
                  <div><label>Address</label><input value={form.address} onChange={set('address')} /></div>
                </div>
              </>
            )}

            <button className="btn btn-primary w-full" disabled={loading} style={{marginTop:4}}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
          <div className="auth-divider">or</div>
          <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
