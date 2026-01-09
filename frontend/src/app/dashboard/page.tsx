// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import {
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  History,
  TrendingUp,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard, DashboardStats, portfolio, PortfolioItem } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Fetch stats
      dashboard.getStats()
        .then(setStats)
        .catch((err) => console.error("Failed to fetch dashboard stats", err))
        .finally(() => setLoadingStats(false));

      // If student, fetch recent portfolios
      if (user.role === 'STUDENT') {
        portfolio.getMy()
          .then(setPortfolios)
          .catch((err) => console.error("Failed to fetch portfolios", err))
          .finally(() => setLoadingPortfolios(false));
      } else {
        setLoadingPortfolios(false);
      }
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const statCards = user?.role === 'STUDENT' ? [
    {
      label: 'Mening Portfoliolarim',
      value: stats?.total_portfolios || 0,
      icon: FileText,
      className: "border-l-4 border-l-blue-500",
      iconClass: "text-blue-500 bg-blue-50"
    },
    {
      label: 'Kutilayotgan',
      value: stats?.pending_portfolios || 0,
      icon: Clock,
      className: "border-l-4 border-l-orange-500",
      iconClass: "text-orange-500 bg-orange-50"
    },
    {
      label: 'Tasdiqlangan',
      value: stats?.approved_portfolios || 0,
      icon: CheckCircle,
      className: "border-l-4 border-l-green-500",
      iconClass: "text-green-500 bg-green-50"
    },
    {
      label: 'Umumiy Ko\'rishlar',
      value: (stats as any)?.total_views || 0,
      icon: Users,
      className: "border-l-4 border-l-purple-500",
      iconClass: "text-purple-500 bg-purple-50"
    },
  ] : [
    {
      label: 'Jami Talabalar',
      value: stats?.total_students || 0,
      icon: Users,
      className: "border-l-4 border-l-blue-500",
      iconClass: "text-blue-500 bg-blue-50"
    },
    {
      label: 'Jami Portfoliolar',
      value: stats?.total_portfolios || 0,
      icon: FileText,
      className: "border-l-4 border-l-purple-500",
      iconClass: "text-purple-500 bg-purple-50"
    },
    {
      label: 'Kutilayotgan',
      value: stats?.pending_portfolios || 0,
      icon: Clock,
      className: "border-l-4 border-l-orange-500",
      iconClass: "text-orange-500 bg-orange-50"
    },
    {
      label: 'Tasdiqlangan',
      value: stats?.approved_portfolios || 0,
      icon: CheckCircle,
      className: "border-l-4 border-l-green-500",
      iconClass: "text-green-500 bg-green-50"
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">
            Xush kelibsiz, <span className="font-semibold text-primary">{user.full_name}</span>!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingStats
            ? Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                </CardContent>
              </Card>
            ))
            : statCards.map((card) => (
              <Card key={card.label} className={cn("overflow-hidden transition-all hover:shadow-md", card.className)}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
                  </div>
                  <div className={cn("p-3 rounded-full", card.iconClass)}>
                    <card.icon size={24} />
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        {/* Portfolio List for Students */}
        {user.role === 'STUDENT' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  Mening Portfoliolarim
                </CardTitle>
                <CardDescription>
                  Siz yaratgan barcha portfolio loyihalari ro'yxati
                </CardDescription>
              </div>
              <Button onClick={() => router.push('/portfolio')} size="sm">
                Yangi yaratish
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPortfolios ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : portfolios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Hozircha portfoliolar mavjud emas
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolios.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          item.approval_status === 'APPROVED' ? "bg-green-100 text-green-600" :
                            item.approval_status === 'REJECTED' ? "bg-red-100 text-red-600" :
                              "bg-orange-100 text-orange-600"
                        )}>
                          {item.approval_status === 'APPROVED' ? <CheckCircle size={20} /> :
                            item.approval_status === 'REJECTED' ? <FileText size={20} /> :
                              <Clock size={20} />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-1">{item.description || 'Tavsif yo\'q'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          item.approval_status === 'APPROVED'
                            ? "bg-green-50 text-green-700 border-green-200"
                            : item.approval_status === 'REJECTED'
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-orange-50 text-orange-700 border-orange-200"
                        )}>
                          {item.approval_status === 'APPROVED' ? 'Tasdiqlangan' :
                            item.approval_status === 'REJECTED' ? 'Rad etilgan' : 'Kutilmoqda'}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/portfolio`}>Batafsil</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Faculty Stats (Only for Admins) */}
        {user.role !== 'STUDENT' && stats && Object.keys(stats.students_by_faculty).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="text-primary" size={20} />
                Fakultetlar bo'yicha talabalar
              </CardTitle>
              <CardDescription>
                Fakultetlar kesimida ro'yxatdan o'tgan talabalar soni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.students_by_faculty).map(([faculty, count]) => (
                  <div
                    key={faculty}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border"
                  >
                    <span className="text-sm font-medium truncate max-w-[200px]" title={faculty as string}>{faculty}</span>
                    <span className="text-sm font-bold bg-background border px-2 py-0.5 rounded-md">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Tezkor havolalar</CardTitle>
            <CardDescription>Tez-tez ishlatiladigan bo'limlarga tezkor o'tish</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user.role === 'ADMIN' && (
              <>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                  onClick={() => router.push('/admin')}
                >
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Users size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Foydalanuvchilar</div>
                    <div className="text-xs text-muted-foreground">Boshqarish</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                  onClick={() => router.push('/groups')}
                >
                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <TrendingUp size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Talabalar</div>
                    <div className="text-xs text-muted-foreground">Ko'rish</div>
                  </div>
                </Button>
              </>
            )}

            {(user.role === 'ADMIN' || user.role === 'REGISTRAR') && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                onClick={() => router.push('/registrar')}
              >
                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                  <CheckCircle size={20} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Portfolio</div>
                  <div className="text-xs text-muted-foreground">{stats?.pending_portfolios || 0} tasdiqlash uchun</div>
                </div>
              </Button>
            )}

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
              onClick={() => router.push('/notifications')}
            >
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <Bell size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold">Bildirishnomalar</div>
                <div className="text-xs text-muted-foreground">Xabarlarni o'qish</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
              onClick={() => router.push('/analysis-history')}
            >
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                <History size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold">Tahlil Tarixi</div>
                <div className="text-xs text-muted-foreground">AI natijalari</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

