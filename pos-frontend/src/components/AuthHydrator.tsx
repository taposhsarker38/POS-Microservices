// src/components/AuthHydrator.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { setAccessToken, setRefreshToken } from '../store/authSlice';

export default function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const serverAccess = Cookies.get('access'); // sometimes backend uses this name
      const clientAccess = Cookies.get('access_token');
      const refresh = Cookies.get('refresh_token');

      // remove accidental "undefined"
      if (clientAccess === 'undefined') {
        Cookies.remove('access_token', { path: '/' });
      }

      const accessToUse =
        serverAccess && serverAccess !== 'undefined'
          ? serverAccess
          : clientAccess && clientAccess !== 'undefined'
          ? clientAccess
          : null;

      if (accessToUse) dispatch(setAccessToken(accessToUse));
      if (refresh && refresh !== 'undefined') dispatch(setRefreshToken(refresh));
    } catch (e) {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, [dispatch]);

  if (!hydrated) return null;
  return <>{children}</>;
}
