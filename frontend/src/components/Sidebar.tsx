'use client';

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

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
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
    href: '/admin',
    icon: Users,
    label: 'Super Admin',
    roles: ['admin'],
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
];

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(['/portfolio']);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  if (!user) return null;

  const userRole = user.role?.toLowerCase() || '';
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const renderNavItem = (item: NavItem, isChild = false) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const isExpanded = expandedItems.includes(item.href);
    const hasChildren = item.children && item.children.length > 0;

    if (!isSidebarOpen && !isChild) {
      // Collapsed state - faqat ikonka
      return (
        <li key={item.href} className="relative group">
          {hasChildren ? (
            <button
              onClick={() => {
                setIsSidebarOpen(true);
                toggleExpanded(item.href);
              }}
              className={`w-full flex items-center justify-center p-3 rounded-lg transition-all ${isActive ? 'bg-white' : 'text-white hover:bg-white/10'
                }`}
              style={isActive ? { color: '#991B1B' } : {}}
              title={item.label}
            >
              <item.icon size={20} />
            </button>
          ) : (
            <Link
              href={item.href}
              className={`flex items-center justify-center p-3 rounded-lg transition-all ${isActive ? 'bg-white' : 'text-white hover:bg-white/10'
                }`}
              style={isActive ? { color: '#991B1B' } : {}}
              title={item.label}
            >
              <item.icon size={20} />
            </Link>
          )}
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {item.label}
          </div>
        </li>
      );
    }

    // Expanded state - to'liq ko'rinish
    return (
      <li key={item.href}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.href)}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all ${isActive ? 'bg-white font-medium shadow-lg' : 'text-white hover:bg-white/10'
              } ${isChild ? 'pl-8 text-sm' : ''}`}
            style={isActive ? { color: '#991B1B' } : {}}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              <span>{item.label}</span>
            </div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${isActive ? 'bg-white font-medium shadow-lg' : 'text-white hover:bg-white/10'
              } ${isChild ? 'pl-8 text-sm' : ''}`}
            style={isActive ? { color: '#991B1B' } : {}}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        )}
        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-1">
            {item.children
              ?.filter((child) => child.roles.includes(userRole))
              .map((child) => renderNavItem(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen text-white flex flex-col shadow-xl transition-all duration-300 z-40 ${isSidebarOpen ? 'w-64' : 'w-20'
          }`}
        style={{ backgroundColor: '#991B1B' }}
      >
        {/* Header with Logo - collapsible */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="KUAFCV Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">KUAFCV</h1>
                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Portfolio Tizimi</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="KUAFCV Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* User Info - collapsible */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="font-bold text-lg" style={{ color: '#991B1B' }}>
                  {user.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm truncate max-w-[140px]">{user.full_name || 'User'}</p>
                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{user.role}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="font-bold text-lg" style={{ color: '#991B1B' }}>
                  {user.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredItems.map((item) => renderNavItem(item))}
          </ul>
        </nav>

        {/* Footer with Profile and Logout */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          {isSidebarOpen ? (
            <>
              <Link
                href="/profile"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all mb-2 ${pathname === '/profile' ? 'bg-white font-medium shadow-lg' : 'text-white hover:bg-white/10'
                  }`}
                style={pathname === '/profile' ? { color: '#991B1B' } : {}}
              >
                <Settings size={20} />
                <span>Profil</span>
              </Link>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-white transition-all hover:bg-white/10"
              >
                <ChevronRight size={20} />
                <span>Yig'ish</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/profile"
                className={`flex items-center justify-center p-3 rounded-lg transition-all mb-2 ${pathname === '/profile' ? 'bg-white' : 'text-white hover:bg-white/10'
                  }`}
                style={pathname === '/profile' ? { color: '#991B1B' } : {}}
                title="Profil"
              >
                <Settings size={20} />
              </Link>

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center justify-center p-3 w-full rounded-lg text-white transition-all hover:bg-white/10"
                title="Ochish"
              >
                <ChevronDown size={20} />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Spacer for content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`} />
    </>
  );
}
