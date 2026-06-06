const Report = require('../models/Report');
const Vendor = require('../models/Vendor');

const getDashboard = async (req, res, next) => {
  try {
    const [kpis, activity] = await Promise.all([
      Report.getDashboardKPIs(),
      Report.getRecentActivity(),
    ]);

    res.json({ success: true, data: { kpis, ...activity } });
  } catch (err) {
    next(err);
  }
};

const getVendorDashboard = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor profile not found' });

    const [kpis, recent_quotations] = await Promise.all([
      Report.getVendorKPIs(vendor.id),
      Report.getVendorRecentQuotations(vendor.id),
    ]);

    res.json({ success: true, data: { kpis, recent_quotations } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getVendorDashboard };
