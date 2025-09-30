import { PERMISSIONS, Permission } from './permissions';

export interface NavigationItem {
  id: string;
  title: string;
  path?: string;
  icon: string;
  permission?: Permission;
  children?: NavigationItem[];
  badge?: number;
}

export const SIDEBAR_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    id: 'sales',
    title: 'Sales',
    icon: 'ShoppingCart',
    permission: PERMISSIONS.SALES_VIEW,
    children: [
      {
        id: 'pos',
        title: 'Point of Sale',
        path: '/sales/pos',
        icon: 'Monitor',
        permission: PERMISSIONS.SALES_CREATE,
      },
      {
        id: 'orders',
        title: 'Orders',
        path: '/sales/orders',
        icon: 'ListOrdered',
        permission: PERMISSIONS.ORDERS_VIEW,
      },
      {
        id: 'invoices',
        title: 'Invoices',
        path: '/sales/invoices',
        icon: 'Receipt',
        permission: PERMISSIONS.ORDERS_VIEW,
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: 'Package',
    permission: PERMISSIONS.INVENTORY_VIEW,
    children: [
      {
        id: 'products',
        title: 'Products',
        path: '/inventory/products',
        icon: 'Package',
        permission: PERMISSIONS.PRODUCTS_VIEW,
      },
      {
        id: 'categories',
        title: 'Categories',
        path: '/inventory/categories',
        icon: 'Tags',
        permission: PERMISSIONS.PRODUCTS_VIEW,
      },
      {
        id: 'stock',
        title: 'Stock Management',
        path: '/inventory/stock',
        icon: 'Warehouse',
        permission: PERMISSIONS.INVENTORY_MANAGE,
      },
      {
        id: 'suppliers',
        title: 'Suppliers',
        path: '/inventory/suppliers',
        icon: 'Truck',
        permission: PERMISSIONS.INVENTORY_MANAGE,
      },
    ],
  },
  {
    id: 'users',
    title: 'User Management',
    icon: 'Users',
    permission: PERMISSIONS.USERS_VIEW,
    children: [
      {
        id: 'all-users',
        title: 'All Users',
        path: '/users',
        icon: 'User',
        permission: PERMISSIONS.USERS_VIEW,
      },
      {
        id: 'create-user',
        title: 'Add User',
        path: '/users/create',
        icon: 'UserPlus',
        permission: PERMISSIONS.USERS_CREATE,
      },
      {
        id: 'roles',
        title: 'Roles & Permissions',
        path: '/users/roles',
        icon: 'Shield',
        permission: PERMISSIONS.USERS_MANAGE_ROLES,
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    icon: 'BarChart3',
    permission: PERMISSIONS.REPORTS_VIEW,
    children: [
      {
        id: 'sales-reports',
        title: 'Sales Reports',
        path: '/reports/sales',
        icon: 'TrendingUp',
        permission: PERMISSIONS.REPORTS_VIEW,
      },
      {
        id: 'inventory-reports',
        title: 'Inventory Reports',
        path: '/reports/inventory',
        icon: 'Package',
        permission: PERMISSIONS.REPORTS_VIEW,
      },
      {
        id: 'financial-reports',
        title: 'Financial Reports',
        path: '/reports/financial',
        icon: 'DollarSign',
        permission: PERMISSIONS.REPORTS_VIEW,
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/settings',
    icon: 'Settings',
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

export const getFilteredNavigation = (userPermissions: string[]): NavigationItem[] => {
  return SIDEBAR_NAVIGATION.filter(item => {
    // Check parent permission
    if (item.permission && !userPermissions.includes(item.permission)) {
      return false;
    }

    // Filter children based on permissions
    if (item.children) {
      item.children = item.children.filter(child =>
        !child.permission || userPermissions.includes(child.permission)
      );
      
      // Remove parent if no children remain and it has no direct path
      if (item.children.length === 0 && !item.path) {
        return false;
      }
    }

    return true;
  });
};

export const hasPermission = (userPermissions: string[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
};