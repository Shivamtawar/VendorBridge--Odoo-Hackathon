import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RFQs from './pages/RFQs';
import Quotations from './pages/Quotations';
import MyQuotations from './pages/MyQuotations';
import Approvals from './pages/Approvals';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import Vendors from './pages/Vendors';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Activity from './pages/Activity';
import VendorProfile from './pages/VendorProfile';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/rfqs" element={<ProtectedRoute roles={['admin','procurement_officer','manager','vendor']}><Layout><RFQs /></Layout></ProtectedRoute>} />
      <Route path="/my-rfqs" element={<ProtectedRoute roles={['vendor']}><Layout><RFQs /></Layout></ProtectedRoute>} />
      <Route path="/quotations" element={<ProtectedRoute roles={['admin','procurement_officer','manager']}><Layout><Quotations /></Layout></ProtectedRoute>} />
      <Route path="/my-quotations" element={<ProtectedRoute roles={['vendor']}><Layout><MyQuotations /></Layout></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute roles={['admin','procurement_officer','manager']}><Layout><Approvals /></Layout></ProtectedRoute>} />
      <Route path="/purchase-orders" element={<ProtectedRoute><Layout><PurchaseOrders /></Layout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><Layout><Invoices /></Layout></ProtectedRoute>} />
      <Route path="/my-invoices" element={<ProtectedRoute roles={['vendor']}><Layout><Invoices /></Layout></ProtectedRoute>} />
      <Route path="/vendors" element={<ProtectedRoute roles={['admin','procurement_officer','manager']}><Layout><Vendors /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['admin']}><Layout><Users /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['admin','procurement_officer']}><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute roles={['admin']}><Layout><Activity /></Layout></ProtectedRoute>} />
      <Route path="/vendor-profile" element={<ProtectedRoute roles={['vendor']}><Layout><VendorProfile /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
