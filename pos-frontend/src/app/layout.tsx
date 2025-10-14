import './globals.css';
import "../styles/tailwind.input.css"; 
import Providers from '../components/Providers';
export const metadata = {
  title: 'StockMate POS',
  description: 'POS frontend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
