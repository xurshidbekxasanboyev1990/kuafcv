// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { GraduationCap, LogOut, Mail, Phone, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
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

  return (
    <MainLayout showMarquee={false}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-800 flex items-center gap-3">
          <Settings className="text-red-500" size={32} />
          Profil
        </h1>
      </div>

      <div className="max-w-2xl">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-4xl">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.full_name}</h2>
                <p className="text-red-200">{user.role}</p>
                {user.student_id && (
                  <p className="text-red-200 text-sm mt-1">ID: {user.student_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Mail className="text-red-500" size={20} />
                </div>
                <div>
                  <p className="text-red-500 text-sm">Email</p>
                  <p className="text-red-800 font-medium">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              {user.student_data?.phone && (
                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Phone className="text-red-500" size={20} />
                  </div>
                  <div>
                    <p className="text-red-500 text-sm">Telefon</p>
                    <p className="text-red-800 font-medium">{user.student_data.phone}</p>
                  </div>
                </div>
              )}

              {/* Student Info */}
              {user.role === 'STUDENT' && user.student_data && (
                <>
                  <h3 className="text-lg font-semibold text-red-800 mt-8 mb-4 flex items-center gap-2">
                    <GraduationCap className="text-red-500" size={24} />
                    Ta'lim ma'lumotlari
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Fakultet', value: user.student_data.faculty },
                      { label: 'Mutaxassislik', value: user.student_data.specialty },
                      { label: 'Kurs', value: user.student_data.course },
                      { label: 'Guruh', value: user.student_data.group },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-red-50 rounded-lg">
                        <p className="text-red-500 text-sm">{item.label}</p>
                        <p className="text-red-800 font-medium">{item.value || '-'}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Company Info */}
              {user.role === 'EMPLOYER' && user.company_name && (
                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="text-red-500" size={20} />
                  </div>
                  <div>
                    <p className="text-red-500 text-sm">Kompaniya</p>
                    <p className="text-red-800 font-medium">{user.company_name}</p>
                  </div>
                </div>
              )}

              {/* Account Info */}
              <div className="pt-6 border-t border-red-100">
                <p className="text-red-400 text-sm">
                  Ro'yxatdan o'tgan: {new Date(user.created_at).toLocaleDateString('uz-UZ')}
                </p>
              </div>

              {/* Logout Button */}
              <div className="pt-6 border-t border-red-100">
                <button
                  onClick={() => {
                    if (confirm('Tizimdan chiqishni xohlaysizmi?')) {
                      logout();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <LogOut size={20} />
                  <span>Tizimdan chiqish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
