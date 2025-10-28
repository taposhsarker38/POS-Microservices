// app/(dashboard)/layout.tsx
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { Provider } from 'react-redux';
import { store } from '@/store/store'; 
import ModernSidebar from '@/components/layout/Sidebar';
import '../globals.css';
import HeaderWithSettings from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <Provider store={store}>
      <div className="flex h-screen overflow-hidden bg-gray-900">
        <ModernSidebar activePath={pathname} onNavigate={handleNavigate} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-20">
          <HeaderWithSettings />
          </div>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </Provider>
  );
}