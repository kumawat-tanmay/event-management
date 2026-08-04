export const PERMISSION_MODULES = [
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
