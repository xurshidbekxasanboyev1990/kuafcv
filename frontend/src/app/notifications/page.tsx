// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { notifications, Notification as NotificationType, PersonalNotification } from '@/lib/api';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Eye,
  Info,
  MessageSquare,
  Star,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [globalItems, setGlobalItems] = useState<NotificationType[]>([]);
  const [personalItems, setPersonalItems] = useState<PersonalNotification[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'global'>('personal');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchNotifications = async () => {
    setLoadingData(true);
    try {
      const data = await notifications.get();
      setGlobalItems(data.global || []);
      setPersonalItems(data.personal || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await notifications.markRead(id);
      setGlobalItems(globalItems.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkPersonalRead = async (id: number) => {
    try {
      await notifications.markPersonalRead(id);
      setPersonalItems(personalItems.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (activeTab === 'global') {
        await notifications.markAllRead();
        setGlobalItems(globalItems.map((n) => ({ ...n, is_read: true })));
      } else {
        await notifications.markAllPersonalRead();
        setPersonalItems(personalItems.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="text-green-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-orange-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'rating':
        return <Star className="text-yellow-500" size={20} />;
      case 'comment':
        return <MessageSquare className="text-blue-500" size={20} />;
      case 'view':
        return <Eye className="text-purple-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const parseMetadata = (metadata?: string) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  };

  const globalUnreadCount = globalItems.filter((n) => !n.is_read).length;
  const personalUnreadCount = personalItems.filter((n) => !n.is_read).length;
  const currentItems = activeTab === 'personal' ? personalItems : globalItems;
  const currentUnreadCount = activeTab === 'personal' ? personalUnreadCount : globalUnreadCount;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <MainLayout showMarquee={false}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-red-800 flex items-center gap-3">
            <Bell className="text-red-500" size={32} />
            Bildirishnomalar
          </h1>
          <p className="text-red-600 mt-1">
            {personalUnreadCount + globalUnreadCount > 0
              ? `${personalUnreadCount + globalUnreadCount} ta o'qilmagan`
              : "Barcha o'qilgan"}
          </p>
        </div>
        {currentUnreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <CheckCheck size={20} />
            <span>Hammasini o'qilgan qilish</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'personal'
              ? 'bg-red-600 text-white'
              : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
            }`}
        >
          <User size={18} />
          Shaxsiy
          {personalUnreadCount > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
              {personalUnreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'global'
              ? 'bg-red-600 text-white'
              : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
            }`}
        >
          <Bell size={18} />
          Umumiy
          {globalUnreadCount > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
              {globalUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
      {loadingData ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-red-100 animate-pulse">
              <div className="h-16 bg-red-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-red-100">
          <Bell className="mx-auto text-red-300 mb-4" size={48} />
          <p className="text-red-500">
            {activeTab === 'personal'
              ? "Shaxsiy bildirishnomalar yo'q"
              : "Umumiy bildirishnomalar yo'q"}
          </p>
        </div>
      ) : activeTab === 'personal' ? (
        <div className="space-y-4">
          {personalItems.map((item) => {
            const meta = parseMetadata(item.metadata);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl p-6 border transition-colors ${item.is_read ? 'border-red-100' : 'border-red-300 bg-red-50'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-red-800">{item.title}</h3>
                      {!item.is_read && (
                        <button
                          onClick={() => handleMarkPersonalRead(item.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="O'qilgan qilish"
                        >
                          <Check size={18} />
                        </button>
                      )}
                    </div>
                    <p className="text-red-600 mt-1">{item.message}</p>
                    {meta && (
                      <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded">
                        {meta.rating && (
                          <span className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-500" />
                            {meta.rating} yulduz
                          </span>
                        )}
                        {meta.commenter_name && (
                          <span>Izoh qoldiruvchi: {meta.commenter_name}</span>
                        )}
                      </div>
                    )}
                    <p className="text-red-400 text-sm mt-2">
                      {new Date(item.created_at).toLocaleDateString('uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {globalItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-6 border transition-colors ${item.is_read ? 'border-red-100' : 'border-red-300 bg-red-50'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-red-800">{item.title}</h3>
                    {!item.is_read && (
                      <button
                        onClick={() => handleMarkRead(item.id)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                        title="O'qilgan qilish"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-red-600 mt-1">{item.message}</p>
                  <p className="text-red-400 text-sm mt-2">
                    {new Date(item.created_at).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
