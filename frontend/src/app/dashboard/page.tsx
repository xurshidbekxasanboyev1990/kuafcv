'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import MarqueeBanner from '@/components/MarqueeBanner';
import { dashboard, DashboardStats } from '@/lib/api';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Bell,
  BarChart3,
  Brain,
  History,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Student uchun dashboard yo'q - portfolio sahifasiga yo'naltirish
    if (!loading && user?.role === 'STUDENT') {
      router.push('/portfolio');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      dashboard.getStats()
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoadingStats(false));
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Jami Talabalar',
      value: stats?.total_students || 0,
      icon: <Users className="text-red-500" size={24} />,
      color: 'bg-red-50 border-red-200',
    },
    {
      label: 'Jami Portfoliolar',
      value: stats?.total_portfolios || 0,
      icon: <FileText className="text-red-500" size={24} />,
      color: 'bg-red-50 border-red-200',
    },
    {
      label: 'Kutilayotgan',
      value: stats?.pending_portfolios || 0,
      icon: <Clock className="text-orange-500" size={24} />,
      color: 'bg-orange-50 border-orange-200',
    },
    {
      label: 'Tasdiqlangan',
      value: stats?.approved_portfolios || 0,
      icon: <CheckCircle className="text-green-500" size={24} />,
      color: 'bg-green-50 border-green-200',
    },
  ];

  return (
    <div className="min-h-screen bg-red-50">
      <Sidebar />
      {/* Marquee Banner */}
      <div className="ml-64">
        <MarqueeBanner userRole={user.role} />
      </div>
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-800">Dashboard</h1>
          <p className="text-red-600 mt-1">Xush kelibsiz, {user.full_name}!</p>
        </div>

        {/* Stats Cards */}
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-red-100 animate-pulse">
                <div className="h-16 bg-red-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`bg-white rounded-xl p-6 border ${card.color} shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">{card.label}</p>
                    <p className="text-3xl font-bold text-red-800 mt-2">{card.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Faculty Stats */}
        {stats && Object.keys(stats.students_by_faculty).length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm mb-8">
            <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
              <BarChart3 className="text-red-500" size={24} />
              Fakultetlar bo'yicha talabalar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.students_by_faculty).map(([faculty, count]) => (
                <div
                  key={faculty}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100"
                >
                  <span className="text-red-700 font-medium truncate max-w-[200px]">{faculty}</span>
                  <span className="text-red-800 font-bold bg-white px-3 py-1 rounded">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-red-100 shadow-sm">
          <h2 className="text-xl font-bold text-red-800 mb-4">Tezkor havolalar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user.role === 'ADMIN' && (
              <>
                <button
                  onClick={() => router.push('/admin')}
                  className="p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-left"
                >
                  <Users className="text-red-500 mb-2" size={24} />
                  <p className="text-red-800 font-medium">Foydalanuvchilar</p>
                  <p className="text-red-500 text-sm">Boshqarish</p>
                </button>
                <button
                  onClick={() => router.push('/groups')}
                  className="p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-left"
                >
                  <TrendingUp className="text-red-500 mb-2" size={24} />
                  <p className="text-red-800 font-medium">Talabalar ro'yxati</p>
                  <p className="text-red-500 text-sm">Ko'rish</p>
                </button>
              </>
            )}
            {(user.role === 'ADMIN' || user.role === 'REGISTRAR') && (
              <button
                onClick={() => router.push('/registrar')}
                className="p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-left"
              >
                <CheckCircle className="text-red-500 mb-2" size={24} />
                <p className="text-red-800 font-medium">Portfolio tasdiqlash</p>
                <p className="text-red-500 text-sm">{stats?.pending_portfolios || 0} kutilmoqda</p>
              </button>
            )}
            {user.role === 'STUDENT' && (
              <button
                onClick={() => router.push('/portfolio')}
                className="p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-left"
              >
                <FileText className="text-red-500 mb-2" size={24} />
                <p className="text-red-800 font-medium">Mening Portfolio</p>
                <p className="text-red-500 text-sm">Boshqarish</p>
              </button>
            )}
            <button
              onClick={() => router.push('/notifications')}
              className="p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-left"
            >
              <Bell className="text-red-500 mb-2" size={24} />
              <p className="text-red-800 font-medium">Bildirishnomalar</p>
              <p className="text-red-500 text-sm">Yangiliklar</p>
            </button>
            <button
              onClick={() => router.push('/analysis-history')}
              className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-left"
            >
              <History className="text-purple-500 mb-2" size={24} />
              <p className="text-purple-800 font-medium">Tahlil Tarixi</p>
              <p className="text-purple-500 text-sm">AI tahlil natijalari</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
