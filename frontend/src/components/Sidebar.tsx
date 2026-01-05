'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import {
  Home,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  Briefcase,
  CheckSquare,
  UserCheck,
  BarChart3,
  History,
  Brain,
  TrendingUp,
  Bookmark,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home size={20} />, roles: ['admin', 'registrar', 'employer'] },
  { href: '/admin', label: 'Super Admin', icon: <Users size={20} />, roles: ['admin'] },
  { href: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} />, roles: ['admin', 'registrar'] },
  { href: '/groups', label: 'Talabalar', icon: <UserCheck size={20} />, roles: ['admin', 'registrar'] },
  { href: '/registrar', label: 'Portfoliolar', icon: <CheckSquare size={20} />, roles: ['admin', 'registrar'] },
  { href: '/employer', label: 'Talabalar', icon: <Briefcase size={20} />, roles: ['employer'] },
  { href: '/bookmarks', label: 'Saqlangan', icon: <Bookmark size={20} />, roles: ['employer'] },
  { href: '/portfolio', label: 'Mening Portfolio', icon: <FileText size={20} />, roles: ['student'] },
  { href: '/my-stats', label: 'Statistikam', icon: <TrendingUp size={20} />, roles: ['student'] },
  { href: '/analysis-history', label: 'Tahlil Tarixi', icon: <Brain size={20} />, roles: ['admin', 'registrar', 'student'] },
  { href: '/notifications', label: 'Bildirishnomalar', icon: <Bell size={20} />, roles: ['admin', 'registrar', 'employer', 'student'] },
  { href: '/profile', label: 'Profil', icon: <Settings size={20} />, roles: ['admin', 'registrar', 'employer', 'student'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  // Role tekshiruvini case-insensitive qilish
  const userRole = user.role?.toLowerCase() || '';
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 text-white flex flex-col shadow-xl" style={{ backgroundColor: '#991B1B' }}>
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
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
      </div>

      {/* User Info */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="font-bold text-lg" style={{ color: '#991B1B' }}>
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm truncate max-w-[140px]">{user.full_name}</p>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white font-medium shadow-lg'
                      : 'text-white'
                  }`}
                  style={isActive ? { color: '#991B1B' } : {}}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white transition-all"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={20} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}


