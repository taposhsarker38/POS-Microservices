// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import {Providers} from "@/providers/Providers"
import { env } from '@/lib/env';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'POS System - Microservices',
  description: 'Modern Point of Sale System with Microservices Architecture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers companyId={env.companyId}>
          {children}
        </Providers>
      </body>
    </html>
  );
}