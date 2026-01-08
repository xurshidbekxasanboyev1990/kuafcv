// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
import { AuthProvider } from '@/components/AuthProvider';
import GlobalChat from '@/components/GlobalChat';
import { LayoutProvider } from '@/components/LayoutProvider';
import { WebSocketProvider } from '@/components/WebSocketProvider';
import type { Metadata } from 'next';
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
          <LayoutProvider>
            <WebSocketProvider>
              {children}
              <GlobalChat />
            </WebSocketProvider>
          </LayoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
