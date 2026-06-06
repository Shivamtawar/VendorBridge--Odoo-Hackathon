import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Chatbot from './Chatbot';

const VendexLogo = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M7 8L10 14L13 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// SVG nav icons — no emojis
const NavIcon = ({ type }) => {
  const s = { width: 15, height: 15, stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', flexShrink: 0 };
  switch (type) {
    case 'dashboard':  return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case 'vendors':    return <svg viewBox="0 0 24 24" style={s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'rfqs':       return <svg viewBox="0 0 24 24" style={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>;
    case 'quotations': return <svg viewBox="0 0 24 24" style={s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'approvals':  return <svg viewBox="0 0 24 24" style={s}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'po':         return <svg viewBox="0 0 24 24" style={s}><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h6v13H7v-4"/></svg>;
    case 'invoices':   return <svg viewBox="0 0 24 24" style={s}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
    case 'users':      return <svg viewBox="0 0 24 24" style={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'reports':    return <svg viewBox="0 0 24 24" style={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case 'activity':   return <svg viewBox="0 0 24 24" style={s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'profile':    return <svg viewBox="0 0 24 24" style={s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'key':        return <svg viewBox="0 0 24 24" style={s}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
    default: return null;
  }
};

const navByRole = {
  admin: [
    { to: '/dashboard',      label: 'Dashboard',      icon: 'dashboard' },
    { to: '/vendors',        label: 'Vendors',         icon: 'vendors' },
    { to: '/rfqs',           label: 'RFQs',            icon: 'rfqs' },
    { to: '/quotations',     label: 'Quotations',      icon: 'quotations' },
    { to: '/approvals',      label: 'Approvals',       icon: 'approvals' },
    { to: '/purchase-orders',label: 'Purchase Orders', icon: 'po' },
    { to: '/invoices',       label: 'Invoices',        icon: 'invoices' },
    { to: '/users',          label: 'Users',           icon: 'users' },
    { to: '/reports',        label: 'Reports',         icon: 'reports' },
    { to: '/activity',       label: 'Audit Logs',      icon: 'activity' },
  ],
  procurement_officer: [
    { to: '/dashboard',      label: 'Dashboard',      icon: 'dashboard' },
    { to: '/vendors',        label: 'Vendors',         icon: 'vendors' },
    { to: '/rfqs',           label: 'RFQs',            icon: 'rfqs' },
    { to: '/quotations',     label: 'Quotations',      icon: 'quotations' },
    { to: '/approvals',      label: 'Approvals',       icon: 'approvals' },
    { to: '/purchase-orders',label: 'Purchase Orders', icon: 'po' },
    { to: '/invoices',       label: 'Invoices',        icon: 'invoices' },
    { to: '/reports',        label: 'Reports',         icon: 'reports' },
  ],
  manager: [
    { to: '/dashboard',      label: 'Dashboard',      icon: 'dashboard' },
    { to: '/rfqs',           label: 'RFQs',            icon: 'rfqs' },
    { to: '/quotations',     label: 'Quotations',      icon: 'quotations' },
    { to: '/approvals',      label: 'Approvals',       icon: 'approvals' },
    { to: '/purchase-orders',label: 'Purchase Orders', icon: 'po' },
    { to: '/invoices',       label: 'Invoices',        icon: 'invoices' },
    { to: '/vendors',        label: 'Vendors',         icon: 'vendors' },
  ],
  vendor: [
    { to: '/dashboard',       label: 'Dashboard',     icon: 'dashboard' },
    { to: '/my-rfqs',         label: 'My RFQs',       icon: 'rfqs' },
    { to: '/my-quotations',   label: 'My Quotations', icon: 'quotations' },
    { to: '/my-invoices',     label: 'Invoices',      icon: 'invoices' },
    { to: '/vendor-profile',  label: 'My Profile',    icon: 'profile' },
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
              <span className="nav-icon"><NavIcon type={l.icon} /></span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <span className="role-badge">{user?.role?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <Link to="/change-password" className="sidebar-util-link">
            <NavIcon type="key" /> Change Password
          </Link>
          <button className="btn-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
      <Chatbot />
    </div>
  );
}
