import api from './client';

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  vendor: () => api.get('/dashboard/vendor'),
};

// RFQs
export const rfqAPI = {
  list: () => api.get('/rfqs'),
  get: (id) => api.get(`/rfqs/${id}`),
  create: (data) => api.post('/rfqs', data),
  update: (id, data) => api.put(`/rfqs/${id}`, data),
  delete: (id) => api.delete(`/rfqs/${id}`),
  assignVendors: (id, vendor_ids) => api.post(`/rfqs/${id}/assign-vendors`, { vendor_ids }),
  publish: (id) => api.patch(`/rfqs/${id}/publish`),
  qrUrl: (id) => `http://localhost:3000/api/rfqs/${id}/qr`,
  qrSnapshot: (id) => api.get(`/rfqs/${id}/qr?format=json`),
};

// Quotations
export const quotationAPI = {
  byRFQ: (rfqId) => api.get(`/quotations/rfq/${rfqId}`),
  compare: (rfqId) => api.get(`/quotations/rfq/${rfqId}/compare`),
  get: (id) => api.get(`/quotations/${id}`),
  myQuotations: () => api.get('/quotations/my'),
  submit: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
};

// Approvals
export const approvalAPI = {
  list: () => api.get('/approvals'),
  get: (id) => api.get(`/approvals/${id}`),
  request: (data) => api.post('/approvals', data),
  process: (id, data) => api.patch(`/approvals/${id}/process`, data),
};

// Purchase Orders
export const poAPI = {
  list: () => api.get('/purchase-orders'),
  get: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  updateStatus: (id, status) => api.patch(`/purchase-orders/${id}/status`, { status }),
};

// Invoices
export const invoiceAPI = {
  list: () => api.get('/invoices'),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  downloadUrl: (id) => `http://localhost:3000/api/invoices/${id}/download`,
};

// Vendors
export const vendorAPI = {
  list: () => api.get('/vendors'),
  get: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
  profile: () => api.get('/vendors/profile'),
};

// Users
export const userAPI = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Reports
export const reportAPI = {
  vendorPerformance: () => api.get('/reports/vendor-performance'),
  procurementStats: () => api.get('/reports/procurement-stats'),
  monthlyTrends: () => api.get('/reports/monthly-trends'),
};

// Activity
export const activityAPI = {
  logs: () => api.get('/activity/logs'),
  notifications: () => api.get('/activity/notifications'),
  markRead: (id) => api.patch(`/activity/notifications/${id}/read`),
  markAllRead: () => api.patch('/activity/notifications/read-all'),
};

// Chat
export const chatAPI = {
  send: (data) => api.post('/chat/message', data),
  items: (topic) => api.get(`/chat/items/${topic}`),
};
