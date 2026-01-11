'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Bell,
  Brain,
  Building,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Download,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Globe,
  GraduationCap,
  Key,
  Link,
  Lock,
  LogOut,
  Megaphone,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Webhook,
  X,
} from 'lucide-react';

const SK = 'xurshidbekxasanboyev@kuafcv.uz';
const SP = 'otamonam9900';
const ST = 'xk_super_token_9m2v7p';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type TabType = 'dashboard' | 'students' | 'staff' | 'portfolios' | 'categories' | 'webhooks' | 'ai-analytics' | 'announcements' | 'notifications' | 'settings' | 'system';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  student_id?: string;
  student_data?: {
    faculty?: string;
    specialty?: string;
    course?: number;
    group?: string;
  };
  company_name?: string;
}

export default function SuperAdminPanel() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(ST);
    if (token === 'authenticated') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (loginForm.email === SK && loginForm.password === SP) {
      sessionStorage.setItem(ST, 'authenticated');
      setIsAuthenticated(true);
    } else {
      setLoginError('Email yoki parol noto\'g\'ri');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ST);
    setIsAuthenticated(false);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-purple-500/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Maxfiy Panel</h1>
            <p className="text-gray-400 text-sm mt-1">Faqat Super Admin uchun</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="admin@kuafcv.uz"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Key size={18} />
              Kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
    { id: 'students', label: 'Talabalar', icon: <GraduationCap size={18} /> },
    { id: 'staff', label: 'Xodimlar', icon: <Users size={18} /> },
    { id: 'portfolios', label: 'Portfoliolar', icon: <FileText size={18} /> },
    { id: 'categories', label: 'Kategoriyalar', icon: <Palette size={18} /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Webhook size={18} /> },
    { id: 'ai-analytics', label: 'AI Tahlil', icon: <Brain size={18} /> },
    { id: 'announcements', label: "E'lonlar", icon: <Megaphone size={18} /> },
    { id: 'notifications', label: 'Bildirishnomalar', icon: <Bell size={18} /> },
    { id: 'settings', label: 'Sozlamalar', icon: <Settings size={18} /> },
    { id: 'system', label: 'Tizim', icon: <Server size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900">
      <header className="bg-gray-800/80 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Super Admin</h1>
              <p className="text-xs text-purple-300">Maxfiy Boshqaruv Paneli</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            <LogOut size={18} />
            Chiqish
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'students' && <StudentsTab setMessage={setMessage} />}
          {activeTab === 'staff' && <StaffTab setMessage={setMessage} />}
          {activeTab === 'portfolios' && <PortfoliosTab />}
          {activeTab === 'categories' && <CategoriesTab setMessage={setMessage} />}
          {activeTab === 'webhooks' && <WebhooksTab setMessage={setMessage} />}
          {activeTab === 'ai-analytics' && <AIAnalyticsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab setMessage={setMessage} />}
          {activeTab === 'notifications' && <NotificationsTab setMessage={setMessage} />}
          {activeTab === 'settings' && <SettingsTab setMessage={setMessage} />}
          {activeTab === 'system' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}

// Placeholder komponentlar
function DashboardTab() { return <div className="text-white text-center py-12">Super Admin Dashboard - tez orada...</div>; }
function StudentsTab({ setMessage }: any) { return <div className="text-white text-center py-12">Talabalar boshqaruvi - tez orada...</div>; }
function StaffTab({ setMessage }: any) { return <div className="text-white text-center py-12">Xodimlar boshqaruvi - tez orada...</div>; }
function PortfoliosTab() { return <div className="text-white text-center py-12">Portfoliolar - tez orada...</div>; }
function CategoriesTab({ setMessage }: any) { return <div className="text-white text-center py-12">Kategoriyalar - tez orada...</div>; }
function WebhooksTab({ setMessage }: any) { return <div className="text-white text-center py-12">Webhooks - tez orada...</div>; }
function AIAnalyticsTab() { return <div className="text-white text-center py-12">AI Tahlil - tez orada...</div>; }
function AnnouncementsTab({ setMessage }: any) { return <div className="text-white text-center py-12">E'lonlar - tez orada...</div>; }
function NotificationsTab({ setMessage }: any) { return <div className="text-white text-center py-12">Bildirishnomalar - tez orada...</div>; }
function SettingsTab({ setMessage }: any) { return <div className="text-white text-center py-12">Sozlamalar - tez orada...</div>; }
function SystemTab() { return <div className="text-white text-center py-12">Tizim ma'lumotlari - tez orada...</div>; }
