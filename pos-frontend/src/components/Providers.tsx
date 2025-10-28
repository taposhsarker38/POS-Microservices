
'use client';

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../store/store';
import AuthHydrator from './AuthHydrator';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <AuthHydrator>
        {children}
      </AuthHydrator>
    </ReduxProvider>
  );
}
