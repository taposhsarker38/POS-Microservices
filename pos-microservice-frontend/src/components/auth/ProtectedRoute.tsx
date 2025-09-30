// src/components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  fallback 
}: ProtectedRouteProps) {
  const { 
    isAuthenticated, 
    user, 
    requireAuth, 
    redirectIfAuthenticated,
    isLoading 
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Handle auth routes (login, register)
    if (['/login', '/register'].includes(pathname)) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      }
      return;
    }

    // Handle protected routes
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    // Check permissions
    if (requiredPermissions.length > 0 && user) {
      const hasPermission = requiredPermissions.every(permission => 
        user.permissions?.includes(permission)
      );
      
      if (!hasPermission) {
        router.replace('/unauthorized');
        return;
      }
    }
  }, [
    isAuthenticated, 
    user, 
    requireAuth, 
    pathname, 
    router, 
    requiredPermissions,
    isLoading
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated && !['/login', '/register'].includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated && ['/login', '/register'].includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}