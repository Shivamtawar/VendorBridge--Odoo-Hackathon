import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VendexIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:24,height:24}}>
    <path d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 9L12 17L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-decoration">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon"><VendexIcon /></div>
            <div>
              <div className="auth-brand-name">Vendex</div>
              <span className="auth-brand-sub">Vendor Management</span>
            </div>
          </div>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your procurement dashboard</p>
          {error && <div className="alert alert-error">️ {error}</div>}
          <form onSubmit={handle}>
            <div>
              <label>Email address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required autoFocus />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary w-full" disabled={loading} style={{marginTop:4}}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
          <div className="auth-divider">or</div>
          <p className="auth-footer">No account? <Link to="/register">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}
