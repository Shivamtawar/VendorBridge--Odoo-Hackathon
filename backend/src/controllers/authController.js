const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const logActivity = require('../utils/activityLogger');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, company_name, gst_number, contact_person, phone, address, category } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role });

    let vendorProfile = null;
    if (role === 'vendor') {
      vendorProfile = await Vendor.create({
        user_id: user.id,
        company_name: company_name || name,
        gst_number: gst_number || null,
        contact_person: contact_person || name,
        email,
        phone: phone || null,
        address: address || null,
        category: category || null,
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    await logActivity(user.id, 'USER_REGISTERED', 'user', user.id);
    res.status(201).json({
      success: true,
      message: 'User registered',
      data: { user, token, ...(vendorProfile && { vendor: vendorProfile }) },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    await logActivity(user.id, 'USER_LOGIN', 'user', user.id);

    const { password: _, ...safeUser } = user;
    res.json({ success: true, message: 'Login successful', data: { user: safeUser, token } });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const currentHash = await User.getPasswordById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(req.user.id, hashed);

    await logActivity(req.user.id, 'PASSWORD_CHANGED', 'user', req.user.id);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword };
