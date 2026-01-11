// Super Admin Panel Components - admin/page.tsx dan nusxa olingan

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
  Download,
  Edit,
  Eye,
  FileText,
  GraduationCap,
  Link,
  Megaphone,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
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
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface FilterOptions {
  faculties?: string[];
  specialties?: string[];
  courses?: number[];
  groups?: string[];
}

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

class AdminAPI {
  private getToken() {
    return localStorage.getItem('token');
  }

  private async fetch(url: string, options: RequestInit = {}) {
    const token = this.getToken();
    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Xatolik' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  async getUsers(params: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    return this.fetch(`/api/admin/users?${query}`);
  }

  async deleteUser(id: string) {
    return this.fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  }

  async importStudents(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.getToken();
    const res = await fetch(`${API_URL}/api/admin/import-students`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!res.ok) throw new Error('Import xato');
    return res.json();
  }

  async createUser(data: any) {
    return this.fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getCategories() {
    return this.fetch('/api/admin/categories');
  }

  async getWebhooks() {
    return this.fetch('/api/webhooks');
  }

  async createWebhook(data: any) {
    return this.fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string) {
    return this.fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
  }

  async toggleWebhook(id: string) {
    return this.fetch(`/api/webhooks/${id}/toggle`, { method: 'PATCH' });
  }

  async getAnnouncements() {
    return this.fetch('/api/announcements');
  }

  async createAnnouncement(data: any) {
    return this.fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string) {
    return this.fetch(`/api/announcements/${id}`, { method: 'DELETE' });
  }

  async sendNotification(data: any) {
    return this.fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getSettings() {
    return this.fetch('/api/settings');
  }

  async updateSetting(key: string, value: string) {
    return this.fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
  }
}

const admin = new AdminAPI();

// ==================== STAT CARD ====================
export function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
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

// ==================== DASHBOARD TAB ====================
export function DashboardTab() {
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
        fetch(`${API_URL}/api/dashboard/stats`, { headers }),
        fetch(`${API_URL}/api/admin/analytics/overview`, { headers }),
        fetch(`${API_URL}/api/admin/analytics/top-portfolios?sort=views`, { headers }),
        fetch(`${API_URL}/api/admin/analytics/recent-activity?limit=10`, { headers }),
        fetch(`${API_URL}/api/admin/analytics/categories`, { headers }),
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
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  const facultyStats = stats?.students_by_faculty
    ? Object.entries(stats.students_by_faculty).map(([faculty, count]) => ({ faculty, count }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Real-time Dashboard</h2>
          {lastUpdated && (
            <span className="text-xs md:text-sm text-purple-300">
              Oxirgi yangilanish: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm w-full sm:w-auto justify-center"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
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

      {analyticsOverview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs md:text-sm">Ko'rishlar</p>
                <p className="text-xl md:text-2xl font-bold">{(analyticsOverview.total_views || 0).toLocaleString()}</p>
              </div>
              <Eye size={24} className="text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-xs md:text-sm">Baholar</p>
                <p className="text-xl md:text-2xl font-bold">{(analyticsOverview.total_ratings || 0).toLocaleString()}</p>
              </div>
              <Star size={24} className="text-yellow-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs md:text-sm">Izohlar</p>
                <p className="text-xl md:text-2xl font-bold">{(analyticsOverview.total_comments || 0).toLocaleString()}</p>
              </div>
              <FileText size={24} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-xs md:text-sm">Bookmark</p>
                <p className="text-xl md:text-2xl font-bold">{(analyticsOverview.total_bookmarks || 0).toLocaleString()}</p>
              </div>
              <Link size={24} className="text-pink-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs md:text-sm">Online</p>
                <p className="text-xl md:text-2xl font-bold">{analyticsOverview.online_users || 0}</p>
              </div>
              <Users size={24} className="text-green-200" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-gray-700/30 rounded-xl p-4 md:p-6 border border-gray-600">
          <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <Star size={20} className="text-yellow-500" />
            Eng mashhur portfoliolar
          </h3>
          {topPortfolios.length > 0 ? (
            <div className="space-y-3">
              {topPortfolios.slice(0, 5).map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-600/30 rounded-lg">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white text-sm ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-purple-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate text-sm">{p.title}</p>
                    <p className="text-sm text-gray-400 text-xs">{p.owner_name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300 text-xs">
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
            <p className="text-gray-400 text-center py-4 text-sm">Ma'lumot topilmadi</p>
          )}
        </div>

        <div className="bg-gray-700/30 rounded-xl p-4 md:p-6 border border-gray-600">
          <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-400" />
            So'nggi faoliyatlar
          </h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.map((a: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-600/30 rounded-lg">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    a.type === 'view' ? 'bg-purple-500/20 text-purple-400' :
                    a.type === 'rating' ? 'bg-yellow-500/20 text-yellow-400' :
                    a.type === 'comment' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-pink-500/20 text-pink-400'
                  }`}>
                    {a.type === 'view' ? <Eye size={16} /> :
                      a.type === 'rating' ? <Star size={16} /> :
                      a.type === 'comment' ? <FileText size={16} /> :
                      <Link size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 text-xs">{a.description || a.user_name}</p>
                    <p className="text-xs text-gray-500">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4 text-sm">Faoliyat yo'q</p>
          )}
        </div>
      </div>

      {categoryStats.length > 0 && (
        <div className="bg-gray-700/30 rounded-xl p-4 md:p-6 border border-gray-600">
          <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Kategoriyalar bo'yicha
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {categoryStats.map((cat: any, idx: number) => {
              const maxCount = Math.max(...categoryStats.map((c: any) => c.count));
              const percentage = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
              return (
                <div key={idx} className="p-4 bg-gray-600/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300 truncate">{cat.category}</span>
                    <span className="text-sm font-bold text-white">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
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

      {facultyStats.length > 0 && (
        <div className="bg-gray-700/30 rounded-xl p-4 md:p-6 border border-gray-600">
          <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <Building size={20} />
            Fakultetlar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {facultyStats.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg">
                <span className="text-gray-300 font-medium truncate">{f.faculty || "Noma'lum"}</span>
                <span className="text-white font-bold bg-purple-600 px-3 py-1 rounded-full shadow-sm text-sm">
                  {(f.count as number).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 md:p-6 border border-green-500/30">
        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-400" />
          Tizim holati
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-300 text-sm">Backend: Ishlayapti</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-300 text-sm">Database: Bog'langan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-300 text-sm">WebSocket: Faol</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Continue with other tabs in next file...
