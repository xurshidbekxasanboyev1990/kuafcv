'use client';

import { getFileUrl } from '@/lib/config';
import {
  AlertCircle,
  BarChart3,
  Bell,
  Building,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Download,
  Edit,
  Edit2,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Key,
  Link,
  Lock,
  Megaphone,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Users,
  Webhook,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TabType = 'dashboard' | 'students' | 'staff' | 'portfolios' | 'categories' | 'webhooks' | 'ai' | 'announcements' | 'notifications' | 'settings' | 'system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function SuperAdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('xk_super_token_9m2v7p');
    const jwtToken = localStorage.getItem('super_admin_token');
    if (token === 'xk_super_authenticated_9m2v7p' && jwtToken) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // First check super admin credentials
    if (email !== 'xurshidbekxasanboyev@kuafcv.uz' || password !== 'otamonam9900') {
      setLoginError('Email yoki parol noto\'g\'ri');
      return;
    }

    try {
      // Login to backend to get real JWT token
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store JWT token for API calls
        localStorage.setItem('super_admin_token', data.token);
        sessionStorage.setItem('xk_super_token_9m2v7p', 'xk_super_authenticated_9m2v7p');
        setIsAuthenticated(true);
      } else {
        const errorData = await response.json();
        setLoginError(errorData.message || 'Kirishda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Server bilan bog\'lanib bo\'lmadi');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('xk_super_token_9m2v7p');
    localStorage.removeItem('super_admin_token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-300 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 w-full max-w-md border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-purple-500/20 rounded-2xl mb-4">
              <Shield className="text-purple-300" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Super Admin</h1>
            <p className="text-purple-200">Maxfiy boshqaruv paneli</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="super@kuafcv.uz"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Parol</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg shadow-purple-900/50 transition-all"
            >
              Kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { id: 'students', label: 'Talabalar', icon: <GraduationCap size={20} /> },
    { id: 'staff', label: 'Xodimlar', icon: <Users size={20} /> },
    { id: 'portfolios', label: 'Portfoliolar', icon: <FileText size={20} /> },
    { id: 'categories', label: 'Kategoriyalar', icon: <Palette size={20} /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Webhook size={20} /> },
    { id: 'ai', label: 'AI Analytics', icon: <Sparkles size={20} /> },
    { id: 'announcements', label: "E'lonlar", icon: <Megaphone size={20} /> },
    { id: 'notifications', label: 'Bildirishnomalar', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Sozlamalar', icon: <Settings size={20} /> },
    { id: 'system', label: 'Tizim', icon: <Database size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="text-purple-300" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-white">Super Admin Panel</h1>
                <p className="text-purple-200 text-sm">Maxfiy tizim boshqaruvi</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg border border-red-400/30 transition-colors"
            >
              Chiqish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 border border-white/20 hover:bg-white/20'
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
              ? 'bg-green-500/20 border border-green-400/30 text-green-200'
              : 'bg-red-500/20 border border-red-400/30 text-red-200'
              }`}
          >
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'students' && <StudentsTab setMessage={setMessage} />}
          {activeTab === 'staff' && <StaffTab setMessage={setMessage} />}
          {activeTab === 'portfolios' && <PortfoliosTab />}
          {activeTab === 'categories' && <CategoriesTab setMessage={setMessage} />}
          {activeTab === 'webhooks' && <WebhooksTab setMessage={setMessage} />}
          {activeTab === 'ai' && <AIAnalyticsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab setMessage={setMessage} />}
          {activeTab === 'notifications' && <NotificationsTab setMessage={setMessage} />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'system' && <SystemTab />}
        </div>
      </div>
    </div>
  );
}

// ==================== DASHBOARD TAB ====================
function DashboardTab() {
  const [stats, setStats] = useState<any>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);
  const [topPortfolios, setTopPortfolios] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    const token = localStorage.getItem('super_admin_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statsRes, analyticsRes, topRes, activityRes, categoryRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, { headers }),
        fetch(`${API_URL}/admin/analytics/overview`, { headers }),
        fetch(`${API_URL}/admin/analytics/top-portfolios?sort=views`, { headers }),
        fetch(`${API_URL}/admin/analytics/recent-activity?limit=10`, { headers }),
        fetch(`${API_URL}/admin/analytics/categories`, { headers }),
      ]);

      const [statsData, analyticsData, topData, activityData, categoryData] = await Promise.all([
        statsRes.json(),
        analyticsRes.ok ? analyticsRes.json() : null,
        topRes.ok ? topRes.json() : { portfolios: [] },
        activityRes.ok ? activityRes.json() : { activities: [] },
        categoryRes.ok ? categoryRes.json() : { categories: [] },
      ]);

      setStats(statsData);
      setAnalyticsOverview(analyticsData);
      setTopPortfolios(topData.portfolios || []);
      setRecentActivity(activityData.activities || []);
      setCategoryStats(categoryData.categories || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  const facultyStats = stats?.students_by_faculty
    ? Object.entries(stats.students_by_faculty).map(([faculty, count]) => ({ faculty, count }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Real-time Dashboard</h2>
          {lastUpdated && (
            <span className="text-sm text-purple-300">
              Oxirgi yangilanish: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jami Talabalar"
          value={stats?.total_students || 0}
          icon={<GraduationCap size={24} />}
          color="blue"
        />
        <StatCard
          title="Jami Portfolio"
          value={stats?.total_portfolios || 0}
          icon={<FileText size={24} />}
          color="green"
        />
        <StatCard
          title="Kutilayotgan"
          value={stats?.pending_portfolios || 0}
          icon={<Clock size={24} />}
          color="orange"
        />
        <StatCard
          title="Tasdiqlangan"
          value={stats?.approved_portfolios || 0}
          icon={<CheckCircle size={24} />}
          color="emerald"
        />
      </div>

      {/* Engagement Stats */}
      {analyticsOverview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Jami ko'rishlar</p>
                <p className="text-2xl font-bold">{(analyticsOverview.total_views || 0).toLocaleString()}</p>
              </div>
              <Eye size={24} className="text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Jami baholar</p>
                <p className="text-2xl font-bold">{(analyticsOverview.total_ratings || 0).toLocaleString()}</p>
              </div>
              <Star size={24} className="text-yellow-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Jami izohlar</p>
                <p className="text-2xl font-bold">{(analyticsOverview.total_comments || 0).toLocaleString()}</p>
              </div>
              <FileText size={24} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">Jami bookmark</p>
                <p className="text-2xl font-bold">{(analyticsOverview.total_bookmarks || 0).toLocaleString()}</p>
              </div>
              <Link size={24} className="text-pink-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Online</p>
                <p className="text-2xl font-bold">{analyticsOverview.online_users || 0}</p>
              </div>
              <Users size={24} className="text-green-200" />
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Portfolios */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star size={20} className="text-yellow-400" />
            Eng mashhur portfoliolar
          </h3>
          {topPortfolios.length > 0 ? (
            <div className="space-y-3">
              {topPortfolios.slice(0, 5).map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-purple-400'
                    }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{p.title}</p>
                    <p className="text-sm text-purple-300">{p.owner_name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-purple-200">
                    <span className="flex items-center gap-1">
                      <Eye size={14} /> {p.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400" /> {p.rating_avg?.toFixed(1) || '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-300 text-center py-4">Ma'lumot topilmadi</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-400" />
            So'nggi faoliyatlar
          </h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((a: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${a.type === 'view' ? 'bg-purple-500/20 text-purple-300' :
                    a.type === 'rating' ? 'bg-yellow-500/20 text-yellow-300' :
                      a.type === 'comment' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-pink-500/20 text-pink-300'
                    }`}>
                    {a.type === 'view' ? <Eye size={16} /> :
                      a.type === 'rating' ? <Star size={16} /> :
                        a.type === 'comment' ? <FileText size={16} /> :
                          <Link size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{a.description || a.user_name}</p>
                    <p className="text-xs text-purple-300">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-300 text-center py-4">Faoliyat yo'q</p>
          )}
        </div>
      </div>

      {/* Category Stats */}
      {categoryStats.length > 0 && (
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Kategoriyalar bo'yicha
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryStats.map((cat: any, idx: number) => {
              const maxCount = Math.max(...categoryStats.map((c: any) => c.count));
              const percentage = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
              return (
                <div key={idx} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-200 truncate">{cat.category}</span>
                    <span className="text-sm font-bold text-white">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[idx % colors.length]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Faculty Stats */}
      {facultyStats.length > 0 && (
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building size={20} />
            Fakultetlar bo'yicha
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facultyStats.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10">
                <span className="text-purple-200 font-medium truncate">{f.faculty || "Noma'lum"}</span>
                <span className="text-white font-bold bg-purple-600 px-3 py-1 rounded-full">
                  {(f.count as number).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-400/30">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-400" />
          Tizim holati
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-200">Backend: Ishlayapti</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-200">Database: Bog'langan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-200">WebSocket: Faol</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    green: 'bg-green-500/20 text-green-300 border-green-400/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  };

  return (
    <div className={`rounded-xl p-6 border ${colors[color]} flex items-center justify-between`}>
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      </div>
      <div className="opacity-50">{icon}</div>
    </div>
  );
}

// ==================== STUDENTS TAB ====================
interface User {
  id: string;
  full_name: string;
  email: string;
  student_id?: string;
  student_data?: {
    faculty?: string;
    specialty?: string;
    course?: number;
    group?: string;
  };
}

interface FilterOptions {
  faculties?: string[];
  specialties?: string[];
  courses?: number[];
  groups?: string[];
}

function StudentsTab({ setMessage }: { setMessage: (m: any) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [filterValues, setFilterValues] = useState({ faculty: '', specialty: '', course: '', group: '' });
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { role: 'STUDENT', page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (filterValues.faculty) params.faculty = filterValues.faculty;
      if (filterValues.specialty) params.specialty = filterValues.specialty;
      if (filterValues.course) params.course = filterValues.course;
      if (filterValues.group) params.group = filterValues.group;

      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/admin/users?${queryString}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      const data = await response.json();
      setUsers(data.students || []);
      setFilters(data.filters || null);
      setTotal(data.total || 0);
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, filterValues, page]);

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch(`${API_URL}/admin/students/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);
      fetchStudents();
    } catch (err) {
      setImportResult({ error: 'Import xatoligi' });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu talabani o'chirishga ishonchingiz komilmi?")) return;
    try {
      await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      setMessage({ type: 'success', text: "Talaba o'chirildi" });
      fetchStudents();
    } catch (err) {
      setMessage({ type: 'error', text: "O'chirishda xatolik" });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedStudent.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Parol o\'zgartirildi' });
        setShowPasswordModal(false);
        setSelectedStudent(null);
        setNewPassword('');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Xatolik' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Parolni o\'zgartirishda xatolik' });
    }
  };

  const openPasswordModal = (student: User) => {
    setSelectedStudent(student);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-4 items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={16} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 w-full"
            />
          </div>
          <button
            onClick={() => fetchStudents()}
            className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20"
          >
            <RefreshCw size={18} className="text-purple-300" />
          </button>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Upload size={18} />
          Excel Import
        </button>
      </div>

      {/* Filters */}
      {filters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filterValues.faculty}
            onChange={(e) => setFilterValues({ ...filterValues, faculty: e.target.value })}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="">Barcha fakultetlar</option>
            {filters.faculties?.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            value={filterValues.course}
            onChange={(e) => setFilterValues({ ...filterValues, course: e.target.value })}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="">Barcha kurslar</option>
            {filters.courses?.map((c) => (
              <option key={c} value={String(c)}>{c}-kurs</option>
            ))}
          </select>
          <select
            value={filterValues.group}
            onChange={(e) => setFilterValues({ ...filterValues, group: e.target.value })}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            <option value="">Barcha guruhlar</option>
            {filters.groups?.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      <div className="text-purple-300">
        Jami: <strong>{total.toLocaleString()}</strong> ta talaba
      </div>

      {/* Table */}
      <div className="bg-white/10 rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-purple-200 font-medium">Talaba</th>
                <th className="px-4 py-3 text-left text-purple-200 font-medium">ID</th>
                <th className="px-4 py-3 text-left text-purple-200 font-medium">Fakultet</th>
                <th className="px-4 py-3 text-left text-purple-200 font-medium">Guruh</th>
                <th className="px-4 py-3 text-left text-purple-200 font-medium">Kurs</th>
                <th className="px-4 py-3 text-right text-purple-200 font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-purple-300">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-purple-300">
                    Talaba topilmadi
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {u.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.full_name}</p>
                          <p className="text-purple-300 text-sm">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-purple-200">{u.student_id || '-'}</td>
                    <td className="px-4 py-3 text-purple-200">{u.student_data?.faculty || '-'}</td>
                    <td className="px-4 py-3 text-purple-200">{u.student_data?.group || '-'}</td>
                    <td className="px-4 py-3 text-purple-200">{u.student_data?.course || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openPasswordModal(u)}
                          className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg"
                          title="Parolni o'zgartirish"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                          title="O'chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <div className="text-purple-300 text-sm">
              Sahifa {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50"
              >
                <ChevronLeft size={18} className="text-purple-300" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50"
              >
                <ChevronRight size={18} className="text-purple-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Talabalarni Import</h2>
              <button onClick={() => setShowImport(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} className="text-purple-300" />
              </button>
            </div>

            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${importFile ? 'border-green-400 bg-green-500/10' : 'border-purple-400/30 hover:border-purple-400'
                  }`}
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {importFile ? (
                  <div>
                    <CheckCircle className="mx-auto text-green-400 mb-2" size={28} />
                    <p className="text-green-300 font-medium">{importFile.name}</p>
                    <p className="text-green-400 text-sm">{(importFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-purple-400 mb-2" size={28} />
                    <p className="text-purple-200">Excel fayl tanlang</p>
                    <p className="text-purple-400 text-sm mt-1">.xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>

              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.error ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                  {importResult.error ? (
                    <p>{importResult.error}</p>
                  ) : (
                    <div>
                      <p><strong>{importResult.imported}</strong> ta yangi qo'shildi</p>
                      <p><strong>{importResult.updated}</strong> ta yangilandi</p>
                      {importResult.skipped > 0 && <p><strong>{importResult.skipped}</strong> ta o'tkazib yuborildi</p>}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-2 border border-purple-400/30 text-purple-200 rounded-lg hover:bg-white/10"
                >
                  Yopish
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                >
                  {importing ? 'Import...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Parolni o'zgartirish</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} className="text-purple-300" />
              </button>
            </div>

            <p className="text-purple-300 mb-4">
              <strong>{selectedStudent.full_name}</strong> uchun yangi parol
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Yangi parol</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Kamida 6 ta belgi"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 border border-purple-400/30 text-purple-200 rounded-lg hover:bg-white/10"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  O'zgartirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STAFF TAB ====================
function StaffTab({ setMessage }: { setMessage: (m: any) => void }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'REGISTRAR',
  });
  const [editData, setEditData] = useState({
    full_name: '',
    email: '',
    role: '',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users?role=STAFF`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      const data = await response.json();
      setStaff(data.students || data.users || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Foydalanuvchi yaratildi' });
        setShowModal(false);
        setFormData({ full_name: '', email: '', password: '', role: 'REGISTRAR' });
        fetchStaff();
      } else {
        setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu foydalanuvchini o'chirishga ishonchingiz komilmi?")) return;
    try {
      await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      setMessage({ type: 'success', text: "Foydalanuvchi o'chirildi" });
      fetchStaff();
    } catch (err) {
      setMessage({ type: 'error', text: "O'chirishda xatolik" });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Parol o\'zgartirildi' });
        setShowPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Xatolik' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Parolni o\'zgartirishda xatolik' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Foydalanuvchi tahrirlandi' });
        setShowEditModal(false);
        setSelectedUser(null);
        fetchStaff();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Xatolik' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Tahrirlashda xatolik' });
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-red-500/20 text-red-300 border-red-400/30',
      REGISTRAR: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      EMPLOYER: 'bg-green-500/20 text-green-300 border-green-400/30',
    };
    return styles[role as keyof typeof styles] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Xodimlar va Adminlar</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} />
          Yangi foydalanuvchi
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-purple-300">Yuklanmoqda...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((user) => (
            <div key={user.id} className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.full_name}</p>
                    <p className="text-purple-300 text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                    title="Tahrirlash"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => openPasswordModal(user)}
                    className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg"
                    title="Parolni o'zgartirish"
                  >
                    <Key size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                    title="O'chirish"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm border ${getRoleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Yangi foydalanuvchi</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} className="text-purple-300" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">To'liq ism</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Parol</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="REGISTRAR">Registrar</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-purple-400/30 text-purple-200 rounded-lg hover:bg-white/10"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Foydalanuvchini tahrirlash</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} className="text-purple-300" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">To'liq ism</label>
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Rol</label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="REGISTRAR">Registrar</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 border border-purple-400/30 text-purple-200 rounded-lg hover:bg-white/10"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Parolni o'zgartirish</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} className="text-purple-300" />
              </button>
            </div>

            <p className="text-purple-300 mb-4">
              <strong>{selectedUser.full_name}</strong> uchun yangi parol
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Yangi parol</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="Kamida 6 ta belgi"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 border border-purple-400/30 text-purple-200 rounded-lg hover:bg-white/10"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  O'zgartirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PORTFOLIOS TAB ====================
function PortfoliosTab() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('PENDING');
  const [total, setTotal] = useState(0);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/registrar/portfolios?status=${status}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      const data = await res.json();
      setPortfolios(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [status]);

  const handleApprove = async (id: string) => {
    try {
      await fetch(`${API_URL}/registrar/approve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      fetchPortfolios();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rad etish sababi:');
    if (reason === null) return;
    try {
      await fetch(`${API_URL}/registrar/reject/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      fetchPortfolios();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg transition-all ${status === s
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-purple-200 border border-white/20 hover:bg-white/20'
              }`}
          >
            {s === 'PENDING' && 'Kutilmoqda'}
            {s === 'APPROVED' && 'Tasdiqlangan'}
            {s === 'REJECTED' && 'Rad etilgan'}
          </button>
        ))}
      </div>

      <div className="text-purple-300">
        Jami: <strong>{total}</strong> ta portfolio
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-purple-300">Yuklanmoqda...</div>
        ) : portfolios.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-purple-300">Portfolio topilmadi</div>
        ) : (
          portfolios.map((p) => (
            <div key={p.id} className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{p.title}</h4>
                  <p className="text-purple-300 text-sm">{p.type}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${p.approval_status === 'APPROVED'
                    ? 'bg-green-500/20 text-green-300'
                    : p.approval_status === 'REJECTED'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-orange-500/20 text-orange-300'
                    }`}
                >
                  {p.approval_status}
                </span>
              </div>
              <p className="text-purple-200 text-sm mb-4">
                <GraduationCap size={14} className="inline mr-1" />
                {p.owner?.full_name || "Noma'lum"}
              </p>
              {p.description && <p className="text-purple-300 text-sm mb-4 line-clamp-2">{p.description}</p>}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    setSelectedPortfolio(p);
                    setShowFilesModal(true);
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Eye size={14} />
                  Ko'rish
                </button>
              </div>
              {p.approval_status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={14} />
                    Tasdiqlash
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <X size={14} />
                    Rad etish
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Files Modal */}
      {showFilesModal && selectedPortfolio && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowFilesModal(false)}>
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedPortfolio.title}</h2>
                <p className="text-sm text-purple-300">{selectedPortfolio.type}</p>
              </div>
              <button onClick={() => setShowFilesModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} className="text-purple-300" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {selectedPortfolio.description && (
                <p className="text-purple-200 mb-6">{selectedPortfolio.description}</p>
              )}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg mb-3 text-white">
                  Fayllar ({selectedPortfolio.files?.length || (selectedPortfolio.file_url ? 1 : 0)})
                </h3>
                {selectedPortfolio.files && selectedPortfolio.files.length > 0 ? (
                  selectedPortfolio.files.map((file: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-lg flex items-center justify-between hover:bg-white/10">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                          <FileText size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{file.name || file.file_name}</p>
                          <p className="text-sm text-purple-300">
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={getFileUrl(file.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Eye size={16} />
                          Ochish
                        </a>
                        <a
                          href={getFileUrl(file.url)}
                          download
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <Download size={16} />
                          Yuklash
                        </a>
                      </div>
                    </div>
                  ))
                ) : selectedPortfolio.file_url ? (
                  <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between hover:bg-white/10">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <FileText size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{selectedPortfolio.file_name}</p>
                        <p className="text-sm text-purple-300">
                          {selectedPortfolio.size_bytes ? `${(selectedPortfolio.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={getFileUrl(selectedPortfolio.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Ochish
                      </a>
                      <a
                        href={getFileUrl(selectedPortfolio.file_url)}
                        download
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Download size={16} />
                        Yuklash
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-purple-300 py-8">Fayl topilmadi</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CATEGORIES TAB ====================
function CategoriesTab({ setMessage }: { setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Kategoriyalarni yuklashda xatolik' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (categoryValue: string) => {
    if (!confirm(`${categoryValue} kategoriyasini o'chirishni xohlaysizmi?`)) return;

    try {
      const response = await fetch(`${API_URL}/admin/categories/${categoryValue}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Xatolik');
      }

      setMessage({ type: 'success', text: "Kategoriya o'chirildi" });
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Kategoriyani o'chirishda xatolik" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-300 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Palette className="text-purple-300" size={24} />
              <h2 className="text-2xl font-bold text-white">Portfolio Kategoriyalari</h2>
            </div>
            <p className="text-purple-300 flex items-center gap-2">
              <Database size={16} />
              Jami: <strong>{categories.length}</strong> ta kategoriya
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg"
          >
            <Plus size={20} />
            Yangi kategoriya
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.value}
            className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
          >
            {category.is_active && (
              <div className="mb-3">
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs font-medium w-fit">
                  <CheckCircle size={12} />
                  Aktiv
                </span>
              </div>
            )}

            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600/30 rounded-2xl flex items-center justify-center text-4xl border-2 border-purple-400/30">
                {category.icon || 'рџ“Ѓ'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white mb-1">{category.label}</h3>
                <p className="text-xs font-mono text-purple-300 bg-purple-900/30 px-2 py-1 rounded inline-block">
                  {category.value}
                </p>
                {category.slug && (
                  <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                    <Link size={12} />
                    /portfolio/{category.slug}
                  </p>
                )}
              </div>
            </div>

            {category.description && (
              <p className="text-sm text-purple-200 mb-4 line-clamp-2">{category.description}</p>
            )}

            {category.display_order !== undefined && (
              <div className="flex items-center gap-2 mb-4 text-xs text-purple-300">
                <Star size={14} className="text-yellow-400" />
                Tartib: <strong>#{category.display_order}</strong>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setEditingCategory(category);
                  setShowModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-300 rounded-xl hover:bg-blue-600/30 border border-blue-400/30"
              >
                <Edit size={16} />
                Tahrirlash
              </button>
              <button
                onClick={() => handleDelete(category.value)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 text-red-300 rounded-xl hover:bg-red-600/30 border border-red-400/30"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16 bg-white/5 rounded-2xl border-2 border-dashed border-purple-400/30">
          <Palette className="text-purple-400 mx-auto mb-4" size={80} />
          <h3 className="text-2xl font-bold text-white mb-2">Kategoriyalar yo'q</h3>
          <p className="text-purple-300 mb-6">Birinchi kategoriyangizni yarating</p>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            <Plus size={20} />
            Kategoriya qo'shish
          </button>
        </div>
      )}

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowModal(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingCategory(null);
            fetchCategories();
            setMessage({
              type: 'success',
              text: editingCategory ? 'Kategoriya yangilandi' : "Kategoriya qo'shildi",
            });
          }}
        />
      )}
    </div>
  );
}

// Category Modal
function CategoryModal({ category, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    value: category?.value || '',
    label: category?.label || '',
    icon: category?.icon || 'рџ“Ѓ',
    description: category?.description || '',
    slug: category?.slug || '',
    display_order: category?.display_order || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.value.trim() || !formData.label.trim() || !formData.slug.trim()) {
      setError('Kod, Nom va Slug majburiy');
      return;
    }

    setLoading(true);
    try {
      const url = category
        ? `/api/admin/categories/${category.value}`
        : '/api/admin/categories';
      const method = category ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Xatolik');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Kategoriyani saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette size={24} />
              <div>
                <h2 className="text-2xl font-bold">
                  {category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
                </h2>
                <p className="text-purple-100 text-sm mt-1">Portfolio kategoriyasini sozlang</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
              <X size={24} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-300" size={20} />
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-2">
                <Database size={16} />
                Kod (VALUE) *
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value.toUpperCase() })}
                placeholder="RESEARCH"
                disabled={!!category}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-mono uppercase disabled:opacity-50"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-2">
                <Palette size={16} />
                Nomi *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Tadqiqotlar"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-2">
                <Star size={16} />
                Icon (Emoji)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="рџ”¬"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-2xl text-center"
                maxLength={4}
              />
            </div>
            <div className="w-16 h-16 bg-purple-600/30 rounded-xl border-2 border-purple-400/30 flex items-center justify-center text-3xl mt-7">
              {formData.icon || 'рџ“Ѓ'}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-2">
              <Link size={16} />
              URL Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
              }
              placeholder="research"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-mono lowercase"
            />
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg mt-2">
              <Globe size={14} className="text-blue-400" />
              <p className="text-xs text-blue-300 font-mono">
                /portfolio/<strong>{formData.slug || 'slug'}</strong>
              </p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-2">
              <FileText size={16} />
              Tavsif
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kategoriya haqida..."
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-2">
              <Star size={16} />
              Tartib raqami
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
            />
          </div>

          <div className="flex gap-4 pt-6 border-t-2 border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-purple-400/30 text-purple-200 rounded-xl hover:bg-white/10"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {category ? 'Saqlash' : "Qo'shish"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== WEBHOOKS TAB ====================
function WebhooksTab({ setMessage }: { setMessage: (m: any) => void }) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    event: 'portfolio.created',
    secret: '',
  });

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/webhooks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'Webhooks yuklashda xatolik' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Webhook yaratildi' });
        setShowModal(false);
        setFormData({ url: '', event: 'portfolio.created', secret: '' });
        fetchWebhooks();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik' });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await fetch(`${API_URL}/admin/webhooks/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      fetchWebhooks();
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Webhook o\'chirilsinmi?')) return;
    try {
      await fetch(`${API_URL}/admin/webhooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      setMessage({ type: 'success', text: 'Webhook o\'chirildi' });
      fetchWebhooks();
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Webhook size={24} />
            Webhooks
          </h2>
          <p className="text-purple-300 text-sm">Tashqi xizmatlarga hodisalarni yuborish</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus size={18} />
          Yangi webhook
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-purple-300">Yuklanmoqda...</div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border-2 border-dashed border-purple-400/30">
          <Webhook className="text-purple-400 mx-auto mb-4" size={64} />
          <p className="text-purple-300">Webhooklar yo'q</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-sm font-mono text-purple-300 bg-purple-900/30 px-3 py-1 rounded">
                      {webhook.event}
                    </code>
                    <span
                      className={`px-2 py-1 rounded text-xs ${webhook.is_active
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-gray-500/20 text-gray-400'
                        }`}
                    >
                      {webhook.is_active ? 'Aktiv' : 'O\'chirilgan'}
                    </span>
                  </div>
                  <p className="text-white font-mono text-sm mb-2">{webhook.url}</p>
                  <p className="text-purple-300 text-xs">
                    Yaratilgan: {new Date(webhook.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(webhook.id)}
                    className={`p-2 rounded-lg ${webhook.is_active
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                  >
                    {webhook.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Yangi Webhook</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} className="text-purple-300" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono"
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Event</label>
                <select
                  value={formData.event}
                  onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="portfolio.created">Portfolio yaratildi</option>
                  <option value="portfolio.approved">Portfolio tasdiqlandi</option>
                  <option value="portfolio.rejected">Portfolio rad etildi</option>
                  <option value="user.registered">Foydalanuvchi ro'yxatdan o'tdi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Secret (ixtiyoriy)</label>
                <input
                  type="text"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono"
                  placeholder="webhook_secret_key"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-purple-400/30 text-purple-200 rounded-lg hover:bg-white/10"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== AI ANALYTICS TAB ====================
function AIAnalyticsTab() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/ai/analytics`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
        });
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="text-purple-300" size={28} />
        <div>
          <h2 className="text-xl font-bold text-white">AI Analytics</h2>
          <p className="text-purple-300 text-sm">Sun'iy intellekt tahlillari</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl p-6 border border-purple-400/30">
          <p className="text-purple-200 text-sm mb-2">Jami AI so'rovlar</p>
          <p className="text-3xl font-bold text-white">{analytics?.total_requests || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30">
          <p className="text-blue-200 text-sm mb-2">Portfolio tahliflari</p>
          <p className="text-3xl font-bold text-white">{analytics?.portfolio_analyses || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-400/30">
          <p className="text-green-200 text-sm mb-2">Muvaffaqiyat darajasi</p>
          <p className="text-3xl font-bold text-white">{analytics?.success_rate || 0}%</p>
        </div>
      </div>

      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-4">So'nggi AI aktivligi</h3>
        <div className="space-y-3">
          {analytics?.recent_activities?.map((activity: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Sparkles size={16} className="text-purple-400" />
              <div className="flex-1">
                <p className="text-white text-sm">{activity.description}</p>
                <p className="text-purple-300 text-xs">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )) || <p className="text-purple-300 text-center py-4">Aktivlik yo'q</p>}
        </div>
      </div>
    </div>
  );
}

// ==================== ANNOUNCEMENTS TAB ====================
interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: number;
  target_roles: string[];
  is_active: boolean;
  is_marquee: boolean;
  link_url?: string;
  link_text?: string;
  created_at: string;
}

function AnnouncementsTab({ setMessage }: { setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState('all');

  const types = [
    { value: 'news', label: 'Yangilik', icon: 'рџ“°', color: 'bg-blue-500/20 text-blue-300' },
    { value: 'announcement', label: "E'lon", icon: 'рџ“ў', color: 'bg-green-500/20 text-green-300' },
    { value: 'portfolio_highlight', label: 'Portfolio', icon: 'рџЏ†', color: 'bg-yellow-500/20 text-yellow-300' },
    { value: 'university_news', label: 'Universitet', icon: 'рџЋ“', color: 'bg-purple-500/20 text-purple-300' },
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, [filter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/announcements' : `/api/announcements?type=${filter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setMessage({ type: 'error', text: "E'lonlarni yuklashda xatolik" });
    }
    setLoading(false);
  };

  const toggleAnnouncement = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/announcements/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      if (res.ok) {
        fetchAnnouncements();
        setMessage({ type: 'success', text: "E'lon holati o'zgartirildi" });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
    }
  };

  const deleteAnnouncement = async (id: number) => {
    if (!confirm("E'lonni o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`${API_URL}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      if (res.ok) {
        fetchAnnouncements();
        setMessage({ type: 'success', text: "E'lon o'chirildi" });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "E'lonni o'chirishda xatolik" });
    }
  };

  const getTypeInfo = (type: string) => {
    return types.find((t) => t.value === type) || types[0];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Megaphone className="text-purple-300" />
              E'lonlar va Yangiliklar
            </h2>
            <p className="text-purple-300 text-sm mt-1">Banner'da aylanuvchi e'lonlarni boshqaring</p>
          </div>
          <button
            onClick={() => {
              setEditingAnnouncement(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus size={20} />
            Yangi e'lon
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white/5 text-purple-200 hover:bg-white/10'
              }`}
          >
            Barchasi
          </button>
          {types.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`px-4 py-2 rounded-lg text-sm ${filter === type.value ? 'bg-purple-600 text-white' : 'bg-white/5 text-purple-200 hover:bg-white/10'
                }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white/10 rounded-xl p-12 text-center border border-white/20">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white/10 rounded-xl p-12 text-center border border-white/20">
          <Megaphone className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <p className="text-purple-200">Hali e'lonlar yo'q</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => {
            const typeInfo = getTypeInfo(announcement.type);
            return (
              <div
                key={announcement.id}
                className={`bg-white/10 rounded-xl p-6 border-l-4 ${announcement.is_active ? 'border-green-400' : 'border-gray-500'
                  } border-r border-t border-b border-white/20`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${announcement.is_marquee ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        {announcement.is_marquee ? 'рџ”„ Banner' : 'рџ“„ Oddiy'}
                      </span>
                      <span className="text-xs text-purple-300">Muhimlik: {announcement.priority}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{announcement.title}</h3>
                    <p className="text-purple-200 text-sm mb-3">{announcement.content}</p>

                    <div className="flex flex-wrap gap-2 text-xs text-purple-300">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {announcement.target_roles.join(', ')}
                      </span>
                      {announcement.link_url && (
                        <a
                          href={announcement.link_url}
                          target="_blank"
                          className="flex items-center gap-1 text-blue-400 hover:underline"
                        >
                          <Link size={14} />
                          {announcement.link_text || 'Havola'}
                        </a>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(announcement.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAnnouncement(announcement.id)}
                      className={`p-2 rounded-lg ${announcement.is_active
                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                      title={announcement.is_active ? "O'chirish" : 'Yoqish'}
                    >
                      {announcement.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAnnouncement(announcement);
                        setShowModal(true);
                      }}
                      className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => {
            setShowModal(false);
            setEditingAnnouncement(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingAnnouncement(null);
            fetchAnnouncements();
          }}
          setMessage={setMessage}
        />
      )}
    </div>
  );
}

// Announcement Modal
function AnnouncementModal({ announcement, onClose, onSuccess, setMessage }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'news',
    priority: announcement?.priority || 5,
    target_roles: announcement?.target_roles || ['ALL'],
    is_active: announcement?.is_active ?? true,
    is_marquee: announcement?.is_marquee ?? true,
    link_url: announcement?.link_url || '',
    link_text: announcement?.link_text || '',
  });

  const types = [
    { value: 'news', label: 'Yangilik', icon: 'рџ“°' },
    { value: 'announcement', label: "E'lon", icon: 'рџ“ў' },
    { value: 'portfolio_highlight', label: 'Portfolio', icon: 'рџЏ†' },
    { value: 'university_news', label: 'Universitet', icon: 'рџЋ“' },
  ];

  const roles = [
    { value: 'ALL', label: 'Hammaga' },
    { value: 'STUDENT', label: 'Talabalar' },
    { value: 'EMPLOYER', label: 'Ish beruvchilar' },
    { value: 'REGISTRAR', label: 'Registratorlar' },
    { value: 'ADMIN', label: 'Adminlar' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = announcement ? `/api/announcements/${announcement.id}` : '/api/announcements';
      const method = announcement ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify({
          ...formData,
          link_url: formData.link_url || null,
          link_text: formData.link_text || null,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: announcement ? "E'lon yangilandi" : "E'lon qo'shildi" });
        onSuccess();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Xatolik yuz berdi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
    }
    setLoading(false);
  };

  const toggleRole = (role: string) => {
    if (role === 'ALL') {
      setFormData((prev) => ({ ...prev, target_roles: ['ALL'] }));
    } else {
      const newRoles = formData.target_roles.filter((r: string) => r !== 'ALL');
      if (newRoles.includes(role)) {
        setFormData((prev) => ({ ...prev, target_roles: newRoles.filter((r: string) => r !== role) }));
      } else {
        setFormData((prev) => ({ ...prev, target_roles: [...newRoles, role] }));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-500/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {announcement ? "E'lonni tahrirlash" : "Yangi e'lon qo'shish"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} className="text-purple-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Turi</label>
            <div className="grid grid-cols-2 gap-2">
              {types.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-lg border-2 text-left ${formData.type === type.value
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/20 hover:border-purple-400/50'
                    }`}
                >
                  <span className="text-xl mr-2">{type.icon}</span>
                  <span className="text-sm font-medium text-white">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Sarlavha *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              placeholder="E'lon sarlavhasi..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Matn *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              rows={3}
              placeholder="E'lon matni..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">Havola</label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, link_url: e.target.value }))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">Havola matni</label>
              <input
                type="text"
                value={formData.link_text}
                onChange={(e) => setFormData((prev) => ({ ...prev, link_text: e.target.value }))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                placeholder="Batafsil..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">
              Muhimlik: {formData.priority}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-purple-300">
              <span>Past</span>
              <span>Yuqori</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Kimga ko'rsatilsin</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggleRole(role.value)}
                  className={`px-3 py-1 rounded-full text-sm ${formData.target_roles.includes(role.value)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-purple-200 hover:bg-white/20'
                    }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-purple-200">Faol</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_marquee}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_marquee: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm text-purple-200">Banner'da ko'rsatish</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-purple-400/30 text-purple-200 rounded-lg hover:bg-white/10"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : announcement ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== NOTIFICATIONS TAB ====================
function NotificationsTab({ setMessage }: { setMessage: (m: any) => void }) {
  const [title, setTitle] = useState('');
  const [message_, setMessage_] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message_) return;
    setSending(true);

    try {
      await fetch(`${API_URL}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify({
          title,
          message: message_,
          type: 'INFO',
          target_role: targetRole || null,
        }),
      });
      setMessage({ type: 'success', text: 'Bildirishnoma yuborildi!' });
      setTitle('');
      setMessage_('');
      setTargetRole('');
    } catch (err) {
      setMessage({ type: 'error', text: 'Xatolik yuz berdi' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Bell size={18} />
          Yangi bildirishnoma yuborish
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Maqsad guruh</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="">Barcha foydalanuvchilar</option>
              <option value="STUDENT">Faqat talabalar</option>
              <option value="REGISTRAR">Faqat registrarlar</option>
              <option value="EMPLOYER">Faqat employerlar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Sarlavha</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bildirishnoma sarlavhasi"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Xabar</label>
            <textarea
              value={message_}
              onChange={(e) => setMessage_(e.target.value)}
              rows={4}
              placeholder="Bildirishnoma matni..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !title || !message_}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Bell size={18} />
            <span>{sending ? 'Yuborilmoqda...' : 'Yuborish'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== SETTINGS TAB ====================
function SettingsTab() {
  const [settings, setSettings] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('support');
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = [
    { id: 'support', label: 'Yordam', icon: <Phone size={18} /> },
    { id: 'permissions', label: 'Ruxsatlar', icon: <Lock size={18} /> },
    { id: 'ai', label: 'AI Sozlamalari', icon: <Sparkles size={18} /> },
    { id: 'general', label: 'Umumiy', icon: <Globe size={18} /> },
    { id: 'notifications', label: 'Bildirishnomalar', icon: <Bell size={18} /> },
    { id: 'ui', label: "Ko'rinish", icon: <Palette size={18} /> },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });
      const data = await res.json();
      setSettings(data.settings || []);
      setGrouped(data.grouped || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: any) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const parseValue = (value: any) => {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    } catch {
      return value;
    }
  };

  const getCurrentValue = (setting: any) => {
    if (editedValues.hasOwnProperty(setting.key)) {
      return editedValues[setting.key];
    }
    return parseValue(setting.value);
  };

  const saveSettings = async () => {
    if (Object.keys(editedValues).length === 0) {
      setMessage({ type: 'error', text: "O'zgartirish yo'q" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify({ settings: editedValues }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: `${data.updated.length} ta sozlama saqlandi` });
        setEditedValues({});
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Saqlashda xatolik' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server xatoligi' });
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    if (!confirm("Bu sozlamani o'chirishni xohlaysizmi?")) return;

    try {
      const res = await fetch(`${API_URL}/settings/${key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: "Sozlama o'chirildi" });
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || "O'chirishda xatolik" });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server xatoligi' });
    }
  };

  const renderInput = (setting: any) => {
    const value = getCurrentValue(setting);
    const isEdited = editedValues.hasOwnProperty(setting.key);

    switch (setting.data_type) {
      case 'boolean':
        return (
          <button
            onClick={() => handleValueChange(setting.key, !value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${value
              ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
              } ${isEdited ? 'ring-2 ring-blue-400' : ''}`}
          >
            {value ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span>{value ? 'Yoqilgan' : "O'chirilgan"}</span>
          </button>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(setting.key, parseInt(e.target.value) || 0)}
            className={`px-4 py-2 bg-white/10 border rounded-lg w-32 text-white ${isEdited ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-white/20'
              }`}
          />
        );

      case 'array':
        const arrayVal = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {arrayVal.map((item: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-purple-600/30 rounded text-sm flex items-center gap-1 text-white">
                  {item}
                  <button
                    onClick={() => {
                      const newArr = arrayVal.filter((_: any, i: number) => i !== idx);
                      handleValueChange(setting.key, newArr);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    Г—
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Yangi qiymat (Enter)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleValueChange(setting.key, [...arrayVal, e.currentTarget.value]);
                  e.currentTarget.value = '';
                }
              }}
              className={`px-3 py-1 bg-white/10 border rounded text-sm text-white ${isEdited ? 'border-blue-400' : 'border-white/20'
                }`}
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className={`px-4 py-2 bg-white/10 border rounded-lg w-full max-w-md text-white ${isEdited ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-white/20'
              }`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings size={24} />
          Tizim Sozlamalari
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white/10 text-purple-200 rounded-lg hover:bg-white/20 flex items-center gap-2 border border-white/20"
          >
            <Plus size={18} />
            Yangi sozlama
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || Object.keys(editedValues).length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saqlanmoqda...' : `Saqlash ${Object.keys(editedValues).length > 0 ? `(${Object.keys(editedValues).length})` : ''}`}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            }`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${activeCategory === cat.id
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-purple-200 border border-white/20 hover:bg-white/20'
              }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
            {grouped[cat.id]?.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${activeCategory === cat.id ? 'bg-white/20' : 'bg-purple-600/30'}`}>
                {grouped[cat.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white/10 rounded-xl border border-white/20 divide-y divide-white/10">
        {(grouped[activeCategory] || []).map((setting: any) => (
          <div key={setting.key} className="p-4 hover:bg-white/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white">{setting.label}</h4>
                  {setting.is_public && (
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">Public</span>
                  )}
                  {editedValues.hasOwnProperty(setting.key) && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">O'zgartirilgan</span>
                  )}
                </div>
                {setting.description && <p className="text-sm text-purple-300 mt-1">{setting.description}</p>}
                <p className="text-xs text-gray-500 mt-1">Kalit: {setting.key}</p>
              </div>
              <div className="flex items-center gap-2">
                {renderInput(setting)}
                <button
                  onClick={() => deleteSetting(setting.key)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {(!grouped[activeCategory] || grouped[activeCategory].length === 0) && (
          <div className="p-8 text-center text-purple-300">
            <Database size={32} className="mx-auto mb-2 opacity-50" />
            <p>Bu kategoriyada sozlamalar yo'q</p>
          </div>
        )}
      </div>

      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <h4 className="font-medium text-white mb-4 flex items-center gap-2">
          <Database size={18} />
          Tizim ma'lumotlari
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <p className="text-purple-300">Versiya</p>
            <p className="font-bold text-white">1.0.0</p>
          </div>
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <p className="text-blue-300">Backend</p>
            <p className="font-bold text-white">Go + Gin</p>
          </div>
          <div className="p-3 bg-green-500/20 rounded-lg">
            <p className="text-green-300">Frontend</p>
            <p className="font-bold text-white">Next.js 14</p>
          </div>
          <div className="p-3 bg-pink-500/20 rounded-lg">
            <p className="text-pink-300">Database</p>
            <p className="font-bold text-white">PostgreSQL 16</p>
          </div>
        </div>
      </div>

      {showAddModal && <AddSettingModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchSettings(); }} categories={categories} />}
    </div>
  );
}

// Add Setting Modal
function AddSettingModal({ onClose, onSuccess, categories }: any) {
  const [formData, setFormData] = useState({
    category: 'general',
    key: '',
    value: '',
    label: '',
    description: '',
    data_type: 'text',
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let parsedValue: any = formData.value;
      if (formData.data_type === 'boolean') {
        parsedValue = formData.value === 'true';
      } else if (formData.data_type === 'number') {
        parsedValue = parseInt(formData.value) || 0;
      } else if (formData.data_type === 'array') {
        parsedValue = formData.value.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('super_admin_token')}`,
        },
        body: JSON.stringify({ ...formData, value: parsedValue }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setError('Server xatoligi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full border border-purple-500/30">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Yangi sozlama qo'shish</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X size={20} className="text-purple-300" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">Kategoriya</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1">Tur</label>
              <select
                value={formData.data_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, data_type: e.target.value }))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="text">Matn</option>
                <option value="number">Raqam</option>
                <option value="boolean">Ha/Yo'q</option>
                <option value="array">Ro'yxat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Kalit (key)</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
              placeholder="max_file_size"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Sarlavha</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Foydalanuvchiga ko'rinadigan nom"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Qiymat</label>
            {formData.data_type === 'boolean' ? (
              <select
                value={formData.value}
                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="true">Ha (Yoqilgan)</option>
                <option value="false">Yo'q (O'chirilgan)</option>
              </select>
            ) : (
              <input
                type={formData.data_type === 'number' ? 'number' : 'text'}
                value={formData.value}
                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                placeholder={formData.data_type === 'array' ? 'qiymat1, qiymat2' : 'Qiymat'}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Tavsif (ixtiyoriy)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Bu sozlama nima uchun kerak"
              rows={2}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_public: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm text-purple-200">Public (autentifikatsiyasiz ko'rish)</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-purple-400/30 text-purple-200 rounded-lg hover:bg-white/10"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== SYSTEM TAB ====================
function SystemTab() {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/system/info`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('super_admin_token')}` },
        });
        const data = await response.json();
        setSystemInfo(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="text-purple-300" size={28} />
        <div>
          <h2 className="text-xl font-bold text-white">Tizim Ma'lumotlari</h2>
          <p className="text-purple-300 text-sm">Server va infratuzilma holati</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30">
          <p className="text-blue-200 text-sm mb-2">Server versiyasi</p>
          <p className="text-2xl font-bold text-white">{systemInfo?.version || '1.0.0'}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-400/30">
          <p className="text-green-200 text-sm mb-2">Uptime</p>
          <p className="text-2xl font-bold text-white">{systemInfo?.uptime || '24h'}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30">
          <p className="text-purple-200 text-sm mb-2">Memory</p>
          <p className="text-2xl font-bold text-white">{systemInfo?.memory || '512MB'}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-400/30">
          <p className="text-orange-200 text-sm mb-2">CPU</p>
          <p className="text-2xl font-bold text-white">{systemInfo?.cpu || '2 cores'}</p>
        </div>
      </div>

      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-4">Texnologiyalar</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-purple-300 text-sm">Backend</p>
            <p className="text-white font-bold">Go 1.23</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-purple-300 text-sm">Framework</p>
            <p className="text-white font-bold">Gin Web</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-purple-300 text-sm">Frontend</p>
            <p className="text-white font-bold">Next.js 14</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-purple-300 text-sm">Database</p>
            <p className="text-white font-bold">PostgreSQL 16</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-purple-300 text-sm">Cache</p>
            <p className="text-white font-bold">Redis</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-purple-300 text-sm">Auth</p>
            <p className="text-white font-bold">JWT</p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-4">Xizmatlar holati</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-white">Backend API</span>
            <span className="flex items-center gap-2 text-green-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Ishlayapti
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-white">Database</span>
            <span className="flex items-center gap-2 text-green-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Bog'langan
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-white">Redis Cache</span>
            <span className="flex items-center gap-2 text-green-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Faol
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-white">WebSocket</span>
            <span className="flex items-center gap-2 text-green-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Ulanish kutilmoqda
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
