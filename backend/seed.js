require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Role = require('./src/models/Role');
const connectDB = require('./src/config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    const { DEFAULT_ROLES } = require('./src/config/permissions');

    // 1. Create or find all default roles
    const createdRoles = {};
    for (const [key, roleData] of Object.entries(DEFAULT_ROLES)) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create({
          name: roleData.name,
          permissions: roleData.permissions,
          isSystem: roleData.isSystem
        });
        console.log(`${roleData.name} role created.`);
      }
      createdRoles[key] = role;
    }

    // Use the Admin or Owner role for the initial user (fallback to first created role if neither exists)
    const adminRole = createdRoles.admin || createdRoles.owner || Object.values(createdRoles)[0];

    // 3. Create initial Admin User
    await User.deleteOne({ email: 'tanmaymk03@gmail.com' });
    const adminUser = await User.create({
      name: 'tanmay Kumawat',
      email: 'tanmaymk03@gmail.com',
      password: 'Admin@123', // This will be hashed by the pre-save hook
      role: adminRole.name,
      permissions: adminRole.permissions
    });
    console.log('Admin user created successfully!');
    console.log('Login Email: tanmaymk03@gmail.com');
    console.log('Password: Admin@123');

    // 4. Create Kuldeep User
    await User.deleteOne({ email: 'kuldeepkumawar2383@gmail.com' });
    const kuldeepUser = await User.create({
      name: 'Kuldeep Kumawat',
      email: 'kuldeepkumawar2383@gmail.com',
      password: 'Admin@123', // This will be hashed by the pre-save hook
      role: adminRole.name,
      permissions: adminRole.permissions
    });
    console.log('Kuldeep user created successfully!');
    console.log('Login Email: kuldeepkumawar2383@gmail.com');
    console.log('Password: Admin@123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedAdmin();
