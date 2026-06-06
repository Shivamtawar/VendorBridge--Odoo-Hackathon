import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingNavBar from '../components/LandingNavBar';

const VendexLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24 }}>
    <path d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 9L12 17L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const features = [
  { icon: null, svg: 'rfq',      title: 'RFQ Management',      desc: 'Create and publish requests for quotations to multiple vendors with deadline tracking.' },
  { icon: null, svg: 'quote',    title: 'Vendor Quotations',    desc: 'Vendors submit competitive quotes and you compare them side by side instantly.' },
  { icon: null, svg: 'approve',  title: 'Approval Workflow',    desc: 'Structured multi-level approvals before any purchase order is generated.' },
  { icon: null, svg: 'po',       title: 'Purchase Orders',      desc: 'Auto-generate POs from approved quotations with all details pre-filled.' },
  { icon: null, svg: 'invoice',  title: 'Invoicing & PDF',      desc: 'Create GST invoices, download PDFs, and track payment status.' },
  { icon: null, svg: 'report',   title: 'Analytics & Reports',  desc: 'Vendor performance, spend analysis, and monthly procurement trends.' },
];

const FeatureIcon = ({ type }) => {
  const style = { width: 24, height: 24, stroke: 'var(--brand)', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'rfq':     return <svg viewBox="0 0 24 24" style={style}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6M7 16h4"/></svg>;
    case 'quote':   return <svg viewBox="0 0 24 24" style={style}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'approve': return <svg viewBox="0 0 24 24" style={style}><path d="M20 6L9 17l-5-5"/></svg>;
    case 'po':      return <svg viewBox="0 0 24 24" style={style}><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
    case 'invoice': return <svg viewBox="0 0 24 24" style={style}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
    case 'report':  return <svg viewBox="0 0 24 24" style={style}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    default:        return null;
  }
};

const benefits = [
  { stat: '70%',  label: 'Time Saved',      desc: 'Reduce procurement cycle time dramatically with end-to-end automation' },
  { stat: '50%+', label: 'Cost Reduction',  desc: 'Compare vendors transparently and negotiate better rates' },
  { stat: '100%', label: 'Compliance',      desc: 'Maintain audit trails and approval workflows for every purchase' },
  { stat: '24/7', label: 'Vendor Access',   desc: 'Vendors submit and manage quotations anytime, from anywhere' },
];

const steps = [
  { num: '01', title: 'Create RFQ',     desc: 'Define your requirements and send to pre-selected vendors instantly' },
  { num: '02', title: 'Collect Quotes', desc: 'Vendors submit competitive bids — compare side by side in real time' },
  { num: '03', title: 'Approve',        desc: 'Multi-level approval flow ensures governance and accountability' },
  { num: '04', title: 'Purchase',       desc: 'Auto-generate POs, track delivery, and manage invoicing' },
];

const footerLinks = {
  Product:  ['RFQ Management', 'Quotations', 'Approvals', 'Purchase Orders', 'Invoicing', 'Reports'],
  Platform: ['Vendor Portal', 'Role-Based Access', 'OTP Security', 'Audit Logs', 'AI Assistant'],
  Company:  ['About', 'Hackathon 2025', 'Contact'],
};

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <LandingNavBar />

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">
          <VendexLogo />
          Procurement ERP &nbsp;·&nbsp; Odoo Hackathon 2025
        </div>
        <h1><span>Vend</span>ex</h1>
        <div className="landing-hero-sub">Vendor Management Platform</div>
        <p>End-to-end procurement operations — vendors, RFQs, quotations, approvals, purchase orders, and invoices in one unified platform.</p>
        <div className="landing-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/login" className="btn btn-outline">Sign In</Link>
            </>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits-section" id="benefits">
        <div className="landing-container">
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
        </div>
      </section>

      {/* How It Works */}
      <section className="process-section" id="process">
        <div className="landing-container">
          <div className="section-header">
            <h2>Simple 4-Step Process</h2>
            <p>From requirement to delivery — handled end to end</p>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={s.num} className="step-card">
                <div className="step-number">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < steps.length - 1 && <div className="step-arrow" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features-section" id="features">
        <div className="landing-container">
          <div className="section-header">
            <h2>Core Features</h2>
            <p>Everything you need for modern procurement operations</p>
          </div>
          <div className="landing-features">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">
                  <FeatureIcon type={f.svg} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="cta-content">
          <h2>Ready to streamline your procurement?</h2>
          <p>Join forward-thinking procurement teams already using Vendex</p>
          {!user && (
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <div style={{ width: 32, height: 32, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <VendexLogo />
                </div>
                <span className="footer-brand-name">Vendex</span>
              </div>
              <p className="footer-tagline">End-to-end procurement management for modern businesses. Built for the Odoo Hackathon 2025.</p>
            </div>
            <div className="footer-links">
              {Object.entries(footerLinks).map(([group, links]) => (
                <div key={group} className="footer-link-group">
                  <div className="footer-link-heading">{group}</div>
                  <ul>
                    {links.map((l) => <li key={l}><span>{l}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 Vendex. Built for Odoo Hackathon.</span>
            <span>Powered by Node.js · PostgreSQL · React · Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
