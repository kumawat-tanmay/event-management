const Role = require('../models/Role');

// @desc    Get all active roles
// @route   GET /api/roles
// @access  Private (roles.view)
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isDeleted: false })
      .sort({ isSystem: -1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private (roles.create)
const createRole = async (req, res) => {
  const { name, permissions } = req.body;

  try {
    const roleExists = await Role.findOne({ name, isDeleted: false }).collation({ locale: 'en', strength: 2 }).lean();
    if (roleExists) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }

    // Security: Prevent assigning '*' wildcard unless the user creating it has '*' themselves
    if (permissions && permissions.includes('*') && !req.user.permissions?.includes('*')) {
      return res.status(403).json({ success: false, message: 'Cannot assign wildcard permission' });
    }

    const role = await Role.create({
      name,
      permissions: permissions || [],
      isSystem: false // Custom roles are never system roles
    });

    res.status(201).json({ success: true, data: role, message: 'Role created successfully' });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private (roles.update)
const updateRole = async (req, res) => {
  const { name, permissions } = req.body;

  try {
    const role = await Role.findOne({ _id: req.params.id, isDeleted: false });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }


    // Security guard
    if (permissions && permissions.includes('*') && !req.user.permissions?.includes('*')) {
      return res.status(403).json({ success: false, message: 'Cannot assign wildcard permission' });
    }

    if (name) role.name = name;
    if (permissions) role.permissions = permissions;

    const updatedRole = await role.save();

    res.json({ success: true, data: updatedRole, message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private (roles.delete)
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, isDeleted: false });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }


    // Soft delete
    role.isDeleted = true;
    await role.save();

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getRoles,
  createRole,
  updateRole,
  deleteRole
};
