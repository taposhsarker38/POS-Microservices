// app/(dashboard)/layout.tsx
"use client";

import { useRouter, usePathname } from 'next/navigation';
import { Provider } from 'react-redux';
import { store } from '@/store/store'; // Your Redux store
import ModernSidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header'; // Create this
import '../globals.css'; // Dashboard-specific styles

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (path: string) => {
    console.log('🧭 Dashboard Layout - Navigating to:', path);
    router.push(path);
  };

  return (
    <Provider store={store}>
      <div className="flex min-h-screen bg-gray-900">
        {/* Sidebar */}
        <ModernSidebar activePath={pathname} onNavigate={handleNavigate} />
        
        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </Provider>
  );
}