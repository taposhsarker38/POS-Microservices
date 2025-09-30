// providers/Providers.tsx
'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { makeStore } from '@/store';

interface ProvidersProps {
  children: ReactNode;
  companyId: string;
}

export function Providers({ children, companyId }: ProvidersProps) {
  const store = makeStore();

  return (
    <Provider store={store}>
      <ThemeProvider companyId={companyId}>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </ThemeProvider>
    </Provider>
  );
}