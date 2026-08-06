// ═══════════════════════════════════════════════════════════════════════════════
// Krishna Event ERP: RBAC Permission Registry — Single Source of Truth
// Format:  module.action  (e.g., "dashboard.view")
// Wildcards: "*" (Owner bypass), "module.*" (full module access)
// ═══════════════════════════════════════════════════════════════════════════════

const PERMISSIONS = {
  ALL: '*',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Calendar
  CALENDAR_VIEW: 'calendar.view',

  // CRM
  CRM_VIEW: 'crm.view',
  CRM_CREATE: 'crm.create',
  CRM_UPDATE: 'crm.update',
  CRM_DELETE: 'crm.delete',

  // Quotations
  QUOTATIONS_VIEW: 'quotations.view',
  QUOTATIONS_CREATE: 'quotations.create',
  QUOTATIONS_UPDATE: 'quotations.update',
  QUOTATIONS_DELETE: 'quotations.delete',
  QUOTATIONS_APPROVE: 'quotations.approve',

  // Bookings
  BOOKINGS_VIEW: 'bookings.view',
  BOOKINGS_CREATE: 'bookings.create',
  BOOKINGS_UPDATE: 'bookings.update',
  BOOKINGS_DELETE: 'bookings.delete',

  // Warehouses
  WAREHOUSES_VIEW: 'warehouses.view',
  WAREHOUSES_CREATE: 'warehouses.create',
  WAREHOUSES_UPDATE: 'warehouses.update',
  WAREHOUSES_DELETE: 'warehouses.delete',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',

  // Operations / Dispatch
  OPERATIONS_VIEW: 'operations.view',
  OPERATIONS_CREATE: 'operations.create',
  OPERATIONS_UPDATE: 'operations.update',
  OPERATIONS_DELETE: 'operations.delete',

  // Finance
  FINANCE_VIEW: 'finance.view',
  FINANCE_CREATE: 'finance.create',
  FINANCE_UPDATE: 'finance.update',
  FINANCE_DELETE: 'finance.delete',

  // Purchases
  PURCHASES_VIEW: 'purchases.view',
  PURCHASES_CREATE: 'purchases.create',
  PURCHASES_UPDATE: 'purchases.update',
  PURCHASES_DELETE: 'purchases.delete',

  // HR
  HR_VIEW: 'hr.view',
  HR_CREATE: 'hr.create',
  HR_UPDATE: 'hr.update',
  HR_DELETE: 'hr.delete',

  // Reports
  REPORTS_VIEW: 'reports.view',

  // Settings (Users & Roles)
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_SUSPEND: 'users.suspend',
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  COMPANY_SETTINGS_UPDATE: 'company.update'
};

// ─── Permission Modules (Grouped for Frontend UI Builder) ───
const PERMISSION_MODULES = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    permissions: [{ key: 'dashboard.view', label: 'View Dashboard Statistics' }],
  },
  {
    module: 'calendar',
    label: 'Calendar',
    permissions: [{ key: 'calendar.view', label: 'View Event Calendar' }],
  },
  {
    module: 'crm',
    label: 'CRM',
    permissions: [
      { key: 'crm.view', label: 'View Customers & Leads' },
      { key: 'crm.create', label: 'Create Customers & Leads' },
      { key: 'crm.update', label: 'Update Customers & Leads' },
      { key: 'crm.delete', label: 'Delete Customers & Leads' },
    ],
  },
  {
    module: 'quotations',
    label: 'Quotations',
    permissions: [
      { key: 'quotations.view', label: 'View Quotations' },
      { key: 'quotations.create', label: 'Create Quotations' },
      { key: 'quotations.update', label: 'Update Quotations' },
      { key: 'quotations.delete', label: 'Delete Quotations' },
      { key: 'quotations.approve', label: 'Approve Quotations' },
    ],
  },
  {
    module: 'bookings',
    label: 'Bookings',
    permissions: [
      { key: 'bookings.view', label: 'View Bookings' },
      { key: 'bookings.create', label: 'Create Bookings' },
      { key: 'bookings.update', label: 'Update Bookings' },
      { key: 'bookings.delete', label: 'Delete Bookings' },
    ],
  },
  {
    module: 'warehouses',
    label: 'Warehouses',
    permissions: [
      { key: 'warehouses.view', label: 'View Warehouses & Racks' },
      { key: 'warehouses.create', label: 'Create Warehouses' },
      { key: 'warehouses.update', label: 'Update Warehouses' },
      { key: 'warehouses.delete', label: 'Delete Warehouses' },
    ],
  },
  {
    module: 'inventory',
    label: 'Inventory',
    permissions: [
      { key: 'inventory.view', label: 'View Inventory & Stock' },
      { key: 'inventory.create', label: 'Create Inventory Items' },
      { key: 'inventory.update', label: 'Update Inventory Items' },
      { key: 'inventory.delete', label: 'Delete Inventory Items' },
    ],
  },
  {
    module: 'operations',
    label: 'Operations & Dispatch',
    permissions: [
      { key: 'operations.view', label: 'View Operations (Dispatch, Returns)' },
      { key: 'operations.create', label: 'Create Operations' },
      { key: 'operations.update', label: 'Update Operations' },
      { key: 'operations.delete', label: 'Delete Operations' },
    ],
  },
  {
    module: 'finance',
    label: 'Finance',
    permissions: [
      { key: 'finance.view', label: 'View Finance (Invoices, Payments)' },
      { key: 'finance.create', label: 'Create Finance Records' },
      { key: 'finance.update', label: 'Update Finance Records' },
      { key: 'finance.delete', label: 'Delete Finance Records' },
    ],
  },
  {
    module: 'purchases',
    label: 'Purchases',
    permissions: [
      { key: 'purchases.view', label: 'View Purchases & Vendors' },
      { key: 'purchases.create', label: 'Create Purchases' },
      { key: 'purchases.update', label: 'Update Purchases' },
      { key: 'purchases.delete', label: 'Delete Purchases' },
    ],
  },
  {
    module: 'hr',
    label: 'HR & Staff',
    permissions: [
      { key: 'hr.view', label: 'View Staff & Vehicles' },
      { key: 'hr.create', label: 'Create Staff Records' },
      { key: 'hr.update', label: 'Update Staff Records' },
      { key: 'hr.delete', label: 'Delete Staff Records' },
    ],
  },
  {
    module: 'reports',
    label: 'Reports',
    permissions: [
      { key: 'reports.view', label: 'View ERP Reports' },
    ],
  },
  {
    module: 'users',
    label: 'User Management',
    permissions: [
      { key: 'users.view', label: 'View Users' },
      { key: 'users.create', label: 'Create Users' },
      { key: 'users.update', label: 'Update Users' },
      { key: 'users.suspend', label: 'Suspend/Activate Users' },
    ],
  },
  {
    module: 'roles',
    label: 'Role Management',
    permissions: [
      { key: 'roles.view', label: 'View Roles' },
      { key: 'roles.create', label: 'Create Roles' },
      { key: 'roles.update', label: 'Update Roles' },
      { key: 'roles.delete', label: 'Delete Roles' },
    ],
  },
  {
    module: 'company',
    label: 'Company Settings',
    permissions: [
      { key: 'company.update', label: 'Update Company Settings' },
    ],
  }
];

// ─── Default Hardcoded Role Templates (Krishna ERP) ───
const DEFAULT_ROLES = {
  owner: {
    name: 'Owner',
    description: 'Master Owner with unrestricted access across the entire ERP.',
    permissions: [PERMISSIONS.ALL],
    isSystem: true
  },
  admin: {
    name: 'Admin',
    description: 'Senior Administrator with full unrestricted access across the entire ERP.',
    permissions: [PERMISSIONS.ALL],
    isSystem: true
  },
  manager: {
    name: 'Manager',
    description: 'General Manager handling CRM and Bookings. View-only access to Warehouses/Inventory.',
    permissions: [
      'dashboard.view', 'calendar.view', 'crm.*', 'quotations.*', 'bookings.*',
      'warehouses.view', 'inventory.view', 'operations.*', 'reports.view', 'hr.view'
    ],
    isSystem: true
  },
};

module.exports = { PERMISSIONS, PERMISSION_MODULES, DEFAULT_ROLES };
