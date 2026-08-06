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
      .select('name email role status isActive createdAt invitedBy phone address dob gender description')
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
    const existingUser = await User.findOne({ email: normalizedEmail }).collation({ locale: 'en', strength: 2 });

    const assignedRole = await Role.findOne({ name: role, isDeleted: false });
    const targetRoleName = assignedRole ? assignedRole.name : role;
    const targetPermissions = assignedRole ? assignedRole.permissions : (role === 'Owner' ? ['*'] : []);

    // Generate a secure dummy password
    const dummyPassword = crypto.randomBytes(4).toString('hex'); // 8 char string
    
    // Set invite expiration (1 day from now)
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 1);

    let user;

    if (existingUser) {
      if (!existingUser.isDeleted) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      // Re-activate soft-deleted user (Re-hired employee)
      existingUser.name = name;
      existingUser.password = dummyPassword;
      existingUser.role = targetRoleName;
      existingUser.permissions = targetPermissions;
      existingUser.status = 'Pending';
      existingUser.isActive = true;
      existingUser.isDeleted = false;
      existingUser.inviteExpiresAt = expireDate;
      existingUser.invitedBy = req.user ? req.user._id : undefined;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        password: dummyPassword,
        role: targetRoleName,
        permissions: targetPermissions,
        status: 'Pending',
        inviteExpiresAt: expireDate,
        invitedBy: req.user ? req.user._id : undefined,
      });
    }

    // Auto-create corresponding Staff record for the invited user
    try {
      const Staff = require('../models/Staff');
      const existingStaff = await Staff.findOne({ 
        $or: [
          { email: normalizedEmail },
          { name: user.name }
        ], 
        isDeleted: false 
      });
      if (!existingStaff) {
        const staffCount = await Staff.countDocuments();
        const staffRole = targetRoleName || 'Admin';
        await Staff.create({
          staffId: `STF-${String(staffCount + 1).padStart(3, '0')}`,
          name: user.name,
          email: user.email,
          phone: req.body.phone || '+91 98290 12345',
          role: staffRole,
          compensationType: req.body.compensationType || 'monthly',
          basePay: Number(req.body.basePay || 30000),
          totalPaid: Number(req.body.totalPaid || 0),
          pendingDues: Number(req.body.pendingDues || 0),
          status: 'Active'
        });
      }
    } catch (staffErr) {
      console.error('Failed to auto-create staff record on user invite:', staffErr);
    }

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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (users.view)
const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false })
      .select('-password')
      .populate('invitedBy', 'name email')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (users.update)
const updateUser = async (req, res) => {
  const { name, role, isActive, status, phone, address, dob, gender, description } = req.body;

  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (isActive !== undefined) user.isActive = isActive;
    if (status) user.status = status;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (dob !== undefined) user.dob = dob || null;
    if (gender !== undefined) user.gender = gender;
    if (description !== undefined) user.description = description;

    if (role && role !== user.role) {
      const assignedRole = await Role.findOne({ name: role, isDeleted: false });
      const targetRoleName = assignedRole ? assignedRole.name : role;
      const targetPermissions = assignedRole ? assignedRole.permissions : (role === 'Owner' ? ['*'] : []);

      user.role = targetRoleName;
      user.permissions = targetPermissions;
    }

    const updatedUser = await user.save();

    // Sync corresponding Staff record if exists
    try {
      const Staff = require('../models/Staff');
      const staff = await Staff.findOne({ email: user.email, isDeleted: false });
      if (staff) {
        if (name) staff.name = name;
        if (phone) staff.phone = phone;
        if (role) staff.role = role;
        await staff.save();
      }
    } catch (staffErr) {
      console.error('Failed to sync Staff record on user update:', staffErr);
    }

    res.json({ success: true, data: updatedUser, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete user (Soft delete)
// @route   DELETE /api/users/:id
// @access  Private (users.update)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    // Soft delete
    user.isDeleted = true;
    user.isActive = false;
    user.status = 'Inactive';
    await user.save();

    // Emit real-time socket event if online to immediately disconnect active sessions
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('user:deleted', { userId: user._id.toString() });
      }
    } catch (sockErr) {
      console.error('Failed to emit socket user:deleted event:', sockErr);
    }

    // Soft delete corresponding Staff record if exists
    try {
      const Staff = require('../models/Staff');
      const staff = await Staff.findOne({ email: user.email, isDeleted: false });
      if (staff) {
        staff.isDeleted = true;
        staff.status = 'Inactive';
        await staff.save();
      }
    } catch (staffErr) {
      console.error('Failed to soft delete Staff record on user delete:', staffErr);
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getUsers,
  inviteUser,
  getUserById,
  updateUser,
  deleteUser
};
