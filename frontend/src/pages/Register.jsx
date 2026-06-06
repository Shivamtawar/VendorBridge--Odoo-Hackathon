import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'vendor', label: 'Vendor' },
  { value: 'procurement_officer', label: 'Procurement Officer' },
  { value: 'manager', label: 'Manager' },
];

const VendexIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24 }}>
    <path d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 9L12 17L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Register() {
  const { registerRequest, registerVerify } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = form, 2 = otp
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'vendor',
    company_name: '', gst_number: '', contact_person: '', phone: '', address: '', category: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef([]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await registerRequest(form);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the full 6-digit OTP'); setLoading(false); return; }
    try {
      await registerVerify(form.email, code);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const resendOtp = async () => {
    setResending(true); setError('');
    try {
      await registerRequest(form);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP');
    } finally { setResending(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-decoration">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
      </div>
      <div className="auth-panel" style={{ padding: '40px 24px' }}>
        <div className="auth-card auth-card-wide">
          <div className="auth-logo">
            <div className="auth-logo-icon"><VendexIcon /></div>
            <div>
              <div className="auth-brand-name">Vendex</div>
              <span className="auth-brand-sub">Vendor Management</span>
            </div>
          </div>

          {step === 1 ? (
            <>
              <h2>Create account</h2>
              <p className="auth-subtitle">Join your organization's procurement platform</p>
              {error && <div className="alert alert-error">️ {error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div><label>Full Name</label><input value={form.name} onChange={set('name')} placeholder="Jane Smith" required autoFocus /></div>
                  <div><label>Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com" required /></div>
                </div>
                <div className="form-row">
                  <div>
                    <label>Password</label>
                    <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required minLength={6} />
                  </div>
                  <div>
                    <label>Role</label>
                    <select value={form.role} onChange={set('role')}>
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>

                {form.role === 'vendor' && (
                  <>
                    <hr style={{ margin: '12px 0', borderColor: 'var(--border)' }} />
                    <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Vendor Details</p>
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

                <button className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? 'Sending OTP…' : 'Continue →'}
                </button>
              </form>
              <div className="auth-divider">or</div>
              <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
            </>
          ) : (
            <>
              <h2>Verify your email</h2>
              <p className="auth-subtitle">
                We sent a 6-digit OTP to <strong>{form.email}</strong>.<br />
                Enter it below to complete registration.
              </p>
              {error && <div className="alert alert-error">️ {error}</div>}
              <form onSubmit={handleVerify}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0' }} onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      style={{
                        width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
                        border: `2px solid ${digit ? 'var(--brand)' : 'var(--border)'}`,
                        borderRadius: 10, background: 'var(--surface)', color: 'var(--text)',
                        outline: 'none', transition: 'border-color 0.15s',
                      }}
                    />
                  ))}
                </div>
                <button className="btn btn-primary w-full" disabled={loading || otp.join('').length !== 6}>
                  {loading ? 'Verifying…' : 'Verify & Create Account'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Didn't receive it? </span>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 13, padding: '2px 6px' }}
                  disabled={resending}
                  onClick={resendOtp}
                >
                  {resending ? 'Resending…' : 'Resend OTP'}
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => { setStep(1); setError(''); setOtp(['', '', '', '', '', '']); }}>
                  ← Change email / details
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
