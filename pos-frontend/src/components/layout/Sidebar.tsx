"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Warehouse,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Building2,
  Sparkles,
  ChevronDown as ChevronDownIcon,
  Shield,
  UserCog,
  Navigation,
} from "lucide-react";
import { useWhoamiQuery, useGetCompanyQuery, useGetCompanySettingsQuery, useGetCompanyNavQuery } from "@/store/api";
import { skipToken } from '@reduxjs/toolkit/query/react';

type NavItem = {
  id: string;
  title: string;
  path: string | null;
  children?: NavItem[];
  parent?: string | null;
  order: number;
  permission_code?: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

type SidebarProps = {
  activePath?: string;
  onNavigate?: (href: string) => void;
};

function getIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('dashboard')) return LayoutDashboard;
  if (lower.includes('product')) return Package;
  if (lower.includes('inventory')) return Warehouse;
  if (lower.includes('sales')) return ShoppingCart;
  if (lower.includes('purchase')) return ShoppingBag;
  if (lower.includes('customer')) return Users;
  if (lower.includes('transaction')) return DollarSign;
  if (lower.includes('report')) return BarChart3;
  if (lower.includes('document')) return FileText;
  if (lower.includes('settings')) return Settings;
  if (lower.includes('admin')) return Shield;
  if (lower.includes('user')) return UserCog;
  if (lower.includes('role')) return Shield;
  if (lower.includes('permission')) return Shield;
  if (lower.includes('navigation')) return Navigation;
  if (lower.includes('company')) return Building2;
  return LayoutDashboard;
}

function getColor(title: string) {
  const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'indigo', 'emerald', 'cyan', 'yellow'];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ModernSidebar({
  activePath = "/dashboard",
  onNavigate,
}: SidebarProps) {
  const { data: me, isLoading: meLoading, error: meError } = useWhoamiQuery();
  
  // Debug logs
  useEffect(() => {
    console.log('🔍 Sidebar - useWhoamiQuery state:', {
      data: me,
      isLoading: meLoading,
      error: meError,
    });
  }, [me, meLoading, meError]);
  
  const { data: companyData } = useGetCompanyQuery(me?.company_id ?? skipToken);
  const { data: settings } = useGetCompanySettingsQuery(me?.company_id ?? skipToken);
  const { data: navItems = [] } = useGetCompanyNavQuery(me?.company_id ?? skipToken);

  // Debug: Check if user is superuser
  useEffect(() => {
    console.log('Current User:', me);
    console.log('Is Superuser:', me?.is_superuser);
    console.log('User email:', me?.email);
  }, [me]);

  // Superuser special menu items
  // If your API doesn't return is_superuser, you can manually check email:
  const isSuperuser = me?.is_superuser === true || me?.email === 'admin@example.com'; // Replace with your admin email
  
  const superuserItems: NavItem[] = isSuperuser ? [
    {
      id: 'admin-section',
      title: 'Admin Panel',
      path: null,
      order: 9999,
      metadata: {},
      created_at: new Date().toISOString(),
      children: [
        {
          id: 'users-management',
          title: 'User Management',
          path: '/admin/users',
          order: 1,
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'roles-permissions',
          title: 'Roles & Permissions',
          path: '/admin/roles',
          order: 2,
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'company-settings-admin',
          title: 'Company Settings',
          path: '/admin/company-settings',
          order: 3,
          metadata: {},
          created_at: new Date().toISOString(),
        },
        {
          id: 'nav-management',
          title: 'Navigation Management',
          path: '/admin/navigation',
          order: 4,
          metadata: {},
          created_at: new Date().toISOString(),
        },
      ],
    },
  ] : [];

  // Combine regular nav items with superuser items
  const allNavItems = [...navItems, ...superuserItems];

  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (settings?.primary_color) {
      document.documentElement.style.setProperty("--primary", settings.primary_color);
    }
  }, [settings]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleItemClick = (item: NavItem) => {
    if (item.children?.length) {
      toggleExpand(item.id);
    } else if (onNavigate && item.path) {
      onNavigate(item.path);
    }
  };

  const renderItem = (item: NavItem, depth: number = 0) => {
    const isActive = activePath === item.path;
    const isHovered = hoveredItem === item.id;
    const hasChildren = !!item.children?.length;
    const isExpanded = expandedItems.has(item.id);
    const Icon = getIcon(item.title);
    const color = getColor(item.title);
    const isAdminItem = item.id.includes('admin') || item.title.toLowerCase().includes('admin');

    return (
      <div key={item.id}>
        <motion.button
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full flex items-center gap-3 px-${3 + depth * 4} py-3 rounded-xl transition-all duration-200 group relative
            ${isActive 
              ? isAdminItem 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30" 
                : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }
          `}
        >
          <div
            className={`
              h-9 w-9 rounded-lg flex items-center justify-center transition-all text-white
              ${isActive 
                ? "bg-white/20" 
                : isAdminItem
                  ? `bg-gradient-to-br from-amber-500 to-orange-600 group-hover:scale-110`
                  : `bg-gradient-to-br from-${color}-500 to-${color}-600 group-hover:scale-110`
              }
            `}
          >
            <Icon className="h-5 w-5" />
          </div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex-1 text-left flex items-center gap-2"
              >
                <span className="font-medium text-sm">{item.title}</span>
                {hasChildren && (
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isActive && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}

          {collapsed && (isHovered || isActive) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full ml-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg shadow-xl whitespace-nowrap z-50"
            >
              {item.title}
            </motion.div>
          )}
        </motion.button>

        <AnimatePresence>
          {hasChildren && isExpanded && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.children?.map((child) => renderItem(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-xl flex flex-col"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          className="flex items-center gap-3 cursor-pointer group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {settings?.logo ? (
            <img
              src={settings.logo}
              alt="Logo"
              className="h-12 w-12 rounded-xl object-cover shadow-lg ring-2 ring-white dark:ring-slate-800"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-white dark:ring-slate-800"
              style={{
                background: `linear-gradient(135deg, ${settings?.primary_color || "#6366f1"}, ${settings?.primary_color || "#6366f1"}dd)`,
              }}
            >
              <Building2 className="h-6 w-6" />
            </div>
          )}

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {companyData?.name || "StockMate"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                  <Sparkles className="h-3 w-3" />
                  Inventory System
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="mt-4 grid grid-cols-2 gap-2"
            >
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mb-1" />
                <p className="text-xs font-semibold text-green-900 dark:text-green-100">
                  ৳45.2K
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400">
                  Sales Today
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                  1,234
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">
                  Products
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
        {allNavItems.map((item) => (
          <React.Fragment key={item.id}>
            {/* Add separator before admin section */}
            {item.id === 'admin-section' && (
              <div className="py-3">
                <div className="border-t border-slate-300 dark:border-slate-700 mb-3"></div>
                {!collapsed && (
                  <div className="flex items-center gap-2 px-3 mb-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Admin Zone
                    </span>
                  </div>
                )}
              </div>
            )}
            {renderItem(item)}
          </React.Fragment>
        ))}
      </nav>

      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute -right-4 top-20 h-8 w-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200 z-50"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </motion.button>
    </motion.aside>
  );
}