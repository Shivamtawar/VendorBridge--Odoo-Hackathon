import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'procurement_officer', 'manager', 'vendor'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'vendor', company_name: '', gst_number: '', contact_person: '', phone: '', address: '', category: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-brand">VendorBridge</div>
        <h2>Create account</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handle}>
          <div className="form-row">
            <div>
              <label>Full Name</label>
              <input value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} required />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} required />
            </div>
            <div>
              <label>Role</label>
              <select value={form.role} onChange={set('role')}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          {form.role === 'vendor' && (
            <>
              <hr />
              <p className="section-label">Vendor Details</p>
              <div className="form-row">
                <div>
                  <label>Company Name</label>
                  <input value={form.company_name} onChange={set('company_name')} />
                </div>
                <div>
                  <label>GST Number</label>
                  <input value={form.gst_number} onChange={set('gst_number')} />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Contact Person</label>
                  <input value={form.contact_person} onChange={set('contact_person')} />
                </div>
                <div>
                  <label>Phone</label>
                  <input value={form.phone} onChange={set('phone')} />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Category</label>
                  <input value={form.category} onChange={set('category')} placeholder="IT, Manufacturing…" />
                </div>
                <div>
                  <label>Address</label>
                  <input value={form.address} onChange={set('address')} />
                </div>
              </div>
            </>
          )}

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">Have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
