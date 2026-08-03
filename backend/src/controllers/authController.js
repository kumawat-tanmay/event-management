const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/sendEmail');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper to resolve role name and permissions safely
const resolveUserRoleAndPermissions = async (user) => {
  let roleName = typeof user.role === 'string' ? user.role : 'staff';
  let permissions = user.permissions || [];

  try {
    if (user.role) {
      if (typeof user.role === 'string') {
        const roleDoc = await Role.findOne({ name: user.role }).collation({ locale: 'en', strength: 2 });
        if (roleDoc) {
          roleName = roleDoc.name;
          permissions = roleDoc.permissions || permissions;
        }
      }
    }
  } catch (err) {
    console.error('Error resolving role:', err);
  }

  return { roleName, permissions };
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, isDeleted: false }).collation({ locale: 'en', strength: 2 });

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'User account is disabled' });
      }

      // If user is Pending (just invited), check if invite expired, then set Active
      if (user.status === 'Pending') {
        if (user.inviteExpiresAt && Date.now() > new Date(user.inviteExpiresAt).getTime()) {
          return res.status(401).json({ success: false, message: 'Your invitation has expired. Please request a new one.' });
        }
        user.status = 'Active';
        await user.save({ validateBeforeSave: false });
      }

      const { roleName, permissions } = await resolveUserRoleAndPermissions(user);

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: roleName,
          permissions: permissions,
          avatar: user.avatar || null,
          token: generateToken(user._id),
        },
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { roleName, permissions } = await resolveUserRoleAndPermissions(user);
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        permissions: permissions,
        avatar: user.avatar || null,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Google OAuth 2.0 Login (Access Token flow - Invite Only)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  const { code: accessToken } = req.body; // frontend sends access_token (starts with ya29...)

  if (!accessToken) {
    return res.status(400).json({ success: false, message: 'Google access token is required' });
  }

  try {
    // Verify the access token by fetching user info from Google
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!googleRes.ok) {
      return res.status(401).json({ success: false, message: 'Invalid Google access token' });
    }

    const googleUserData = await googleRes.json();
    const { email, name, sub: googleId, picture } = googleUserData;

    if (!email) {
      return res.status(401).json({ success: false, message: 'Could not retrieve email from Google' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 🔒 STRICT INVITE-ONLY: User MUST exist in the database beforehand!
    let user = await User.findOne({ 
      email: normalizedEmail, 
      isDeleted: false 
    }).collation({ locale: 'en', strength: 2 });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No account found for this Google email. You must be invited by an administrator to access the system.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is disabled. Contact admin.' });
    }

    // Update googleId and avatar from Google if available
    let isModified = false;
    if (!user.googleId && googleId) {
      user.googleId = googleId;
      isModified = true;
    }
    if (picture && user.avatar !== picture) {
      user.avatar = picture;
      isModified = true;
    }

    if (isModified) {
      await user.save();
    }

    const { roleName, permissions } = await resolveUserRoleAndPermissions(user);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        permissions: permissions,
        avatar: user.avatar || null,
        token: generateToken(user._id),
      },
      message: 'Google Login successful'
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: 'Failed to authenticate with Google' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (error) {
      console.error(error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid token or token has expired' });
    }

    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully',
      data: {
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user profile (Name, Avatar)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.body.name) {
      user.name = req.body.name;
    }

    // Avatar upload
    if (req.file) {
      const { uploadToCloudinary } = require('../config/cloudinary');
      try {
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'avatars', 'image');
        user.avatar = cloudinaryResult.secure_url;
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Failed to upload image' });
      }
    }

    await user.save({ validateBeforeSave: false });
    const { roleName, permissions } = await resolveUserRoleAndPermissions(user);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        permissions: permissions,
        avatar: user.avatar || null,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check current password
    if (!user.password) {
       return res.status(400).json({ success: false, message: 'Cannot update password for Google Auth user without existing password.' });
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: {
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  loginUser,
  getMe,
  googleAuth,
  forgotPassword,
  resetPassword,
  updateProfile,
  updatePassword
};
