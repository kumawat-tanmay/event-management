const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    token = req.headers.authorization.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token and attach to req
    req.user = await User.findById(decoded.id).select('-password').lean();

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    if (req.user.isDeleted || !req.user.isActive || req.user.status === 'Inactive') {
      return res.status(401).json({ success: false, message: 'Not authorized, user account disabled or deleted' });
    }

    // Resolve permissions from Role document so downstream middleware/controllers have accurate data
    if (req.user.role && typeof req.user.role === 'string') {
      const Role = require('../models/Role');
      const roleDoc = await Role.findOne({ name: req.user.role, isDeleted: false }).lean();
      if (roleDoc && Array.isArray(roleDoc.permissions)) {
        req.user.permissions = roleDoc.permissions;
      }
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
