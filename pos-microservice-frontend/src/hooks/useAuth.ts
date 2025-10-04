// src/hooks/useAuth.ts
import { useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { 
  selectCurrentUser, 
  selectAccessToken,
  logout 
} from '@/features/auth/authSlice';
import { useRefreshTokenMutation } from '@/features/auth/api';
import { useAppDispatch, useAppSelector } from './hooks';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAccessToken);
  const [refreshToken] = useRefreshTokenMutation();

  const checkAuth = useCallback(async () => {
    if (!token) return false;
    
    try {
      // Verify token validity
      await refreshToken().unwrap();
      return true;
    } catch (error) {
      dispatch(logout());
      return false;
    }
  }, [token, refreshToken, dispatch]);

  const requireAuth = useCallback(async (redirectPath: string = '/login') => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated && pathname !== redirectPath) {
      router.push(`${redirectPath}?redirect=${encodeURIComponent(pathname)}`);
      return false;
    }
    return isAuthenticated;
  }, [checkAuth, pathname, router]);

  const redirectIfAuthenticated = useCallback((redirectPath: string = '/dashboard') => {
    if (token && user && pathname === '/login') {
      router.push(redirectPath);
      return true;
    }
    return false;
  }, [token, user, pathname, router]);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    checkAuth,
    requireAuth,
    redirectIfAuthenticated
  };
};