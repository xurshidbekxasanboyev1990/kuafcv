'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import {
  FolderOpen,
  Eye,
  Star,
  MessageCircle,
  Bookmark,
  RefreshCw,
  TrendingUp,
  Sparkles,
  Camera,
  FileText,
  Link2,
  BarChart3,
} from 'lucide-react';

interface PortfolioStat {
  id: string;
  title: string;
  view_count: number;
  rating_avg: number;
  rating_count: number;
  comment_count: number;
  bookmark_count: number;
}

interface MyStats {
  total_portfolios: number;
  approved_count: number;
  total_views: number;
  total_ratings: number;
  average_rating: number;
  total_comments: number;
  total_bookmarks: number;
  views_this_week: number;
  views_this_month: number;
}

interface StatsResponse {
  stats: MyStats;
  portfolios: PortfolioStat[];
}

export default function MyStatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<MyStats | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioStat[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const userRole = user?.role?.toLowerCase() || '';
  const isStudent = userRole === 'student';

  const fetchStats = async () => {
    setDataLoading(true);
    try {
      const res = await api.get<StatsResponse>('/analytics/my-portfolio-stats');
      console.log('Stats response:', res);
      setStats(res.stats);
      setPortfolios(res.portfolios || []);
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user && !isStudent) {
      router.push('/dashboard');
    }
  }, [loading, user, isStudent, router]);

  useEffect(() => {
    if (!loading && user && isStudent) {
      fetchStats();
    }
  }, [loading, user, isStudent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, subtitle, color = 'red' }: { title: string; value: number | string; icon: React.ReactNode; subtitle?: string; color?: string }) => {
    const colorClasses: Record<string, string> = {
      red: 'bg-red-50 text-red-600',
      blue: 'bg-blue-50 text-blue-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      green: 'bg-green-50 text-green-600',
    };
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-red-200 transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-red-50">
      <Sidebar />
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                Mening statistikam
              </h1>
              <p className="text-gray-600 mt-2">Portfolio ko&apos;rsatkichlari va tahlil</p>
            </div>
            <button
              onClick={fetchStats}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Yangilash
            </button>
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard 
                  title="Jami portfoliolar" 
                  value={stats?.total_portfolios || 0} 
                  icon={<FolderOpen className="w-7 h-7" />}
                  subtitle={`${stats?.approved_count || 0} tasdiqlangan`}
                  color="red"
                />
                <StatCard 
                  title="Ko'rishlar soni" 
                  value={stats?.total_views || 0} 
                  icon={<Eye className="w-7 h-7" />}
                  subtitle={`Bu hafta: ${stats?.views_this_week || 0}`}
                  color="blue"
                />
                <StatCard 
                  title="O'rtacha reyting" 
                  value={(stats?.average_rating || 0).toFixed(1)} 
                  icon={<Star className="w-7 h-7" />}
                  subtitle={`${stats?.total_ratings || 0} ta baho`}
                  color="yellow"
                />
                <StatCard 
                  title="Izohlar" 
                  value={stats?.total_comments || 0} 
                  icon={<MessageCircle className="w-7 h-7" />}
                  color="green"
                />
              </div>

              {/* Trend Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Eye className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-medium">Bu hafta ko&apos;rishlar</h3>
                  </div>
                  <p className="text-4xl font-bold">{stats?.views_this_week || 0}</p>
                  <p className="text-sm text-white/70 mt-2">
                    Oylik: {stats?.views_this_month || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-pink-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Bookmark className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-medium">Bookmarklar</h3>
                  </div>
                  <p className="text-4xl font-bold">{stats?.total_bookmarks || 0}</p>
                  <p className="text-sm text-white/70 mt-2">
                    Portfolio saqlangan
                  </p>
                </div>
              </div>

              {/* Per Portfolio Stats */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Portfolio bo&apos;yicha statistika</h2>
                </div>
                {portfolios.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-600">Hali portfolio yo&apos;q</p>
                    <p className="text-sm text-gray-400 mt-1">Birinchi portfolioingizni yarating</p>
                    <button
                      onClick={() => router.push('/portfolio')}
                      className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all inline-flex items-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Portfolio yaratish
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-4 text-gray-600 font-semibold">Portfolio</th>
                          <th className="text-center py-4 px-4 text-gray-600 font-semibold">
                            <div className="flex items-center justify-center gap-2">
                              <Eye className="w-4 h-4" /> Ko&apos;rishlar
                            </div>
                          </th>
                          <th className="text-center py-4 px-4 text-gray-600 font-semibold">
                            <div className="flex items-center justify-center gap-2">
                              <Star className="w-4 h-4" /> Reyting
                            </div>
                          </th>
                          <th className="text-center py-4 px-4 text-gray-600 font-semibold">
                            <div className="flex items-center justify-center gap-2">
                              <MessageCircle className="w-4 h-4" /> Izohlar
                            </div>
                          </th>
                          <th className="text-center py-4 px-4 text-gray-600 font-semibold">
                            <div className="flex items-center justify-center gap-2">
                              <Bookmark className="w-4 h-4" /> Bookmarklar
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolios.map((p) => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <p className="font-medium">{p.title}</p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-lg font-bold text-blue-600">{p.view_count}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-lg font-bold text-yellow-500">
                                  {p.rating_avg.toFixed(1)}
                                </span>
                                <span className="text-sm text-gray-500">({p.rating_count})</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-lg font-bold text-green-600">{p.comment_count}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-lg font-bold text-pink-600">{p.bookmark_count}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="mt-8 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-2xl p-6 border border-red-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Portfolio yaxshilash maslahatlari</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>Portfolioga ko&apos;proq loyihalar qo&apos;shing - bu ko&apos;rishlarni oshiradi</span>
                  </li>
                  <li className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Sifatli rasmlar va screenshotlar qo&apos;shing</span>
                  </li>
                  <li className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <span>Har bir loyiha uchun batafsil tavsif yozing</span>
                  </li>
                  <li className="flex items-start gap-3 bg-white/60 rounded-xl p-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-4 h-4 text-red-600" />
                    </div>
                    <span>GitHub va demo linklar qo&apos;shing</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
