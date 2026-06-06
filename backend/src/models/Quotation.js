const pool = require('../config/db');

const findByRFQ = async (rfqId) => {
  const result = await pool.query(
    `SELECT q.*, v.company_name, v.contact_person, v.rating
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     WHERE q.rfq_id = $1
     ORDER BY q.price ASC`,
    [rfqId]
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT q.*, v.company_name, v.contact_person, v.email as vendor_email, v.rating
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     WHERE q.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const findByVendor = async (vendorId) => {
  const result = await pool.query(
    `SELECT q.*, r.title as rfq_title, r.deadline FROM quotations q
     JOIN rfqs r ON q.rfq_id = r.id
     WHERE q.vendor_id = $1 ORDER BY q.created_at DESC`,
    [vendorId]
  );
  return result.rows;
};

const findExisting = async (rfqId, vendorId) => {
  const result = await pool.query(
    'SELECT id FROM quotations WHERE rfq_id = $1 AND vendor_id = $2',
    [rfqId, vendorId]
  );
  return result.rows[0] || null;
};

const findByIdForRFQ = async (rfqId) => {
  const result = await pool.query(
    'SELECT title, description, quantity FROM rfqs WHERE id = $1',
    [rfqId]
  );
  return result.rows[0] || null;
};

const compareByRFQ = async (rfqId) => {
  const result = await pool.query(
    `SELECT q.*, v.company_name, v.contact_person, v.rating,
      RANK() OVER (ORDER BY q.price ASC) as price_rank,
      RANK() OVER (ORDER BY q.delivery_days ASC) as delivery_rank
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     WHERE q.rfq_id = $1 AND q.status = 'submitted'
     ORDER BY q.price ASC`,
    [rfqId]
  );
  return result.rows;
};

const create = async ({ rfq_id, vendor_id, price, delivery_days, notes }) => {
  const result = await pool.query(
    `INSERT INTO quotations (rfq_id, vendor_id, price, delivery_days, notes, status, submitted_at)
     VALUES ($1, $2, $3, $4, $5, 'submitted', NOW()) RETURNING *`,
    [rfq_id, vendor_id, price, delivery_days, notes]
  );
  return result.rows[0];
};

const update = async (id, vendorId, { price, delivery_days, notes }) => {
  const result = await pool.query(
    `UPDATE quotations SET
      price         = COALESCE($1, price),
      delivery_days = COALESCE($2, delivery_days),
      notes         = COALESCE($3, notes),
      updated_at    = NOW()
     WHERE id = $4 AND vendor_id = $5 AND status IN ('draft', 'submitted') RETURNING *`,
    [price, delivery_days, notes, id, vendorId]
  );
  return result.rows[0] || null;
};

const updateStatus = async (id, status) => {
  await pool.query(
    'UPDATE quotations SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, id]
  );
};

const findAccepted = async (quotationId) => {
  const result = await pool.query(
    `SELECT q.*, r.id as rfq_id FROM quotations q
     JOIN rfqs r ON q.rfq_id = r.id
     WHERE q.id = $1 AND q.status = 'accepted'`,
    [quotationId]
  );
  return result.rows[0] || null;
};

const findStatusById = async (id) => {
  const result = await pool.query('SELECT id, status FROM quotations WHERE id = $1', [id]);
  return result.rows[0] || null;
};

module.exports = {
  findByRFQ, findById, findByVendor, findExisting, findByIdForRFQ,
  compareByRFQ, create, update, updateStatus, findAccepted, findStatusById,
};
