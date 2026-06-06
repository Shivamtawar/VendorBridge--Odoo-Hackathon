const QRCode = require('qrcode');
const pool = require('../config/db');

async function buildRFQSnapshot(rfqId) {
  const { rows: rfqRows } = await pool.query(
    `SELECT r.*, u.name AS created_by_name
     FROM rfqs r
     LEFT JOIN users u ON u.id = r.created_by
     WHERE r.id = $1`,
    [rfqId]
  );
  if (!rfqRows.length) return null;
  const rfq = rfqRows[0];

  const { rows: vendors } = await pool.query(
    `SELECT v.company_name, v.email, v.phone FROM rfq_vendors rv JOIN vendors v ON v.id = rv.vendor_id WHERE rv.rfq_id = $1`,
    [rfqId]
  );

  const { rows: quotations } = await pool.query(
    `SELECT q.id, q.total_amount, q.delivery_days, q.status, v.company_name AS vendor
     FROM quotations q JOIN vendors v ON v.id = q.vendor_id WHERE q.rfq_id = $1`,
    [rfqId]
  );

  const { rows: approvals } = await pool.query(
    `SELECT a.status, a.remarks, u.name AS reviewed_by, a.reviewed_at
     FROM approvals a
     LEFT JOIN users u ON u.id = a.reviewed_by
     WHERE a.quotation_id IN (SELECT id FROM quotations WHERE rfq_id = $1)`,
    [rfqId]
  );

  const { rows: pos } = await pool.query(
    `SELECT po.po_number, po.status, po.total_amount, po.expected_delivery, v.company_name AS vendor
     FROM purchase_orders po JOIN vendors v ON v.id = po.vendor_id
     WHERE po.rfq_id = $1`,
    [rfqId]
  );

  const { rows: invoices } = await pool.query(
    `SELECT i.invoice_number, i.status, i.total, i.due_date
     FROM invoices i JOIN purchase_orders po ON po.id = i.po_id
     WHERE po.rfq_id = $1`,
    [rfqId]
  );

  return {
    id: rfq.id,
    title: rfq.title,
    status: rfq.status,
    created_by: rfq.created_by_name,
    deadline: rfq.deadline,
    quantity: rfq.quantity,
    unit: rfq.unit,
    vendors_assigned: vendors.map((v) => v.company_name),
    quotations: quotations.map((q) => ({
      vendor: q.vendor,
      amount: `INR ${Number(q.total_amount).toLocaleString('en-IN')}`,
      delivery_days: q.delivery_days,
      status: q.status,
    })),
    approvals: approvals.map((a) => ({
      status: a.status,
      reviewed_by: a.reviewed_by,
      remarks: a.remarks,
    })),
    purchase_orders: pos.map((p) => ({
      po_number: p.po_number,
      vendor: p.vendor,
      amount: `INR ${Number(p.total_amount).toLocaleString('en-IN')}`,
      status: p.status,
      expected_delivery: p.expected_delivery,
    })),
    invoices: invoices.map((i) => ({
      invoice_number: i.invoice_number,
      status: i.status,
      total: `INR ${Number(i.total).toLocaleString('en-IN')}`,
      due_date: i.due_date,
    })),
    generated_at: new Date().toISOString(),
  };
}

async function generateRFQQR(rfqId) {
  const snapshot = await buildRFQSnapshot(rfqId);
  if (!snapshot) return null;

  const text = JSON.stringify(snapshot, null, 2);

  const png = await QRCode.toBuffer(text, {
    errorCorrectionLevel: 'M',
    type: 'png',
    width: 512,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  return { png, snapshot };
}

module.exports = { generateRFQQR };
