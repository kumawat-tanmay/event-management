const User = require('../models/User');
const Role = require('../models/Role');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { getInviteEmailTemplate } = require('../utils/emailTemplates');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false })
      .select('name email role status isActive createdAt invitedBy')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Invite a new user
// @route   POST /api/users/invite
// @access  Private (settings.update or users.invite)
const inviteUser = async (req, res) => {
  const { name, email, role } = req.body;

  try {
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and role' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail }).collation({ locale: 'en', strength: 2 }).lean();
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const assignedRole = await Role.findOne({ name: role, isDeleted: false });
    if (!assignedRole) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Security: Prevent assigning a wildcard role unless the inviter has wildcard permission
    if (assignedRole.permissions.includes('*') && !req.user.permissions?.includes('*')) {
      return res.status(403).json({ success: false, message: 'You do not have permission to assign wildcard roles' });
    }

    // Generate a secure dummy password
    const dummyPassword = crypto.randomBytes(4).toString('hex'); // 8 char string
    
    // Set invite expiration (1 day from now)
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 1);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: dummyPassword,
      role: assignedRole.name,
      permissions: assignedRole.permissions,
      status: 'Pending',
      inviteExpiresAt: expireDate,
      invitedBy: req.user ? req.user._id : undefined,
    });

    // Send the beautiful invite email
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?email=${encodeURIComponent(user.email)}`;
    const emailHtml = getInviteEmailTemplate(user.name, user.email, dummyPassword, loginUrl);

    try {
      await sendEmail({
        email: user.email,
        subject: 'You are invited to Krishna Tent & Events ERP',
        html: emailHtml,
        message: `Your account has been created. Email: ${user.email}, Password: ${dummyPassword}. Login at ${loginUrl}`,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // We don't fail the user creation if email fails, but we should inform the frontend
      return res.status(201).json({ 
        success: true, 
        data: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt }, 
        message: 'User created successfully, but email failed to send. Password is: ' + dummyPassword 
      });
    }

    res.status(201).json({ 
      success: true, 
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt }, 
      message: 'User invited successfully and email sent' 
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getUsers,
  inviteUser
};
