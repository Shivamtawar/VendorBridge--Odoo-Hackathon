import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LandingNavBar from '../components/LandingNavBar';

const VendexLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:24,height:24}}>
    <path d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 9L12 17L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const features = [
  { icon: '📋', title: 'RFQ Management', desc: 'Create and publish requests for quotations to multiple vendors with deadline tracking.' },
  { icon: '💬', title: 'Vendor Quotations', desc: 'Vendors submit competitive quotes and you compare them side by side instantly.' },
  { icon: '✅', title: 'Approval Workflow', desc: 'Structured multi-level approvals before any purchase order is generated.' },
  { icon: '📦', title: 'Purchase Orders', desc: 'Auto-generate POs from approved quotations with all details pre-filled.' },
  { icon: '🧾', title: 'Invoicing & PDF', desc: 'Create GST invoices, download PDFs, and send them via email in one click.' },
  { icon: '📊', title: 'Analytics & Reports', desc: 'Vendor performance, spend analysis, and monthly procurement trends.' },
];

const benefits = [
  { stat: '70%', label: 'Time Saved', desc: 'Reduce procurement cycle time dramatically with automation' },
  { stat: '50%+', label: 'Cost Reduction', desc: 'Compare vendors and negotiate better rates with transparency' },
  { stat: '100%', label: 'Compliance', desc: 'Maintain audit trails and approval workflows for every order' },
  { stat: '24/7', label: 'Vendor Access', desc: 'Vendors manage quotations anytime, anywhere' },
];

const steps = [
  { num: '1', title: 'Create RFQ', desc: 'Define what you need and send to selected vendors' },
  { num: '2', title: 'Collect Quotes', desc: 'Vendors submit competitive bids in real-time' },
  { num: '3', title: 'Approve', desc: 'Multi-level approvals ensure proper governance' },
  { num: '4', title: 'Purchase', desc: 'Auto-generate POs and track deliveries' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      {/* Navigation Bar */}
      <LandingNavBar />

      {/* Hero Section */}
      <div className="landing-hero">
        <div className="landing-badge">
          <VendexLogo />
          Procurement ERP · Odoo Hackathon 2025
        </div>
        <h1><span>Vend</span>ex</h1>
        <div className="landing-hero-sub">Vendor Management Platform</div>
        <p>End-to-end procurement operations — vendors, RFQs, quotations, approvals, purchase orders, and invoices in one unified platform.</p>
        <div className="landing-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard →</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">Sign In →</Link>
              <Link to="/register" className="btn btn-outline">Create Account</Link>
            </>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <section className="landing-section benefits-section" id="benefits">
        <div className="section-header">
          <h2>Why Choose Vendex?</h2>
          <p>Transform your procurement with powerful insights and automation</p>
        </div>
        <div className="benefits-grid">
          {benefits.map((b) => (
            <div key={b.stat} className="benefit-card">
              <div className="benefit-stat">{b.stat}</div>
              <div className="benefit-label">{b.label}</div>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section process-section" id="process">
        <div className="section-header">
          <h2>Simple 4-Step Process</h2>
          <p>Get results in minutes, not weeks</p>
        </div>
        <div className="steps-grid">
          {steps.map((s) => (
            <div key={s.num} className="step-card">
              <div className="step-number">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features-section" id="features">
        <div className="section-header">
          <h2>Core Features</h2>
          <p>Everything you need for modern procurement</p>
        </div>
        <div className="landing-features">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="cta-content">
          <h2>Ready to streamline your procurement?</h2>
          <p>Join forward-thinking procurement teams already using Vendex</p>
          {!user && (
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Start Free →</Link>
              <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
