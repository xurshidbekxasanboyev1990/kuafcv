// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { getFileUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useLayout } from './LayoutProvider';
import MarqueeBanner from './MarqueeBanner';
import Sidebar from './Sidebar';
import { Button } from './ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
  showMarquee?: boolean;
}

export default function MainLayout({ children, showMarquee = true }: MainLayoutProps) {
  const { sidebarCollapsed, isMobile, isSidebarOpenMobile, setSidebarOpenMobile, toggleSidebar } = useLayout();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpenMobile(false)}
        />
      )}

      {/* Sidebar: Desktop (Sticky) & Mobile (Fixed Drawer) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 h-[100dvh] transition-transform duration-300 lg:sticky lg:top-0 lg:transform-none lg:z-0 shadow-2xl lg:shadow-none bg-primary",
        isMobile
          ? (isSidebarOpenMobile ? "translate-x-0" : "-translate-x-full")
          : "translate-x-0"
      )}>
        <Sidebar />
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all">

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-primary-foreground hover:bg-white/10 -ml-2">
              <Menu size={24} />
            </Button>
            <span className="font-bold text-lg">KUAFCV</span>
          </div>
          {user && (
            user.profile_image ? (
              <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/20">
                <img
                  src={getFileUrl(user.profile_image)}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-full bg-white text-primary flex items-center justify-center font-bold text-sm ring-2 ring-white/20">
                {user.full_name?.charAt(0) || user.email?.charAt(0)}
              </div>
            )
          )}
        </header>

        {/* Marquee Banner */}
        {showMarquee && user && (
          <MarqueeBanner userRole={user.role} />
        )}

        {/* Content Scroll Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

