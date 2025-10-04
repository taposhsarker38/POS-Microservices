// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from "@/providers/Providers";
import { env } from '@/lib/env';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

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
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <Providers companyId={env.companyId}>
          {children}
        </Providers>
      </body>
    </html>
  );
}