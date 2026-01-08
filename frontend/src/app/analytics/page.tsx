// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { api } from '@/lib/api';
import {
  Activity,
  BarChart3,
  Bookmark,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  FolderOpen,
  GraduationCap,
  MessageSquare,
  PieChart,
  RefreshCw,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OverviewStats {
  total_users: number;
  total_students: number;
  total_employers: number;
  total_portfolios: number;
  approved_portfolios: number;
  pending_portfolios: number;
  total_views: number;
  total_ratings: number;
  total_comments: number;
  total_bookmarks: number;
  online_users: number;
}

interface TopPortfolio {
  id: string;
  title: string;
  category: string;
  view_count: number;
  rating_avg: number;
  rating_count: number;
  comment_count: number;
  bookmark_count: number;
  owner_name: string;
}

interface CategoryStat {
  category: string;
  count: number;
  total_views: number;
  avg_rating: number;
}

interface ActivityItem {
  portfolio_id: string;
  portfolio_title: string;
  user_name: string;
  action: string;
  created_at: string;
}

interface TopPortfoliosResponse {
  portfolios: TopPortfolio[];
}

interface CategoriesResponse {
  categories: CategoryStat[];
}

interface ActivityResponse {
  activities: ActivityItem[];
}

interface RatingDistResponse {
  distribution: Record<number, number>;
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [topPortfolios, setTopPortfolios] = useState<TopPortfolio[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [ratingDist, setRatingDist] = useState<Record<number, number>>({});
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [sortBy, setSortBy] = useState('views');
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const allowedRoles = ['admin', 'ADMIN', 'registrar', 'REGISTRAR'];
  const isAllowed = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!loading && !isAllowed) {
      router.push('/dashboard');
    }
  }, [user, loading, router, isAllowed]);

  useEffect(() => {
    if (isAllowed) {
      fetchData();
    }
  }, [user, sortBy, isAllowed]);

  const fetchData = async () => {
    if (!dataLoading) setRefreshing(true);
    setDataLoading(true);
    try {
      const isAdmin = user?.role?.toLowerCase() === 'admin';
      const prefix = isAdmin ? '/admin/analytics' : '/analytics';

      const [overviewRes, topRes, catRes, activityRes] = await Promise.all([
        api.get<OverviewStats>(`${prefix}/overview`),
        api.get<TopPortfoliosResponse>(`${prefix}/top-portfolios?sort=${sortBy}`),
        api.get<CategoriesResponse>(`${prefix}/categories`),
        api.get<ActivityResponse>(`${prefix}/recent-activity`),
      ]);

      let ratingRes: RatingDistResponse = { distribution: {} };
      if (isAdmin) {
        ratingRes = await api.get<RatingDistResponse>('/admin/analytics/rating-distribution');
      }

      setOverview(overviewRes);
      setTopPortfolios(topRes.portfolios || []);
      setCategories(catRes.categories || []);
      setRatingDist(ratingRes.distribution || {});
      setRecentActivity(activityRes.activities || []);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  };

  if (loading || !isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
          <p className="text-slate-600 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const totalRatings = Object.values(ratingDist).reduce((a, b) => a + b, 0);

  const statCards = [
    { title: 'Jami foydalanuvchilar', value: overview?.total_users || 0, icon: Users, color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
    { title: 'Talabalar', value: overview?.total_students || 0, icon: GraduationCap, color: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600' },
    { title: 'Ish beruvchilar', value: overview?.total_employers || 0, icon: Building2, color: 'from-violet-500 to-violet-600', bgLight: 'bg-violet-50', textColor: 'text-violet-600' },
    { title: 'Online hozir', value: overview?.online_users || 0, icon: Zap, color: 'from-green-500 to-green-600', bgLight: 'bg-green-50', textColor: 'text-green-600', pulse: true },
  ];

  const portfolioStats = [
    { title: 'Jami portfoliolar', value: overview?.total_portfolios || 0, icon: FolderOpen, color: 'from-red-500 to-red-600', bgLight: 'bg-red-50', textColor: 'text-red-600' },
    { title: 'Tasdiqlangan', value: overview?.approved_portfolios || 0, icon: CheckCircle, color: 'from-green-500 to-green-600', bgLight: 'bg-green-50', textColor: 'text-green-600' },
    { title: 'Kutilmoqda', value: overview?.pending_portfolios || 0, icon: Clock, color: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50', textColor: 'text-amber-600' },
    { title: "Ko'rishlar", value: overview?.total_views || 0, icon: Eye, color: 'from-indigo-500 to-indigo-600', bgLight: 'bg-indigo-50', textColor: 'text-indigo-600' },
  ];

  const engagementStats = [
    { title: 'Reytinglar', value: overview?.total_ratings || 0, icon: Star, color: 'from-yellow-500 to-yellow-600', bgLight: 'bg-yellow-50', textColor: 'text-yellow-600' },
    { title: 'Izohlar', value: overview?.total_comments || 0, icon: MessageSquare, color: 'from-sky-500 to-sky-600', bgLight: 'bg-sky-50', textColor: 'text-sky-600' },
    { title: 'Saqlangan', value: overview?.total_bookmarks || 0, icon: Bookmark, color: 'from-pink-500 to-pink-600', bgLight: 'bg-pink-50', textColor: 'text-pink-600' },
  ];

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'viewed': return <Eye className="w-4 h-4 text-indigo-500" />;
      case 'rated': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'commented': return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'bookmarked': return <Bookmark className="w-4 h-4 text-pink-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (action: string) => {
    switch (action) {
      case 'viewed': return "ko'rdi";
      case 'rated': return 'baholadi';
      case 'commented': return 'izoh qoldirdi';
      case 'bookmarked': return 'saqladi';
      default: return action;
    }
  };

  return (
    <MainLayout showMarquee={false}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/20">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
                <p className="text-slate-500 text-sm">Tizim statistikasi va real-time tahlillar</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Yangilash
            </button>
          </div>
        </div>

        {dataLoading && !refreshing ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
              <p className="text-slate-600">Ma&apos;lumotlar yuklanmoqda...</p>
            </div>
          </div>
        ) : (
          <>
            {/* User Stats */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-700">Foydalanuvchilar</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                  <div key={i} className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value.toLocaleString()}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgLight} group-hover:scale-110 transition-transform`}>
                        <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>
                    {stat.pulse && (
                      <div className="absolute top-4 right-4">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      </div>
                    )}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-700">Portfoliolar</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {portfolioStats.map((stat, i) => (
                  <div key={i} className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value.toLocaleString()}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgLight} group-hover:scale-110 transition-transform`}>
                        <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-700">Engagement</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {engagementStats.map((stat, i) => (
                  <div key={i} className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value.toLocaleString()}</p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgLight} group-hover:scale-110 transition-transform`}>
                        <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Portfolios Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Top Portfoliolar</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    >
                      <option value="views">Ko&apos;rishlar bo&apos;yicha</option>
                      <option value="rating">Reyting bo&apos;yicha</option>
                      <option value="comments">Izohlar bo&apos;yicha</option>
                      <option value="bookmarks">Saqlangan bo&apos;yicha</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Portfolio</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Muallif</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategoriya</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Eye className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Star className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <MessageSquare className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Bookmark className="w-4 h-4 mx-auto" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topPortfolios.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                          <p>Hozircha portfolio yo&apos;q</p>
                        </td>
                      </tr>
                    ) : (
                      topPortfolios.map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' :
                                i === 1 ? 'bg-slate-200 text-slate-700' :
                                  i === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                              }`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-medium text-slate-800">{p.title}</p>
                          </td>
                          <td className="py-4 px-6 text-slate-600">{p.owner_name}</td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                              {p.category || 'Umumiy'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-slate-700">{p.view_count}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 text-slate-700">
                              <span className="font-medium">{p.rating_avg.toFixed(1)}</span>
                              <span className="text-slate-400 text-xs">({p.rating_count})</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-slate-700">{p.comment_count}</td>
                          <td className="py-4 px-6 text-center font-medium text-slate-700">{p.bookmark_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Categories */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-violet-50 rounded-xl">
                    <PieChart className="w-5 h-5 text-violet-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">Kategoriyalar</h2>
                </div>
                <div className="space-y-4">
                  {categories.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Kategoriyalar yo&apos;q</p>
                  ) : (
                    categories.map((cat, i) => {
                      const maxCount = Math.max(...categories.map(c => c.count));
                      const percentage = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                      return (
                        <div key={cat.category || i} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-slate-700">{cat.category || 'Umumiy'}</span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                                {cat.count} ta
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-slate-500">
                                <Eye className="w-3.5 h-3.5" />
                                {cat.total_views}
                              </span>
                              <span className="flex items-center gap-1 text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {cat.avg_rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">Reyting taqsimoti</h2>
                </div>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingDist[rating] || 0;
                    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                    return (
                      <div key={rating} className="group">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 w-16">
                            <span className="font-medium text-slate-700">{rating}</span>
                            <Star className="w-4 h-4 text-amber-400 fill-current" />
                          </div>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500 group-hover:from-amber-500 group-hover:to-yellow-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="w-20 text-right">
                            <span className="text-sm font-medium text-slate-700">{count}</span>
                            <span className="text-xs text-slate-400 ml-1">({percentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Jami baholashlar</span>
                    <span className="font-semibold text-slate-700">{totalRatings}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-sky-50 rounded-xl">
                  <Activity className="w-5 h-5 text-sky-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">So&apos;nggi faollik</h2>
              </div>
              <div className="space-y-1">
                {recentActivity.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Faollik yo&apos;q</p>
                ) : (
                  recentActivity.slice(0, 10).map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">
                          <span className="font-medium">{activity.user_name}</span>
                          <span className="text-slate-500"> {getActivityText(activity.action)}: </span>
                          <span className="font-medium text-red-600 truncate">{activity.portfolio_title}</span>
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(activity.created_at).toLocaleString('uz-UZ', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
