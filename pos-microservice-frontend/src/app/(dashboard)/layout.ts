// app/(dashboard)/layout.tsx
'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { getFilteredNavigation } from '@/lib/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { logPageVisit } = useActivityLogger();

  useEffect(() => {
    if (isAuthenticated && user) {
      logPageVisit('Dashboard');
    }
  }, [isAuthenticated, user, logPageVisit]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Redirect handled by middleware
  }

  const navigation = getFilteredNavigation(user.user_permissions || []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar navigation={navigation} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}