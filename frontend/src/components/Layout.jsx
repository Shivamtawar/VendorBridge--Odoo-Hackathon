import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Chatbot from './Chatbot';

const navByRole = {
  admin: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/rfqs', label: 'RFQs' },
    { to: '/quotations', label: 'Quotations' },
    { to: '/approvals', label: 'Approvals' },
    { to: '/purchase-orders', label: 'Purchase Orders' },
    { to: '/invoices', label: 'Invoices' },
    { to: '/vendors', label: 'Vendors' },
    { to: '/users', label: 'Users' },
    { to: '/reports', label: 'Reports' },
    { to: '/activity', label: 'Audit Logs' },
  ],
  procurement_officer: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/rfqs', label: 'RFQs' },
    { to: '/quotations', label: 'Quotations' },
    { to: '/approvals', label: 'Approvals' },
    { to: '/purchase-orders', label: 'Purchase Orders' },
    { to: '/invoices', label: 'Invoices' },
    { to: '/vendors', label: 'Vendors' },
    { to: '/reports', label: 'Reports' },
  ],
  manager: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/rfqs', label: 'RFQs' },
    { to: '/quotations', label: 'Quotations' },
    { to: '/approvals', label: 'Approvals' },
    { to: '/purchase-orders', label: 'Purchase Orders' },
    { to: '/invoices', label: 'Invoices' },
    { to: '/vendors', label: 'Vendors' },
  ],
  vendor: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/my-rfqs', label: 'My RFQs' },
    { to: '/my-quotations', label: 'My Quotations' },
    { to: '/my-invoices', label: 'Invoices' },
    { to: '/vendor-profile', label: 'My Profile' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const links = navByRole[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">VendorBridge</div>
        <nav>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={pathname === l.to ? 'active' : ''}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="role-badge">{user?.role?.replace('_', ' ')}</span>
          <span className="user-name">{user?.name}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
      <Chatbot />
    </div>
  );
}
