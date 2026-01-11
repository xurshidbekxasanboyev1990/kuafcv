'use client';

import { getFileUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Bookmark,
  Brain,
  Briefcase,
  ChevronDown,
  ChevronRight,
  FileCheck,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useLayout } from './LayoutProvider';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Bosh sahifa',
    roles: ['student', 'admin', 'registrar', 'employer'],
  },
  {
    href: '/portfolio',
    icon: Briefcase,
    label: 'Mening Portfolio',
    roles: ['student'],
    children: [
      { href: '/portfolio/academic', icon: BookOpen, label: 'Akademik faoliyat', roles: ['student'] },
      { href: '/portfolio/awards', icon: Trophy, label: 'Mukofotlar va yutuqlar', roles: ['student'] },
      { href: '/portfolio/leadership', icon: Users, label: 'Tashkiliy va yetakchilik', roles: ['student'] },
      { href: '/portfolio/social', icon: Heart, label: 'Ijtimoiy va kongillilik', roles: ['student'] },
      { href: '/portfolio/projects', icon: Target, label: 'Loyihalar va tashabbuslar', roles: ['student'] },
      { href: '/portfolio/technical', icon: BookMarked, label: 'Raqamli va texnik tajriba', roles: ['student'] },
      { href: '/portfolio/career', icon: Briefcase, label: 'Karyera va professional', roles: ['student'] },
      { href: '/portfolio/international', icon: GraduationCap, label: 'Xalqaro va tillar', roles: ['student'] },
    ],
  },
  {
    href: '/my-stats',
    icon: TrendingUp,
    label: 'Statistikam',
    roles: ['student'],
  },
  {
    href: '/analysis-history',
    icon: Brain,
    label: 'Tahlil Tarixi',
    roles: ['admin', 'registrar', 'student'],
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label: 'Analytics',
    roles: ['admin', 'registrar'],
  },
  {
    href: '/groups',
    icon: UserCheck,
    label: 'Talabalar',
    roles: ['admin', 'registrar'],
  },
  {
    href: '/registrar',
    icon: FileCheck,
    label: 'Portfoliolar',
    roles: ['admin', 'registrar'],
  },
  {
    href: '/employer',
    icon: Users,
    label: 'Talabalar',
    roles: ['employer'],
  },
  {
    href: '/bookmarks',
    icon: Bookmark,
    label: 'Saqlangan',
    roles: ['employer'],
  },
  {
    href: '/notifications',
    icon: Bell,
    label: 'Bildirishnomalar',
    roles: ['student', 'employer', 'admin', 'registrar'],
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Sozlamalar',
    roles: ['student', 'admin', 'registrar', 'employer'],
  },
];

export default function Sidebar({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed, isMobile, setSidebarOpenMobile } = useLayout();
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Expand parent if child is active
  useEffect(() => {
    const activeParent = navItems.find((item) =>
      item.children?.some((child) => child.href === pathname)
    );
    if (activeParent && !expandedItems.includes(activeParent.href)) {
      setExpandedItems((prev) => [...prev, activeParent.href]);
    }
  }, [pathname]);

  if (!mounted || !user) return null;

  const userRole = (user.role || 'student').toLowerCase();

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.includes(item.href);
    const hasChildren = item.children && item.children.length > 0;

    // Check if any child is active
    const isChildActive = item.children?.some(child => child.href === pathname);

    if (sidebarCollapsed && !isMobile && !isChild) {
      // Collapsed Desktop View
      return (
        <li key={item.href} className="relative group px-1 mb-1">
          <button
            onClick={() => {
              if (hasChildren) {
                setSidebarCollapsed(false);
                setExpandedItems([item.href]);
              } else {
                router.push(item.href);
              }
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md transition-all mx-auto",
              isActive || isChildActive
                ? "bg-white text-primary"
                : "text-white hover:bg-white/10"
            )}
            title={item.label}
          >
            <item.icon size={20} strokeWidth={isActive || isChildActive ? 2.5 : 2} />
          </button>

          {/* Tooltip for collapsed state */}
          <div className="absolute left-full top-0 ml-2 z-50 hidden px-2 py-1 text-xs text-primary bg-white rounded shadow-md group-hover:block whitespace-nowrap animate-in fade-in zoom-in-50 duration-200">
            {item.label}
          </div>
        </li>
      );
    }

    // Expanded / Mobile View
    return (
      <li key={item.href} className="px-3 mb-1">
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.href)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive || isExpanded || isChildActive
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white",
              isChild && "pl-8 text-xs"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={isChild ? 16 : 18} />
              <span>{item.label}</span>
            </div>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <Link
            href={item.href}
            onClick={() => {
              if (isMobile) setSidebarOpenMobile(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-primary shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white",
              isChild && "pl-8 text-xs"
            )}
          >
            <item.icon size={isChild ? 16 : 18} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </Link>
        )}

        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-0.5">
            {item.children
              ?.filter((child) => child.roles.includes(userRole))
              .map((child) => renderNavItem(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-primary text-primary-foreground transition-all duration-300 border-r border-primary/10",
        sidebarCollapsed && !isMobile ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex h-16 items-center px-4 border-b border-white/10",
        sidebarCollapsed && !isMobile ? "justify-center px-2" : "justify-between"
      )}>
        <Link
          href="/"
          onClick={() => isMobile && setSidebarOpenMobile(false)}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="h-full w-full object-contain" />
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <span className="text-lg font-bold tracking-tight text-white">KUAFCV</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <ul className="space-y-1">
          {navItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => renderNavItem(item))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        {(!sidebarCollapsed || isMobile) ? (
          <div className="mb-4 flex items-center gap-3 rounded-md bg-white/10 p-3">
            {user.profile_image ? (
              <div className="h-9 w-9 overflow-hidden rounded-full border border-white/20">
                <img
                  src={getFileUrl(user.profile_image)}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary text-sm font-bold">
                {user.full_name?.charAt(0) || user.email?.charAt(0)}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{user.full_name || user.email}</p>
              <p className="truncate text-xs text-white/70 capitalize">{user.role}</p>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex justify-center">
            {user.profile_image ? (
              <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20" title={user.full_name || ''}>
                <img
                  src={getFileUrl(user.profile_image)}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary text-xs font-bold" title={user.full_name || ''}>
                {user.full_name?.charAt(0) || user.email?.charAt(0)}
              </div>
            )}
          </div>
        )}

        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-2 rounded-md py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors",
            (sidebarCollapsed && !isMobile) ? "justify-center" : "px-3"
          )}
          title="Chiqish"
        >
          <LogOut size={18} />
          {(!sidebarCollapsed || isMobile) && <span>Chiqish</span>}
        </button>
      </div>
    </div>
  );
}
