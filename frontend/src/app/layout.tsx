import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import { WebSocketProvider } from '@/components/WebSocketProvider';
import GlobalChat from '@/components/GlobalChat';
import './globals.css';

export const metadata: Metadata = {
  title: 'KUAFCV - Portfolio Tizimi',
  description: 'Talabalar portfolio boshqaruv tizimi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="bg-red-50 min-h-screen">
        <AuthProvider>
          <WebSocketProvider>
            {children}
            <GlobalChat />
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
