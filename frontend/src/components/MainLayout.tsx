// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { useLayout } from './LayoutProvider';
import MarqueeBanner from './MarqueeBanner';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  showMarquee?: boolean;
}

export default function MainLayout({ children, showMarquee = true }: MainLayoutProps) {
  const { sidebarCollapsed } = useLayout();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-red-50">
      <Sidebar />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'ml-0 md:ml-64'
          }`}
      >
        {/* Marquee Banner */}
        {showMarquee && user && (
          <MarqueeBanner userRole={user.role} />
        )}

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
