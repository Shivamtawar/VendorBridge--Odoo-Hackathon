import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="landing">
      <div className="landing-hero">
        <h1>VendorBridge</h1>
        <p>End-to-end procurement management — RFQs, quotations, approvals, POs, and invoices in one place.</p>
        <div className="landing-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard →</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/register" className="btn btn-outline">Register</Link>
            </>
          )}
        </div>
      </div>

      <div className="landing-features">
        {[
          { icon: '📋', title: 'RFQ Management', desc: 'Create and publish requests for quotations to multiple vendors.' },
          { icon: '💬', title: 'Vendor Quotations', desc: 'Vendors submit competitive quotes; compare them side by side.' },
          { icon: '✅', title: 'Approval Workflow', desc: 'Managers approve or reject quotations before PO generation.' },
          { icon: '📦', title: 'Purchase Orders', desc: 'Auto-generate POs from accepted quotations.' },
          { icon: '🧾', title: 'Invoicing', desc: 'Create invoices and download PDFs with ₹ amounts.' },
          { icon: '📊', title: 'Reports', desc: 'Vendor performance, procurement stats, and monthly trends.' },
        ].map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
