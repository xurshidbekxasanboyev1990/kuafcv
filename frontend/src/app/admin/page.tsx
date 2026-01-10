// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import AIAnalytics from '@/components/AIAnalytics';
import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { admin, CreateUserData, FilterOptions, User } from '@/lib/api';
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
  Edit,
  Eye,
  FileText,
  Globe,
  GraduationCap,
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
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TabType = 'dashboard' | 'students' | 'staff' | 'portfolios' | 'ai-analytics' | 'announcements' | 'notifications' | 'settings' | 'categories';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Statistika', icon: <BarChart3 size={20} /> },
    { id: 'students', label: 'Talabalar', icon: <GraduationCap size={20} /> },
    { id: 'staff', label: 'Xodimlar', icon: <Shield size={20} /> },
    { id: 'portfolios', label: 'Portfoliolar', icon: <FileText size={20} /> },
    { id: 'categories', label: 'Kategoriyalar', icon: <Palette size={20} /> },
    { id: 'ai-analytics', label: 'AI Tahlil', icon: <Brain size={20} /> },
    { id: 'announcements', label: "E'lonlar", icon: <Megaphone size={20} /> },
    { id: 'notifications', label: 'Bildirishnomalar', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Sozlamalar', icon: <Settings size={20} /> },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-red-800 flex items-center gap-3">
          <Shield className="text-red-500" size={28} />
          Super Admin Panel
        </h1>
        <p className="text-red-600 mt-1 text-sm md:text-base">To'liq tizim boshqaruvi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm md:text-base ${activeTab === tab.id
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
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
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
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
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'students' && <StudentsTab setMessage={setMessage} />}
      {activeTab === 'staff' && <StaffTab setMessage={setMessage} />}
      {activeTab === 'portfolios' && <PortfoliosTab />}
      {activeTab === 'categories' && <CategoriesTab setMessage={setMessage} />}
      {activeTab === 'ai-analytics' && <AIAnalytics />}
      {activeTab === 'announcements' && <AnnouncementsTab setMessage={setMessage} />}
      {activeTab === 'notifications' && <NotificationsTab setMessage={setMessage} />}
      {activeTab === 'settings' && <SettingsTab />}
    </MainLayout>
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
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statsRes, analyticsRes, topRes, activityRes, categoryRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/admin/analytics/overview', { headers }),
        fetch('/api/admin/analytics/top-portfolios?sort=views', { headers }),
        fetch('/api/admin/analytics/recent-activity?limit=10', { headers }),
        fetch('/api/admin/analytics/categories', { headers }),
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
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  // Convert map to array for display
  const facultyStats = stats?.students_by_faculty
    ? Object.entries(stats.students_by_faculty).map(([faculty, count]) => ({ faculty, count }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg md:text-xl font-bold text-red-800">Real-time Dashboard</h2>
          {lastUpdated && (
            <span className="text-xs md:text-sm text-red-500">
              Oxirgi yangilanish: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm w-full sm:w-auto justify-center"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
        <StatCard
          title="Jami Talabalar"
          value={stats?.total_students || 0}
          icon={<GraduationCap size={20} className="sm:w-6 sm:h-6" />}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs md:text-sm">Jami ko'rishlar</p>
                <p className="text-xl md:text-2xl font-bold">{(analyticsOverview.total_views || 0).toLocaleString()}</p>
              </div>
              <Eye size={24} className="text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs md:text-sm">Jami baholar</p>
                <p className="text-xl md:text-2xl font-bold">{(analyticsOverview.total_ratings || 0).toLocaleString()}</p>
              </div>
              <Star size={24} className="text-yellow-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs md:text-sm">Jami izohlar</p>
                <p className="text-xl md:text-2xl font-bold">{(analyticsOverview.total_comments || 0).toLocaleString()}</p>
              </div>
              <FileText size={24} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-xs md:text-sm">Jami bookmark</p>
                <p className="text-xl md:text-2xl font-bold">{(analyticsOverview.total_bookmarks || 0).toLocaleString()}</p>
              </div>
              <Link size={24} className="text-pink-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs md:text-sm">Online foydalanuvchilar</p>
                <p className="text-xl md:text-2xl font-bold">{analyticsOverview.online_users || 0}</p>
              </div>
              <Users size={24} className="text-green-200" />
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Portfolios */}
        <div className="bg-white rounded-xl p-4 md:p-6 border border-red-100 shadow-sm">
          <h3 className="text-base md:text-lg font-bold text-red-800 mb-3 md:mb-4 flex items-center gap-2">
            <Star size={20} className="text-yellow-500" />
            Eng mashhur portfoliolar
          </h3>
          {topPortfolios.length > 0 ? (
            <div className="space-y-3">
              {topPortfolios.slice(0, 5).map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-red-400'
                    }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.owner_name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye size={14} /> {p.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" /> {p.rating_avg?.toFixed(1) || '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Ma'lumot topilmadi</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-4 md:p-6 border border-red-100 shadow-sm">
          <h3 className="text-base md:text-lg font-bold text-red-800 mb-3 md:mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            So'nggi faoliyatlar
          </h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((a: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${a.type === 'view' ? 'bg-purple-100 text-purple-600' :
                      a.type === 'rating' ? 'bg-yellow-100 text-yellow-600' :
                        a.type === 'comment' ? 'bg-blue-100 text-blue-600' :
                          'bg-pink-100 text-pink-600'
                    }`}>
                    {a.type === 'view' ? <Eye size={16} /> :
                      a.type === 'rating' ? <Star size={16} /> :
                        a.type === 'comment' ? <FileText size={16} /> :
                          <Link size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{a.description || a.user_name}</p>
                    <p className="text-xs text-gray-500">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Faoliyat yo'q</p>
          )}
        </div>
      </div>

      {/* Category Stats */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-red-100 shadow-sm">
          <h3 className="text-base md:text-lg font-bold text-red-800 mb-3 md:mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Kategoriyalar bo'yicha portfoliolar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {categoryStats.map((cat: any, idx: number) => {
              const maxCount = Math.max(...categoryStats.map((c: any) => c.count));
              const percentage = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
              return (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 truncate">{cat.category}</span>
                    <span className="text-sm font-bold text-gray-900">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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

      {/* Fakultetlar */}
      {facultyStats.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-red-100 shadow-sm">
          <h3 className="text-base md:text-lg font-bold text-red-800 mb-3 md:mb-4 flex items-center gap-2">
            <Building size={20} />
            Fakultetlar bo'yicha talabalar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {facultyStats.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <span className="text-red-700 font-medium truncate">{f.faculty || "Noma'lum"}</span>
                <span className="text-red-800 font-bold bg-white px-3 py-1 rounded-full shadow-sm">
                  {(f.count as number).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health Indicator */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 md:p-6 border border-green-200">
        <h3 className="text-base md:text-lg font-bold text-green-800 mb-3 md:mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-500" />
          Tizim holati
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700">Backend: Ishlayapti</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700">Database: Bog'langan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700">WebSocket: Faol</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className={`rounded-xl p-4 md:p-6 border ${colors[color]} flex items-center justify-between`}>
      <div>
        <p className="text-xs md:text-sm opacity-80">{title}</p>
        <p className="text-2xl md:text-3xl font-bold">{value.toLocaleString()}</p>
      </div>
      <div className="opacity-50">{icon}</div>
    </div>
  );
}

// ==================== STUDENTS TAB ====================
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

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { role: 'STUDENT', page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (filterValues.faculty) params.faculty = filterValues.faculty;
      if (filterValues.specialty) params.specialty = filterValues.specialty;
      if (filterValues.course) params.course = filterValues.course;
      if (filterValues.group) params.group = filterValues.group;

      console.log('Fetching students with params:', params);
      const response = await admin.getUsers(params);
      console.log('API response:', response);
      setUsers(response.students || []);
      setFilters(response.filters || null);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('Fetch error:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Xatolik' });
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
      const result = await admin.importStudents(importFile);
      setImportResult(result);
      fetchStudents();
    } catch (err) {
      setImportResult({ error: err instanceof Error ? err.message : 'Xatolik' });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu talabani o'chirishga ishonchingiz komilmi?")) return;
    try {
      await admin.deleteUser(id);
      setMessage({ type: 'success', text: "Talaba o'chirildi" });
      fetchStudents();
    } catch (err) {
      setMessage({ type: 'error', text: "O'chirishda xatolik" });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={16} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-red-800 w-full sm:w-64 text-sm"
            />
          </div>
          <button
            onClick={() => fetchStudents()}
            className="p-2 border border-red-200 rounded-lg hover:bg-red-50 flex-shrink-0"
            aria-label="Yangilash"
            title="Yangilash"
          >
            <RefreshCw size={18} className="text-red-600" />
          </button>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm justify-center"
        >
          <Upload size={18} />
          <span>Excel Import</span>
        </button>
      </div>

      {/* Filters */}
      {filters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
          <select
            value={filterValues.faculty}
            onChange={(e) => setFilterValues({ ...filterValues, faculty: e.target.value })}
            className="px-2 md:px-3 py-2 border border-red-200 rounded-lg text-red-700 bg-white text-sm"
            aria-label="Fakultet tanlash"
          >
            <option value="">Barcha fakultetlar</option>
            {filters.faculties?.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            value={filterValues.course}
            onChange={(e) => setFilterValues({ ...filterValues, course: e.target.value })}
            className="px-2 md:px-3 py-2 border border-red-200 rounded-lg text-red-700 bg-white text-sm"
            aria-label="Kurs tanlash"
          >
            <option value="">Barcha kurslar</option>
            {filters.courses?.map((c) => (
              <option key={c} value={String(c)}>{c}-kurs</option>
            ))}
          </select>
          <select
            value={filterValues.group}
            onChange={(e) => setFilterValues({ ...filterValues, group: e.target.value })}
            className="px-2 md:px-3 py-2 border border-red-200 rounded-lg text-red-700 bg-white text-sm"
            aria-label="Guruh tanlash"
          >
            <option value="">Barcha guruhlar</option>
            {filters.groups?.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="text-red-600 text-sm md:text-base">
        Jami: <strong>{total.toLocaleString()}</strong> ta talaba
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">Talaba</th>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">ID</th>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">Fakultet</th>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">Guruh</th>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">Kurs</th>
                <th className="px-4 py-3 text-right text-red-700 font-medium text-sm">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-500 text-sm">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-500 text-sm">
                    Talaba topilmadi
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-red-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 font-bold text-sm">
                            {u.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-red-800 font-medium text-sm truncate">{u.full_name}</p>
                          <p className="text-red-400 text-xs truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-red-600 text-sm">{u.student_id || '-'}</td>
                    <td className="px-4 py-3 text-red-600 text-sm">{u.student_data?.faculty || '-'}</td>
                    <td className="px-4 py-3 text-red-600 text-sm">{u.student_data?.group || '-'}</td>
                    <td className="px-4 py-3 text-red-600 text-sm">{u.student_data?.course || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                          aria-label="O'chirish"
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

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-red-100">
          {loading ? (
            <div className="px-4 py-8 text-center text-red-500 text-sm">
              Yuklanmoqda...
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-8 text-center text-red-500 text-sm">
              Talaba topilmadi
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="p-4 hover:bg-red-50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-lg">
                      {u.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-red-800 font-medium text-sm truncate">{u.full_name}</p>
                    <p className="text-red-400 text-xs truncate">{u.email}</p>
                    <p className="text-red-500 text-xs mt-1">ID: {u.student_id || '-'}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg flex-shrink-0"
                    aria-label="O'chirish"
                    title="O'chirish"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-red-400">Fakultet</p>
                    <p className="text-red-700 font-medium truncate">{u.student_data?.faculty || '-'}</p>
                  </div>
                  <div>
                    <p className="text-red-400">Guruh</p>
                    <p className="text-red-700 font-medium">{u.student_data?.group || '-'}</p>
                  </div>
                  <div>
                    <p className="text-red-400">Kurs</p>
                    <p className="text-red-700 font-medium">{u.student_data?.course || '-'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-3 md:px-4 py-3 border-t border-red-100 gap-2">
            <div className="text-red-600 text-xs md:text-sm">
              Sahifa {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 md:p-2 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                aria-label="Oldingi sahifa"
                title="Oldingi sahifa"
              >
                <ChevronLeft size={18} className="text-red-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 md:p-2 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                aria-label="Keyingi sahifa"
                title="Keyingi sahifa"
              >
                <ChevronRight size={18} className="text-red-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-red-800">Talabalarni Import</h2>
              <button onClick={() => setShowImport(false)} className="p-2 hover:bg-red-100 rounded-lg">
                <X size={20} className="text-red-500" />
              </button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center cursor-pointer transition-colors ${importFile ? 'border-green-300 bg-green-50' : 'border-red-200 hover:border-red-400'
                  }`}
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  aria-label="Excel fayl tanlash"
                />
                {importFile ? (
                  <div>
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={28} />
                    <p className="text-green-700 font-medium text-sm truncate">{importFile.name}</p>
                    <p className="text-green-600 text-xs">{(importFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-red-400 mb-2" size={28} />
                    <p className="text-red-600 text-sm">Excel fayl tanlang</p>
                    <p className="text-red-400 text-xs mt-1">.xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>

              {importResult && (
                <div className={`p-3 md:p-4 rounded-lg text-sm ${importResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
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

              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                >
                  Yopish
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                >
                  {importing ? 'Import qilinmoqda...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STAFF TAB ====================
function StaffTab({ setMessage }: { setMessage: (m: any) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'REGISTRAR',
    company_name: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await admin.getUsers({ role: 'STAFF' });
      // Filter staff (ADMIN, REGISTRAR, EMPLOYER)
      const staff = (response.students || []).filter((u: User) =>
        ['ADMIN', 'REGISTRAR', 'EMPLOYER'].includes(u.role)
      );
      setUsers(staff);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      await admin.createUser(createData as CreateUserData);
      setShowCreate(false);
      setCreateData({ email: '', password: '', full_name: '', role: 'REGISTRAR', company_name: '' });
      setMessage({ type: 'success', text: 'Xodim yaratildi' });
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu xodimni o'chirishga ishonchingiz komilmi?")) return;
    try {
      await admin.deleteUser(id);
      setMessage({ type: 'success', text: "Xodim o'chirildi" });
      fetchStaff();
    } catch (err) {
      setMessage({ type: 'error', text: "O'chirishda xatolik" });
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      ADMIN: { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin' },
      REGISTRAR: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Registrar' },
      EMPLOYER: { bg: 'bg-green-100', text: 'text-green-700', label: 'Employer' },
    };
    const badge = badges[role] || { bg: 'bg-gray-100', text: 'text-gray-700', label: role };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-red-800">Xodimlar ({users.length})</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <UserPlus size={20} />
          <span>Yangi xodim</span>
        </button>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-red-500">Yuklanmoqda...</div>
        ) : users.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-red-500">Xodim topilmadi</div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="bg-white rounded-xl p-6 border border-red-100 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-lg">
                      {u.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-red-800 font-semibold">{u.full_name}</p>
                    <p className="text-red-400 text-sm">{u.email}</p>
                  </div>
                </div>
                {getRoleBadge(u.role)}
              </div>
              {u.company_name && (
                <p className="text-red-600 text-sm mb-4 flex items-center gap-2">
                  <Building size={16} />
                  {u.company_name}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(u.id)}
                  className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>O'chirish</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-red-800">Yangi xodim</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-red-100 rounded-lg">
                <X size={20} className="text-red-500" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">Rol</label>
                <select
                  value={createData.role}
                  onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-red-200 rounded-lg text-red-800 bg-white"
                  aria-label="Foydalanuvchi roli"
                >
                  <option value="REGISTRAR">Registrar</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">To'liq ism</label>
                <input
                  type="text"
                  value={createData.full_name}
                  onChange={(e) => setCreateData({ ...createData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-red-200 rounded-lg text-red-800"
                  placeholder="Ism Familiya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">Email</label>
                <input
                  type="email"
                  value={createData.email}
                  onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-red-200 rounded-lg text-red-800"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">Parol</label>
                <input
                  type="password"
                  value={createData.password}
                  onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-red-200 rounded-lg text-red-800"
                  placeholder="Parol kiriting"
                />
              </div>
              {createData.role === 'EMPLOYER' && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Kompaniya nomi</label>
                  <input
                    type="text"
                    value={createData.company_name}
                    onChange={(e) => setCreateData({ ...createData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg text-red-800"
                    placeholder="Kompaniya nomi"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createData.email || !createData.password || !createData.full_name}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
                >
                  {creating ? 'Yaratilmoqda...' : 'Yaratish'}
                </button>
              </div>
            </div>
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
      const res = await fetch(`/api/registrar/portfolios?status=${status}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      console.log('Admin portfolios data:', data);
      console.log('First portfolio files:', data.items?.[0]?.files);
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
      await fetch(`/api/registrar/approve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
      await fetch(`/api/registrar/reject/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      <div className="flex flex-wrap gap-2">
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 md:px-4 py-2 rounded-lg transition-all text-xs md:text-sm ${status === s
                ? 'bg-red-600 text-white'
                : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
              }`}
          >
            {s === 'PENDING' && 'Kutilmoqda'}
            {s === 'APPROVED' && 'Tasdiqlangan'}
            {s === 'REJECTED' && 'Rad etilgan'}
          </button>
        ))}
      </div>

      <div className="text-red-600 text-sm md:text-base">Jami: <strong>{total}</strong> ta portfolio</div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-8 md:py-12 text-red-500 text-sm md:text-base">Yuklanmoqda...</div>
        ) : portfolios.length === 0 ? (
          <div className="col-span-2 text-center py-8 md:py-12 text-red-500 text-sm md:text-base">Portfolio topilmadi</div>
        ) : (
          portfolios.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-4 md:p-6 border border-red-100">
              <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-red-800 text-sm md:text-base truncate">{p.title}</h4>
                  <p className="text-red-500 text-xs md:text-sm">{p.type}</p>
                </div>
                <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap flex-shrink-0 ${p.approval_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    p.approval_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                  }`}>
                  {p.approval_status}
                </span>
              </div>
              <p className="text-red-600 text-xs md:text-sm mb-3 md:mb-4 truncate">
                <GraduationCap size={14} className="inline mr-1" />
                {p.owner?.full_name || 'Noma\'lum'}
              </p>
              {p.description && (
                <p className="text-red-500 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{p.description}</p>
              )}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    setSelectedPortfolio(p);
                    setShowFilesModal(true);
                  }}
                  className="flex-1 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                >
                  <Eye size={14} />
                  <span>Ko'rish</span>
                </button>
              </div>
              {p.approval_status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="flex-1 py-1.5 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                  >
                    <CheckCircle size={14} />
                    <span className="hidden sm:inline">Tasdiqlash</span>
                    <span className="sm:hidden">✓</span>
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    className="flex-1 py-1.5 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                  >
                    <X size={14} />
                    <span className="hidden sm:inline">Rad etish</span>
                    <span className="sm:hidden">✗</span>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedPortfolio.title}</h2>
                <p className="text-sm text-gray-500">{selectedPortfolio.type}</p>
              </div>
              <button onClick={() => setShowFilesModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {selectedPortfolio.description && (
                <p className="text-muted-foreground mb-6">{selectedPortfolio.description}</p>
              )}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg mb-3">Fayllar ({selectedPortfolio.files?.length || (selectedPortfolio.file_url ? 1 : 0)})</h3>
                {selectedPortfolio.files && selectedPortfolio.files.length > 0 ? (
                  selectedPortfolio.files.map((file: any, idx: number) => (
                    <div key={idx} className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors group">
                      <div className="flex items-center gap-4 overflow-hidden flex-1">
                        <div className="h-12 w-12 bg-background rounded-lg flex items-center justify-center border shrink-0">
                          <FileText size={24} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{file.name || file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <a
                          href={getFileUrl(file.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                        >
                          <Eye size={16} />
                          Ochish
                        </a>
                        <a
                          href={getFileUrl(file.url)}
                          download
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                        >
                          <Download size={16} />
                          Yuklash
                        </a>
                      </div>
                    </div>
                  ))
                ) : selectedPortfolio.file_url ? (
                  <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors group">
                    <div className="flex items-center gap-4 overflow-hidden flex-1">
                      <div className="h-12 w-12 bg-background rounded-lg flex items-center justify-center border shrink-0">
                        <FileText size={24} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{selectedPortfolio.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPortfolio.size_bytes ? `${(selectedPortfolio.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <a
                        href={getFileUrl(selectedPortfolio.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Ochish
                      </a>
                      <a
                        href={getFileUrl(selectedPortfolio.file_url)}
                        download
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                      >
                        <Download size={16} />
                        Yuklash
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Fayl topilmadi</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      <div className="bg-white rounded-xl p-4 md:p-6 border border-red-100">
        <h3 className="text-base md:text-lg font-bold text-red-800 mb-4 md:mb-6 flex items-center gap-2">
          <Bell size={18} />
          Yangi bildirishnoma yuborish
        </h3>

        <div className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-red-700 mb-1">Maqsad guruh</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 md:px-4 py-2 border border-red-200 rounded-lg text-red-800 bg-white text-sm"
              aria-label="Maqsad guruh"
            >
              <option value="">Barcha foydalanuvchilar</option>
              <option value="STUDENT">Faqat talabalar</option>
              <option value="REGISTRAR">Faqat registrarlar</option>
              <option value="EMPLOYER">Faqat employerlar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-red-700 mb-1">Sarlavha</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bildirishnoma sarlavhasi"
              className="w-full px-3 md:px-4 py-2 border border-red-200 rounded-lg text-red-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-red-700 mb-1">Xabar</label>
            <textarea
              value={message_}
              onChange={(e) => setMessage_(e.target.value)}
              rows={4}
              placeholder="Bildirishnoma matni..."
              className="w-full px-3 md:px-4 py-2 border border-red-200 rounded-lg text-red-800 text-sm"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !title || !message_}
            className="w-full py-2.5 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 flex items-center justify-center gap-2 text-sm md:text-base"
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
    { id: 'ui', label: 'Ko\'rinish', icon: <Palette size={18} /> },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
    setEditedValues(prev => ({ ...prev, [key]: value }));
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
      setMessage({ type: 'error', text: 'O\'zgartirish yo\'q' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
    if (!confirm('Bu sozlamani o\'chirishni xohlaysizmi?')) return;

    try {
      const res = await fetch(`/api/settings/${key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Sozlama o\'chirildi' });
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'O\'chirishda xatolik' });
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${value
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isEdited ? 'ring-2 ring-blue-500' : ''}`}
          >
            {value ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span>{value ? 'Yoqilgan' : 'O\'chirilgan'}</span>
          </button>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(setting.key, parseInt(e.target.value) || 0)}
            className={`px-4 py-2 border rounded-lg w-32 ${isEdited ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
            aria-label="Raqam kiriting"
          />
        );

      case 'array':
        const arrayVal = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {arrayVal.map((item: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-1">
                  {item}
                  <button
                    onClick={() => {
                      const newArr = arrayVal.filter((_: any, i: number) => i !== idx);
                      handleValueChange(setting.key, newArr);
                    }}
                    className="text-red-500 hover:text-red-700"
                    aria-label="O'chirish"
                    title="O'chirish"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Yangi qiymat qo'shish (Enter)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleValueChange(setting.key, [...arrayVal, e.currentTarget.value]);
                  e.currentTarget.value = '';
                }
              }}
              className={`px-3 py-1 border rounded text-sm ${isEdited ? 'border-blue-500' : 'border-gray-200'
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
            className={`px-4 py-2 border rounded-lg w-full max-w-md ${isEdited ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
            aria-label="Qiymat kiriting"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
          <Settings size={24} />
          Tizim Sozlamalari
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Yangi sozlama
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || Object.keys(editedValues).length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saqlanmoqda...' : `Saqlash ${Object.keys(editedValues).length > 0 ? `(${Object.keys(editedValues).length})` : ''}`}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeCategory === cat.id
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
              }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
            {grouped[cat.id]?.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${activeCategory === cat.id ? 'bg-white/20' : 'bg-red-100'
                }`}>
                {grouped[cat.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-xl border border-red-100 divide-y divide-red-50">
        {(grouped[activeCategory] || []).map((setting: any) => (
          <div key={setting.key} className="p-4 hover:bg-red-50/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-red-800">{setting.label}</h4>
                  {setting.is_public && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Public</span>
                  )}
                  {editedValues.hasOwnProperty(setting.key) && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">O'zgartirilgan</span>
                  )}
                </div>
                {setting.description && (
                  <p className="text-sm text-red-500 mt-1">{setting.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Kalit: {setting.key}</p>
              </div>
              <div className="flex items-center gap-2">
                {renderInput(setting)}
                <button
                  onClick={() => deleteSetting(setting.key)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                  title="O'chirish"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {(!grouped[activeCategory] || grouped[activeCategory].length === 0) && (
          <div className="p-8 text-center text-red-400">
            <Database size={32} className="mx-auto mb-2 opacity-50" />
            <p>Bu kategoriyada sozlamalar yo'q</p>
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl p-6 border border-red-100">
        <h4 className="font-medium text-red-800 mb-4 flex items-center gap-2">
          <Database size={18} />
          Tizim ma'lumotlari
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-red-500">Versiya</p>
            <p className="font-bold text-red-800">1.0.0</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-500">Backend</p>
            <p className="font-bold text-blue-800">Go + Gin</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-green-500">Frontend</p>
            <p className="font-bold text-green-800">Next.js 14</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-purple-500">Database</p>
            <p className="font-bold text-purple-800">PostgreSQL 16</p>
          </div>
        </div>
      </div>

      {/* Add Setting Modal */}
      {showAddModal && (
        <AddSettingModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchSettings();
            setMessage({ type: 'success', text: 'Sozlama qo\'shildi' });
          }}
          categories={categories}
        />
      )}
    </div>
  );
}

// Add Setting Modal Component
function AddSettingModal({
  onClose,
  onSuccess,
  categories
}: {
  onClose: () => void;
  onSuccess: () => void;
  categories: { id: string; label: string }[];
}) {
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
      // Parse value based on data_type
      let parsedValue: any = formData.value;
      if (formData.data_type === 'boolean') {
        parsedValue = formData.value === 'true';
      } else if (formData.data_type === 'number') {
        parsedValue = parseInt(formData.value) || 0;
      } else if (formData.data_type === 'array') {
        parsedValue = formData.value.split(',').map(s => s.trim()).filter(Boolean);
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div className="p-6 border-b border-red-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-red-800">Yangi sozlama qo'shish</h2>
            <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-lg">
              <X size={20} className="text-red-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">Kategoriya</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-red-200 rounded-lg"
                aria-label="Kategoriya tanlash"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">Tur</label>
              <select
                value={formData.data_type}
                onChange={(e) => setFormData(prev => ({ ...prev, data_type: e.target.value }))}
                className="w-full px-4 py-2 border border-red-200 rounded-lg"
                aria-label="Ma'lumot turi"
              >
                <option value="text">Matn</option>
                <option value="number">Raqam</option>
                <option value="boolean">Ha/Yo'q</option>
                <option value="array">Ro'yxat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Kalit (key)</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
              placeholder="masalan: max_file_size"
              className="w-full px-4 py-2 border border-red-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Sarlavha</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Foydalanuvchiga ko'rinadigan nom"
              className="w-full px-4 py-2 border border-red-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Qiymat</label>
            {formData.data_type === 'boolean' ? (
              <select
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-4 py-2 border border-red-200 rounded-lg"
                aria-label="Boolean qiymat"
              >
                <option value="true">Ha (Yoqilgan)</option>
                <option value="false">Yo'q (O'chirilgan)</option>
              </select>
            ) : (
              <input
                type={formData.data_type === 'number' ? 'number' : 'text'}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={formData.data_type === 'array' ? 'qiymat1, qiymat2, qiymat3' : 'Qiymat'}
                className="w-full px-4 py-2 border border-red-200 rounded-lg"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Tavsif (ixtiyoriy)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Bu sozlama nima uchun kerak"
              rows={2}
              className="w-full px-4 py-2 border border-red-200 rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-sm text-red-700">Public (autentifikatsiyasiz ko'rish mumkin)</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
            >
              {loading ? 'Saqlanmoqda...' : 'Qo\'shish'}
            </button>
          </div>
        </form>
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
  image_url?: string;
  portfolio_id?: string;
  start_date: string;
  end_date?: string;
  created_at: string;
}

function AnnouncementsTab({ setMessage }: { setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [filter, setFilter] = useState('all');

  const types = [
    { value: 'news', label: 'Yangilik', icon: '📰', color: 'bg-blue-100 text-blue-700' },
    { value: 'announcement', label: "E'lon", icon: '📢', color: 'bg-green-100 text-green-700' },
    { value: 'portfolio_highlight', label: 'Portfolio', icon: '🏆', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'university_news', label: 'Universitet', icon: '🎓', color: 'bg-purple-100 text-purple-700' },
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, [filter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/announcements' : `/api/announcements?type=${filter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
      const res = await fetch(`/api/announcements/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
    return types.find(t => t.value === type) || types[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
              <Megaphone className="text-red-500" />
              E'lonlar va Yangiliklar
            </h2>
            <p className="text-red-600 text-sm mt-1">Banner'da aylanib turuvchi e'lonlarni boshqaring</p>
          </div>
          <button
            onClick={() => { setEditingAnnouncement(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={20} />
            Yangi e'lon
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === 'all' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
          >
            Barchasi
          </button>
          {types.map(type => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === type.value ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Megaphone className="w-16 h-16 text-red-200 mx-auto mb-4" />
          <p className="text-red-600">Hali e'lonlar yo'q</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map(announcement => {
            const typeInfo = getTypeInfo(announcement.type);
            return (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${announcement.is_active ? 'border-green-500' : 'border-gray-300'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${announcement.is_marquee ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {announcement.is_marquee ? '🔄 Banner' : '📄 Oddiy'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Muhimlik: {announcement.priority}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{announcement.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{announcement.content}</p>

                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {announcement.target_roles.join(', ')}
                      </span>
                      {announcement.link_url && (
                        <a href={announcement.link_url} target="_blank" className="flex items-center gap-1 text-blue-500 hover:underline">
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
                      className={`p-2 rounded-lg transition-colors ${announcement.is_active
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      title={announcement.is_active ? "O'chirish" : 'Yoqish'}
                    >
                      {announcement.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => { setEditingAnnouncement(announcement); setShowModal(true); }}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="O'chirish"
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

      {/* Modal */}
      {showModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => { setShowModal(false); setEditingAnnouncement(null); }}
          onSuccess={() => { setShowModal(false); setEditingAnnouncement(null); fetchAnnouncements(); }}
          setMessage={setMessage}
        />
      )}
    </div>
  );
}

// Announcement Modal
function AnnouncementModal({
  announcement,
  onClose,
  onSuccess,
  setMessage,
}: {
  announcement: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
  setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}) {
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
    { value: 'news', label: 'Yangilik', icon: '📰' },
    { value: 'announcement', label: "E'lon", icon: '📢' },
    { value: 'portfolio_highlight', label: 'Eng yaxshi portfolio', icon: '🏆' },
    { value: 'university_news', label: 'Universitet yangiligi', icon: '🎓' },
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      setFormData(prev => ({ ...prev, target_roles: ['ALL'] }));
    } else {
      const newRoles = formData.target_roles.filter(r => r !== 'ALL');
      if (newRoles.includes(role)) {
        setFormData(prev => ({ ...prev, target_roles: newRoles.filter(r => r !== role) }));
      } else {
        setFormData(prev => ({ ...prev, target_roles: [...newRoles, role] }));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-red-800">
            {announcement ? "E'lonni tahrirlash" : "Yangi e'lon qo'shish"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">Turi</label>
            <div className="grid grid-cols-2 gap-2">
              {types.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${formData.type === type.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-200'
                    }`}
                >
                  <span className="text-xl mr-2">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Sarlavha *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="E'lon sarlavhasi..."
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Matn *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="E'lon matni..."
              required
            />
          </div>

          {/* Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">Havola (ixtiyoriy)</label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                className="w-full px-4 py-2 border border-red-200 rounded-lg"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">Havola matni</label>
              <input
                type="text"
                value={formData.link_text}
                onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                className="w-full px-4 py-2 border border-red-200 rounded-lg"
                placeholder="Batafsil..."
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">
              Muhimlik darajasi: {formData.priority}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              className="w-full"
              aria-label="Muhimlik darajasi"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Past</span>
              <span>Yuqori</span>
            </div>
          </div>

          {/* Target Roles */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">Kimga ko'rsatilsin</label>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => toggleRole(role.value)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${formData.target_roles.includes(role.value)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-red-700">Faol</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_marquee}
                onChange={(e) => setFormData(prev => ({ ...prev, is_marquee: e.target.checked }))}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-red-700">Banner'da ko'rsatish</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
            >
              {loading ? 'Saqlanmoqda...' : announcement ? 'Saqlash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== CATEGORIES TAB ====================
function CategoriesTab({ setMessage }: { setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void }) {
  const [categories, setCategories] = useState<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
    slug?: string;
    display_order?: number;
    is_active?: boolean;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
    slug?: string;
    display_order?: number;
  } | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Kategoriyalarni yuklashda xatolik:', error);
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
      const response = await fetch(`/api/admin/categories/${categoryValue}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Xatolik');
      }

      setMessage({ type: 'success', text: 'Kategoriya o\'chirildi' });
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Kategoriyani o\'chirishda xatolik' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Modern SaaS Style */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-xl">
                <Palette className="text-red-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-red-900">Portfolio Kategoriyalari</h2>
            </div>
            <p className="text-red-700 text-sm flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Database size={16} />
                Jami: <strong>{categories.length}</strong> ta kategoriya
              </span>
              <span className="text-red-400">•</span>
              <span className="flex items-center gap-1">
                <CheckCircle size={16} />
                Aktiv: <strong>{categories.filter(c => c.is_active).length}</strong> ta
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200 transition-all transform hover:scale-105"
          >
            <Plus size={20} />
            <span className="font-medium">Yangi kategoriya</span>
          </button>
        </div>
      </div>

      {/* Categories Grid - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <div
            key={category.value}
            className="group relative bg-white rounded-2xl p-6 border-2 border-red-100 hover:border-red-300 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Active Badge */}
            {category.is_active && (
              <div className="absolute top-4 right-4">
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                  <CheckCircle size={12} />
                  Aktiv
                </span>
              </div>
            )}

            {/* Icon & Info */}
            <div className="mb-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl flex items-center justify-center text-4xl border-2 border-red-100 group-hover:scale-110 transition-transform">
                  {category.icon || '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-red-900 mb-1 truncate">{category.label}</h3>
                  <p className="text-xs font-mono text-red-600 bg-red-50 px-2 py-1 rounded inline-block">{category.value}</p>
                  {category.slug && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Link size={12} />
                      /portfolio/{category.slug}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {category.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                {category.description}
              </p>
            )}

            {/* Display Order */}
            {category.display_order !== undefined && (
              <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                <Star size={14} className="text-yellow-500" />
                Tartib: <strong>#{category.display_order}</strong>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-red-100">
              <button
                onClick={() => {
                  setEditingCategory(category);
                  setShowModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                title="Tahrirlash"
              >
                <Edit size={16} />
                Tahrirlash
              </button>
              <button
                onClick={() => handleDelete(category.value)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium"
                title="O'chirish"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State - Modern SaaS */}
      {categories.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border-2 border-dashed border-red-200">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-red-200 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <Palette className="relative text-red-400" size={80} />
          </div>
          <h3 className="text-2xl font-bold text-red-900 mb-2">Kategoriyalar yo'q</h3>
          <p className="text-red-600 mb-6 max-w-md mx-auto">
            Birinchi portfolio kategoriyangizni yarating va tizimni ishga tushiring
          </p>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200 transition-all transform hover:scale-105 font-medium"
          >
            <Plus size={20} />
            Birinchi kategoriyani qo'shish
          </button>
        </div>
      )}

      {/* Modal */}
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
              text: editingCategory ? 'Kategoriya yangilandi' : 'Kategoriya qo\'shildi'
            });
          }}
        />
      )}
    </div>
  );
}

// Category Modal - Modern SaaS Style
function CategoryModal({
  category,
  onClose,
  onSuccess,
}: {
  category: {
    value: string;
    label: string;
    icon?: string;
    description?: string;
    slug?: string;
    display_order?: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    value: category?.value || '',
    label: category?.label || '',
    icon: category?.icon || '📁',
    description: category?.description || '',
    slug: category?.slug || '',
    display_order: category?.display_order || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.value.trim()) {
      setError('Kod (VALUE) majburiy');
      return;
    }
    if (!formData.label.trim()) {
      setError('Nomi majburiy');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug majburiy');
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Palette size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
                </h2>
                <p className="text-red-100 text-sm mt-1">
                  {category ? 'Mavjud kategoriyani yangilang' : 'Portfolio uchun yangi kategoriya yarating'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Value (CODE) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Database size={16} className="text-red-600" />
              Kod (VALUE) *
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value.toUpperCase() })}
              placeholder="RESEARCH"
              disabled={!!category}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all text-gray-900 font-mono uppercase disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle size={12} />
              Inglizcha, katta harflar (masalan: ACADEMIC, PROJECTS, RESEARCH)
            </p>
          </div>

          {/* Label (Uzbek) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Palette size={16} className="text-red-600" />
              Nomi (Label) *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Tadqiqot va izlanishlar"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all text-gray-900"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle size={12} />
              O'zbekcha kategoriya nomi (foydalanuvchilarga ko'rsatiladi)
            </p>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Star size={16} className="text-red-600" />
              Icon (Emoji)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🔬"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all text-2xl text-center"
                maxLength={4}
              />
              <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 flex items-center justify-center text-3xl">
                {formData.icon || '📁'}
              </div>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle size={12} />
              Kategoriya ikonkasi (emoji): 🔬 🎨 ⚽ 🌟 💡
            </p>
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Link size={16} className="text-red-600" />
              URL Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              placeholder="research"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all text-gray-900 font-mono lowercase"
            />
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Globe size={14} className="text-blue-600" />
              <p className="text-xs text-blue-700 font-mono">
                /portfolio/<strong>{formData.slug || 'slug'}</strong>
              </p>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle size={12} />
              Kichik harflar, tire (-) ruxsat etilgan, bo'sh joy yo'q
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText size={16} className="text-red-600" />
              Tavsif (Description)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ilmiy tadqiqotlar, laboratoriya ishlari, tajribalar..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all text-gray-900 resize-none"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle size={12} />
              Kategoriya haqida qisqacha ma'lumot
            </p>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Star size={16} className="text-red-600" />
              Tartib raqami (Display Order)
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all text-gray-900"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle size={12} />
              Sidebar da ko'rinish tartibi (0-100)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 shadow-lg shadow-red-200 transition-all font-medium flex items-center justify-center gap-2"
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

