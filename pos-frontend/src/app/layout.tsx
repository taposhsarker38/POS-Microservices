// src/app/layout.tsx
import './globals.css';
import "../styles/tailwind.input.css"; // path তোমার স্ট্রাকচারের অনুয়ায়ী ঠিক করো

import Providers from '../components/Providers';

export const metadata = {
  title: 'StockMate POS',
  description: 'POS frontend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // This file stays a Server Component (no 'use client' at top)
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
      {/* <script src="https://cdn.tailwindcss.com"></script> */}
    </html>
  );
}
