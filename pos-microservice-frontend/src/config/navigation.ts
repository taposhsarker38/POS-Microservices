// src/config/navigation.ts
import { PERMISSIONS } from '@/lib/permissions';
import { NavItem } from '@/types/navigation';

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    id: 'orders',
    title: 'Orders',
    path: '/orders',
    icon: 'orders',
    permission: PERMISSIONS.ORDERS_VIEW,
    children: [
      {
        id: 'orders-list',
        title: 'All Orders',
        path: '/orders',
        permission: PERMISSIONS.ORDERS_VIEW,
      },
      {
        id: 'orders-create',
        title: 'Create Order',
        path: '/orders/create',
        permission: PERMISSIONS.ORDERS_CREATE,
      },
    ],
  },
  {
    id: 'users',
    title: 'User Management',
    path: '/users',
    icon: 'users',
    permission: PERMISSIONS.USERS_VIEW,
    children: [
      {
        id: 'users-list',
        title: 'All Users',
        path: '/users',
        permission: PERMISSIONS.USERS_VIEW,
      },
      {
        id: 'users-create',
        title: 'Add User',
        path: '/users/create',
        permission: PERMISSIONS.USERS_CREATE,
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    icon: 'reports',
    permission: PERMISSIONS.REPORTS_VIEW,
    children: [
      {
        id: 'reports-sales',
        title: 'Sales Reports',
        path: '/reports/sales',
        permission: PERMISSIONS.REPORTS_VIEW,
      },
      {
        id: 'reports-export',
        title: 'Export Data',
        path: '/reports/export',
        permission: PERMISSIONS.REPORTS_EXPORT,
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/settings',
    icon: 'settings',
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

export const getFilteredNavigation = (userPermissions: string[]): NavItem[] => {
  return NAVIGATION_ITEMS.filter(item => {
    // Check main item permission
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