// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import AIAnalytics from '@/components/AIAnalytics';
import { useAuth } from '@/components/AuthProvider';
import Filters from '@/components/Filters';
import MainLayout from '@/components/MainLayout';
import { FilterOptions, PortfolioItemWithOwner, registrar } from '@/lib/api';
import {
  Brain,
  CheckCircle,
  CheckSquare,
  Clock,
  Download,
  Eye,
  File,
  FileText,
  Image,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegistrarPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioItemWithOwner[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    faculties: [],
    specialties: [],
    courses: [],
    groups: [],
  });
  const [filterValues, setFilterValues] = useState({
    search: '',
    faculty: '',
    specialty: '',
    course: '',
    group: '',
  });
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [total, setTotal] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItemWithOwner | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !['ADMIN', 'REGISTRAR'].includes(user.role))) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchPortfolios = async () => {
    setLoadingData(true);
    try {
      const params: Record<string, string> = { status: statusFilter };
      if (filterValues.search) params.search = filterValues.search;
      if (filterValues.faculty) params.faculty = filterValues.faculty;
      if (filterValues.specialty) params.specialty = filterValues.specialty;
      if (filterValues.course) params.course = filterValues.course;
      if (filterValues.group) params.group = filterValues.group;

      const response = await registrar.getPortfolios(params);
      setPortfolios(response.items);
      setFilters(response.filters);
      setTotal(response.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && ['ADMIN', 'REGISTRAR'].includes(user.role)) {
      fetchPortfolios();
    }
  }, [user, filterValues, statusFilter]);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues({
      search: '',
      faculty: '',
      specialty: '',
      course: '',
      group: '',
    });
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await registrar.approve(id);
      setSelectedPortfolio(null);
      fetchPortfolios();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await registrar.reject(id, rejectReason);
      setSelectedPortfolio(null);
      setRejectReason('');
      fetchPortfolios();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-green-100 text-green-700 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap">
            <CheckCircle size={12} />
            <span className="hidden sm:inline">Tasdiqlangan</span>
            <span className="sm:hidden">✓</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-red-100 text-red-700 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap">
            <XCircle size={12} />
            <span className="hidden sm:inline">Rad etilgan</span>
            <span className="sm:hidden">✗</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap">
            <Clock size={12} />
            <span className="hidden sm:inline">Kutilmoqda</span>
            <span className="sm:hidden">⏳</span>
          </span>
        );
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-red-800 flex items-center gap-3">
          <CheckSquare className="text-red-500" size={28} />
          Portfolio Tasdiqlash
        </h1>
        <p className="text-red-600 mt-1 text-sm md:text-base">Jami: {total} ta portfolio</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${statusFilter === status
                ? 'bg-red-600 text-white'
                : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
              }`}
          >
            {status === 'PENDING' && 'Kutilmoqda'}
            {status === 'APPROVED' && 'Tasdiqlangan'}
            {status === 'REJECTED' && 'Rad etilgan'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Filters
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Portfolios */}
      {loadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 md:p-6 border border-red-100 animate-pulse">
              <div className="h-24 md:h-32 bg-red-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="bg-white rounded-xl p-8 md:p-12 text-center border border-red-100">
          <FileText className="mx-auto text-red-300 mb-4" size={48} />
          <p className="text-red-500">Portfolio topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {portfolios.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2.5 sm:mb-3 md:mb-4 gap-1.5 sm:gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-red-800 text-xs sm:text-sm md:text-base truncate">{item.title}</h3>
                  <div className="flex items-center gap-1 md:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                    <p className="text-[10px] sm:text-xs md:text-sm" style={{ color: '#991B1B' }}>
                      {item.type === 'PROJECT' && '🚀 Loyiha'}
                      {item.type === 'CERTIFICATE' && '🏆 Sertifikat'}
                      {item.type === 'ASSIGNMENT' && '📝 Topshiriq'}
                    </p>
                    {item.category && (
                      <span className="px-1.5 md:px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] sm:text-[10px] md:text-xs">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(item.approval_status)}
                </div>
              </div>

              {item.description && (
                <p className="text-red-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{item.description}</p>
              )}

              {/* Fayl */}
              {item.file_url && (
                <div className="mb-3 md:mb-4 p-2 md:p-3 bg-red-50 rounded-lg flex items-center gap-2 md:gap-3">
                  {item.mime_type?.startsWith('image/') ? (
                    <Image size={20} className="text-blue-500 flex-shrink-0" />
                  ) : item.mime_type?.startsWith('video/') ? (
                    <Video size={20} className="text-purple-500 flex-shrink-0" />
                  ) : (
                    <File size={20} className="text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-red-700 text-xs md:text-sm font-medium truncate">{item.file_name}</p>
                    <p className="text-red-400 text-[10px] md:text-xs">
                      {item.size_bytes ? `${(item.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Owner Info */}
              <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-red-50 rounded-lg mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-700 font-bold text-sm md:text-base">
                    {item.owner.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-red-800 font-medium text-xs md:text-sm truncate">{item.owner.full_name}</p>
                  <p className="text-red-500 text-[10px] md:text-xs truncate">
                    {item.owner.student_data?.faculty} • {item.owner.student_data?.group}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 md:gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedPortfolio(item)}
                  className="flex-1 min-w-[100px] flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-xs md:text-sm"
                >
                  <Eye size={16} />
                  <span>Ko'rish</span>
                </button>
                <button
                  onClick={() => setShowAIAnalysis(item.owner.id)}
                  className="px-2 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                  title="AI Tahlil"
                  aria-label="AI tahlil ko'rish"
                >
                  <Brain size={16} />
                  <span className="text-xs md:hidden">AI</span>
                </button>
                {item.approval_status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-2 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      aria-label="Tasdiqlash"
                      title="Tasdiqlash"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => setSelectedPortfolio(item)}
                      className="px-2 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      aria-label="Rad etish"
                      title="Rad etish"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPortfolio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-red-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-red-800">{selectedPortfolio.title}</h2>
                <button
                  onClick={() => {
                    setSelectedPortfolio(null);
                    setRejectReason('');
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg"
                  aria-label="Yopish"
                >
                  <X size={20} className="text-red-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Type, Category & Status */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  {selectedPortfolio.type === 'PROJECT' && '🚀 Loyiha'}
                  {selectedPortfolio.type === 'CERTIFICATE' && '🏆 Sertifikat'}
                  {selectedPortfolio.type === 'ASSIGNMENT' && '📝 Topshiriq'}
                </span>
                {selectedPortfolio.category && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    📂 {selectedPortfolio.category}
                  </span>
                )}
                {getStatusBadge(selectedPortfolio.approval_status)}
              </div>

              {/* Description */}
              {selectedPortfolio.description && (
                <div className="mb-6">
                  <h4 className="text-red-700 font-medium mb-2">Tavsif</h4>
                  <p className="text-red-600">{selectedPortfolio.description}</p>
                </div>
              )}

              {/* Fayl */}
              {selectedPortfolio.file_url && (
                <div className="mb-6">
                  <h4 className="text-red-700 font-medium mb-2">Fayl</h4>
                  <div className="p-4 bg-red-50 rounded-lg flex items-center gap-4">
                    {selectedPortfolio.mime_type?.startsWith('image/') ? (
                      <Image size={32} className="text-blue-500" />
                    ) : selectedPortfolio.mime_type?.startsWith('video/') ? (
                      <Video size={32} className="text-purple-500" />
                    ) : (
                      <File size={32} className="text-red-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-red-700 font-medium truncate">{selectedPortfolio.file_name}</p>
                      <p className="text-red-400 text-sm">
                        {selectedPortfolio.size_bytes
                          ? `${(selectedPortfolio.size_bytes / 1024 / 1024).toFixed(2)} MB`
                          : ''}
                      </p>
                    </div>
                    <a
                      href={`http://localhost:4000${selectedPortfolio.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Download size={18} />
                      <span>Yuklab olish</span>
                    </a>
                  </div>
                  {/* Rasm preview */}
                  {selectedPortfolio.mime_type?.startsWith('image/') && (
                    <div className="mt-3">
                      <img
                        src={`http://localhost:4000${selectedPortfolio.file_url}`}
                        alt={selectedPortfolio.title}
                        className="max-w-full h-auto rounded-lg border border-red-200"
                        style={{ maxHeight: '300px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  {/* Video preview */}
                  {selectedPortfolio.mime_type?.startsWith('video/') && (
                    <div className="mt-3">
                      <video
                        src={`http://localhost:4000${selectedPortfolio.file_url}`}
                        controls
                        className="max-w-full rounded-lg border border-red-200"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {selectedPortfolio.tags && selectedPortfolio.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-red-700 font-medium mb-2">Teglar</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPortfolio.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner */}
              <div className="p-4 bg-red-50 rounded-lg mb-6">
                <h4 className="text-red-700 font-medium mb-3">Talaba</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                    <span className="text-red-700 font-bold text-lg">
                      {selectedPortfolio.owner.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-red-800 font-semibold">{selectedPortfolio.owner.full_name}</p>
                    <p className="text-red-500 text-sm">{selectedPortfolio.owner.email}</p>
                    <p className="text-red-500 text-sm">
                      {selectedPortfolio.owner.student_data?.faculty} •{' '}
                      {selectedPortfolio.owner.student_data?.group}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedPortfolio.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <h4 className="text-red-700 font-medium mb-2">Rad etish sababi</h4>
                  <p className="text-red-600">{selectedPortfolio.rejection_reason}</p>
                </div>
              )}

              {/* Actions for Pending */}
              {selectedPortfolio.approval_status === 'PENDING' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-red-700 font-medium mb-2">
                      Rad etish sababi (ixtiyoriy)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Sabab kiriting..."
                      rows={3}
                      className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-red-800"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(selectedPortfolio.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
                    >
                      <XCircle size={20} />
                      <span>Rad etish</span>
                    </button>
                    <button
                      onClick={() => handleApprove(selectedPortfolio.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                    >
                      <CheckCircle size={20} />
                      <span>Tasdiqlash</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIAnalysis && (
        <AIAnalytics
          studentId={showAIAnalysis}
          onClose={() => setShowAIAnalysis(null)}
          isModal={true}
        />
      )}
    </MainLayout>
  );
}
