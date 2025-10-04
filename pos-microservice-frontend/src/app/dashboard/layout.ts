// src/app/(dashboard)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/features/auth/api';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled by useAuth hook
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">POS Dashboard</h1>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/users"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Users
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Orders
                </Link>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-sm text-gray-700 mr-4">
                  Welcome, {user?.first_name} {user?.last_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}