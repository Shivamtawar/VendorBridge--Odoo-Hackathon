import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Chatbot from './Chatbot';

const VendexLogo = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M7 8L10 14L13 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const navByRole = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { to: '/vendors', label: 'Vendors', icon: '🏢' },
    { to: '/rfqs', label: 'RFQs', icon: '📋' },
    { to: '/quotations', label: 'Quotations', icon: '💬' },
    { to: '/approvals', label: 'Approvals', icon: '✅' },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: '📦' },
    { to: '/invoices', label: 'Invoices', icon: '🧾' },
    { to: '/users', label: 'Users', icon: '👥' },
    { to: '/reports', label: 'Reports', icon: '📊' },
    { to: '/activity', label: 'Audit Logs', icon: '🔍' },
  ],
  procurement_officer: [
    { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { to: '/vendors', label: 'Vendors', icon: '🏢' },
    { to: '/rfqs', label: 'RFQs', icon: '📋' },
    { to: '/quotations', label: 'Quotations', icon: '💬' },
    { to: '/approvals', label: 'Approvals', icon: '✅' },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: '📦' },
    { to: '/invoices', label: 'Invoices', icon: '🧾' },
    { to: '/reports', label: 'Reports', icon: '📊' },
  ],
  manager: [
    { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { to: '/rfqs', label: 'RFQs', icon: '📋' },
    { to: '/quotations', label: 'Quotations', icon: '💬' },
    { to: '/approvals', label: 'Approvals', icon: '✅' },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: '📦' },
    { to: '/invoices', label: 'Invoices', icon: '🧾' },
    { to: '/vendors', label: 'Vendors', icon: '🏢' },
  ],
  vendor: [
    { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { to: '/my-rfqs', label: 'My RFQs', icon: '📋' },
    { to: '/my-quotations', label: 'My Quotations', icon: '💬' },
    { to: '/my-invoices', label: 'Invoices', icon: '🧾' },
    { to: '/vendor-profile', label: 'My Profile', icon: '👤' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const links = navByRole[user?.role] || [];
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><VendexLogo /></div>
          <div>
            <div className="brand-name">Vendex</div>
            <span className="brand-sub">Vendor Management</span>
          </div>
        </div>
        <nav>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={pathname === l.to ? 'active' : ''}>
              <span className="nav-icon">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <span className="role-badge">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
      <Chatbot />
    </div>
  );
}
