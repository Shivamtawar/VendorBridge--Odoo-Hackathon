const pool = require('../config/db');

const getVendorPerformance = async () => {
  const result = await pool.query(
    `SELECT v.id, v.company_name, v.category, v.rating,
      COUNT(DISTINCT q.rfq_id) as rfqs_participated,
      COUNT(DISTINCT CASE WHEN q.status = 'accepted' THEN q.id END) as quotations_won,
      COALESCE(AVG(q.price), 0) as avg_price,
      COALESCE(AVG(q.delivery_days), 0) as avg_delivery_days,
      COUNT(DISTINCT po.id) as purchase_orders
     FROM vendors v
     LEFT JOIN quotations q ON v.id = q.vendor_id
     LEFT JOIN purchase_orders po ON v.id = po.vendor_id
     GROUP BY v.id
     ORDER BY quotations_won DESC`
  );
  return result.rows;
};

const getProcurementStats = async ({ from, to } = {}) => {
  const params = [];
  let dateFilter = '';
  if (from && to) { params.push(from, to); dateFilter = 'WHERE created_at BETWEEN $1 AND $2'; }

  const [rfqStats, poStats, invoiceStats, topVendors] = await Promise.all([
    pool.query(`SELECT status, COUNT(*) as count FROM rfqs ${dateFilter} GROUP BY status`, params),
    pool.query(`SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_value FROM purchase_orders ${dateFilter} GROUP BY status`, params),
    pool.query(`SELECT status, COUNT(*) as count, COALESCE(SUM(total), 0) as total_value FROM invoices ${dateFilter} GROUP BY status`, params),
    pool.query(
      `SELECT v.company_name, COUNT(po.id) as order_count, COALESCE(SUM(po.total_amount), 0) as total_value
       FROM vendors v
       JOIN purchase_orders po ON v.id = po.vendor_id
       GROUP BY v.id ORDER BY total_value DESC LIMIT 10`
    ),
  ]);

  return {
    rfq_stats: rfqStats.rows,
    po_stats: poStats.rows,
    invoice_stats: invoiceStats.rows,
    top_vendors: topVendors.rows,
  };
};

const getMonthlyTrends = async () => {
  const [rfqTrend, spendTrend] = await Promise.all([
    pool.query(
      `SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as rfq_count
       FROM rfqs WHERE created_at >= NOW() - INTERVAL '12 months'
       GROUP BY month ORDER BY month ASC`
    ),
    pool.query(
      `SELECT DATE_TRUNC('month', created_at) as month, COALESCE(SUM(total), 0) as total_spend
       FROM invoices WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY month ORDER BY month ASC`
    ),
  ]);
  return { rfq_trend: rfqTrend.rows, spend_trend: spendTrend.rows };
};

const getDashboardKPIs = async () => {
  const [totalVendors, openRFQs, pendingApprovals, totalPOs, procurementSpend] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM vendors WHERE status = 'active'`),
    pool.query(`SELECT COUNT(*) FROM rfqs WHERE status = 'open'`),
    pool.query(`SELECT COUNT(*) FROM approvals WHERE status = 'pending'`),
    pool.query(`SELECT COUNT(*) FROM purchase_orders`),
    pool.query(`SELECT COALESCE(SUM(total), 0) as total_spend FROM invoices WHERE status = 'paid'`),
  ]);
  return {
    total_vendors: parseInt(totalVendors.rows[0].count),
    open_rfqs: parseInt(openRFQs.rows[0].count),
    pending_approvals: parseInt(pendingApprovals.rows[0].count),
    total_purchase_orders: parseInt(totalPOs.rows[0].count),
    procurement_spend: parseFloat(procurementSpend.rows[0].total_spend),
  };
};

const getRecentActivity = async () => {
  const [recentRFQs, recentPOs, recentInvoices] = await Promise.all([
    pool.query(`SELECT r.*, u.name as created_by_name FROM rfqs r LEFT JOIN users u ON r.created_by = u.id ORDER BY r.created_at DESC LIMIT 5`),
    pool.query(`SELECT po.*, v.company_name FROM purchase_orders po LEFT JOIN vendors v ON po.vendor_id = v.id ORDER BY po.created_at DESC LIMIT 5`),
    pool.query(`SELECT i.*, v.company_name FROM invoices i LEFT JOIN vendors v ON i.vendor_id = v.id ORDER BY i.created_at DESC LIMIT 5`),
  ]);
  return { recent_rfqs: recentRFQs.rows, recent_purchase_orders: recentPOs.rows, recent_invoices: recentInvoices.rows };
};

const getVendorKPIs = async (vendorId) => {
  const [assignedRFQs, submittedQuotations, activePOs, pendingInvoices] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM rfq_vendors WHERE vendor_id = $1`, [vendorId]),
    pool.query(`SELECT COUNT(*) FROM quotations WHERE vendor_id = $1`, [vendorId]),
    pool.query(`SELECT COUNT(*) FROM purchase_orders WHERE vendor_id = $1 AND status = 'issued'`, [vendorId]),
    pool.query(`SELECT COUNT(*) FROM invoices WHERE vendor_id = $1 AND status IN ('sent', 'overdue')`, [vendorId]),
  ]);
  return {
    assigned_rfqs: parseInt(assignedRFQs.rows[0].count),
    submitted_quotations: parseInt(submittedQuotations.rows[0].count),
    active_purchase_orders: parseInt(activePOs.rows[0].count),
    pending_invoices: parseInt(pendingInvoices.rows[0].count),
  };
};

const getVendorRecentQuotations = async (vendorId) => {
  const result = await pool.query(
    `SELECT q.*, r.title as rfq_title FROM quotations q
     JOIN rfqs r ON q.rfq_id = r.id
     WHERE q.vendor_id = $1 ORDER BY q.created_at DESC LIMIT 5`,
    [vendorId]
  );
  return result.rows;
};

module.exports = {
  getVendorPerformance, getProcurementStats, getMonthlyTrends,
  getDashboardKPIs, getRecentActivity, getVendorKPIs, getVendorRecentQuotations,
};
