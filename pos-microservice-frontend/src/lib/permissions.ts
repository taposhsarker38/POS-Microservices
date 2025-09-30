export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  
  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DELETE: 'orders.delete',
  
  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',
  
  // Sales
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_MANAGE: 'sales.manage',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  
  // Company
  COMPANY_MANAGE: 'company.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];