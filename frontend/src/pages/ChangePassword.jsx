import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter passwords, 2 = enter OTP
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const otpRefs = useRef([]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleRequest = async (e) => {
    e.preventDefault(); setError('');
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match'); return; }
    if (form.newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
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
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the full 6-digit OTP'); setLoading(false); return; }
    try {
      await authAPI.verifyChangePasswordOtp({ otp: code });
      setSuccess('Password changed successfully!');
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const resendOtp = async () => {
    setResending(true); setError('');
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP');
    } finally { setResending(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Change Password</h1>
          <p className="page-subtitle">Secure your account with a new password</p>
        </div>
      </div>

      <div style={{ maxWidth: 420 }}>
        {success && (
          <div className="alert alert-success" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
             {success}
          </div>
        )}
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>️ {error}</div>}

        {step === 1 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px' }}>
            <form onSubmit={handleRequest} className="form-stack">
              <div>
                <label>Current Password</label>
                <input type="password" value={form.currentPassword} onChange={set('currentPassword')} placeholder="Your current password" required autoFocus />
              </div>
              <div>
                <label>New Password</label>
                <input type="password" value={form.newPassword} onChange={set('newPassword')} placeholder="Min. 6 characters" required minLength={6} />
              </div>
              <div>
                <label>Confirm New Password</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat new password" required />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
                <button className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Send OTP →'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px' }}>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>
              A 6-digit OTP was sent to your registered email. Enter it below to confirm the password change.
            </p>
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
                {loading ? 'Verifying…' : 'Confirm Password Change'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} disabled={resending} onClick={resendOtp}>
                {resending ? 'Resending…' : 'Resend OTP'}
              </button>
              <span style={{ color: 'var(--border)' }}>|</span>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => { setStep(1); setError(''); setOtp(['', '', '', '', '', '']); }}>
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
