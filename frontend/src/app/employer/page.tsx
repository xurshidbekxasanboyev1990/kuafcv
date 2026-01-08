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
import { BookmarkButton, PortfolioComments, PortfolioRating } from '@/components/PortfolioFeatures';
import { employer, FilterOptions, PortfolioItem, User } from '@/lib/api';
import { Brain, Briefcase, Download, Eye, FileText, GraduationCap, Mail, MessageCircle, Phone, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmployerPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
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
  const [total, setTotal] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<{
    student: User;
    portfolios: PortfolioItem[];
  } | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState<string | null>(null);
  const [selectedPortfolioForDetails, setSelectedPortfolioForDetails] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'EMPLOYER')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchStudents = async () => {
    setLoadingData(true);
    try {
      const params: Record<string, string> = {};
      if (filterValues.search) params.search = filterValues.search;
      if (filterValues.faculty) params.faculty = filterValues.faculty;
      if (filterValues.specialty) params.specialty = filterValues.specialty;
      if (filterValues.course) params.course = filterValues.course;
      if (filterValues.group) params.group = filterValues.group;

      const response = await employer.getStudents(params);
      setStudents(response.students);
      setFilters(response.filters);
      setTotal(response.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'EMPLOYER') {
      fetchStudents();
    }
  }, [user, filterValues]);

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

  const viewStudentDetails = async (studentId: string) => {
    try {
      const response = await employer.getStudent(studentId);
      setSelectedStudent(response);
    } catch (err) {
      console.error(err);
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
          <Briefcase className="text-red-500" size={28} />
          Talabalar Bazasi
        </h1>
        <p className="text-red-600 mt-1 text-sm md:text-base">Jami: {total} ta talaba</p>
      </div>

      {/* Filters */}
      <Filters
        filters={filters}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Students Grid */}
      {loadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 md:p-6 border border-red-100 animate-pulse">
              <div className="h-24 md:h-32 bg-red-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl p-8 md:p-12 text-center border border-red-100">
          <Briefcase className="mx-auto text-red-300 mb-4" size={48} />
          <p className="text-red-500">Talabalar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl p-4 md:p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-base md:text-lg">
                      {student.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-red-800 text-sm md:text-base truncate">{student.full_name}</h3>
                    <p className="text-red-500 text-xs md:text-sm truncate">ID: {student.student_id}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm mb-3 md:mb-4">
                <div className="flex items-center gap-2 text-red-600">
                  <GraduationCap size={14} className="text-red-400 flex-shrink-0" />
                  <span className="truncate">{student.student_data?.faculty || 'Fakultet ko\'rsatilmagan'}</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-red-400 flex-shrink-0">📚</span>
                  <span className="truncate">{student.student_data?.specialty || 'Mutaxassislik ko\'rsatilmagan'}</span>
                </div>
                <div className="flex justify-between text-red-600 gap-2">
                  <span className="truncate">Kurs: {student.student_data?.course || '-'}</span>
                  <span className="truncate">Guruh: {student.student_data?.group || '-'}</span>
                </div>
              </div>

              <button
                onClick={() => viewStudentDetails(student.id)}
                className="w-full flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs md:text-sm"
              >
                <Eye size={16} />
                <span>Portfolio ko'rish</span>
              </button>
              <button
                onClick={() => setShowAIAnalysis(student.id)}
                className="w-full mt-2 flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm"
              >
                <Brain size={16} />
                <span>AI Tahlil</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4 md:p-6 border-b border-red-100">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-red-800">Talaba Portfolio</h2>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-red-100 rounded-lg"
                  aria-label="Yopish"
                  title="Yopish"
                >
                  <X size={20} className="text-red-500" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6">
              {/* Student Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6 p-2.5 sm:p-3 md:p-4 bg-red-50 rounded-lg">
                <div className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-700 font-bold text-base sm:text-lg md:text-2xl">
                    {selectedStudent.student.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-xl font-bold text-red-800 truncate">
                    {selectedStudent.student.full_name}
                  </h3>
                  <p className="text-red-500 text-xs md:text-sm truncate">ID: {selectedStudent.student.student_id}</p>
                  <div className="flex flex-wrap gap-2 md:gap-4 mt-1 md:mt-2 text-xs md:text-sm text-red-600">
                    <span className="truncate">{selectedStudent.student.student_data?.faculty}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="truncate">{selectedStudent.student.student_data?.specialty}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{selectedStudent.student.student_data?.course}-kurs</span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-2 p-2 md:p-3 bg-red-50 rounded-lg min-w-0">
                  <Mail className="text-red-500 flex-shrink-0" size={16} />
                  <span className="text-red-700 text-xs md:text-sm truncate">{selectedStudent.student.email}</span>
                </div>
                {selectedStudent.student.student_data?.phone && (
                  <div className="flex items-center gap-2 p-2 md:p-3 bg-red-50 rounded-lg min-w-0">
                    <Phone className="text-red-500 flex-shrink-0" size={16} />
                    <span className="text-red-700 text-xs md:text-sm truncate">{selectedStudent.student.student_data.phone}</span>
                  </div>
                )}
              </div>

              {/* Portfolios */}
              <h4 className="font-semibold text-red-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                <FileText className="text-red-500" size={18} />
                Tasdiqlangan Portfoliolar ({selectedStudent.portfolios.length})
              </h4>

              {selectedStudent.portfolios.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-red-400 text-sm md:text-base">
                  Hozircha tasdiqlangan portfolio yo'q
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {selectedStudent.portfolios.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 md:p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-red-800 text-sm md:text-base truncate">{item.title}</h5>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <p className="text-red-500 text-xs md:text-sm">
                              {item.type === 'PROJECT' && '🚀 Loyiha'}
                              {item.type === 'CERTIFICATE' && '🏆 Sertifikat'}
                              {item.type === 'ASSIGNMENT' && '📝 Topshiriq'}
                            </p>
                            {item.category && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] md:text-xs whitespace-nowrap">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <BookmarkButton portfolioId={item.id} />
                          <span className="text-red-400 text-[10px] md:text-xs whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-red-600 text-xs md:text-sm mt-2 break-words">{item.description}</p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] md:text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-red-100">
                        <div className="flex items-center gap-1 text-gray-500 text-xs md:text-sm">
                          <Eye size={12} />
                          <span>{item.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600 text-xs md:text-sm">
                          <Star size={12} className="fill-yellow-400" />
                          <span>{item.rating_avg?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 text-xs md:text-sm">
                          <MessageCircle size={12} />
                          <span>{item.comment_count || 0}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="ml-auto flex gap-2">
                          {item.file_url && (
                            <a
                              href={`http://localhost:4000${item.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 md:p-2 bg-red-100 rounded-lg hover:bg-red-200 text-red-600"
                              title="Yuklab olish"
                            >
                              <Download size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedPortfolioForDetails(item)}
                            className="px-2 md:px-3 py-1 bg-red-600 text-white rounded-lg text-xs md:text-sm hover:bg-red-700"
                          >
                            Baholash
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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

      {/* Portfolio Detail Modal - Baholash va Izohlar */}
      {selectedPortfolioForDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-red-800">{selectedPortfolioForDetails.title}</h2>
                  <p className="text-red-500 text-sm">
                    {selectedPortfolioForDetails.type === 'PROJECT' && '🚀 Loyiha'}
                    {selectedPortfolioForDetails.type === 'CERTIFICATE' && '🏆 Sertifikat'}
                    {selectedPortfolioForDetails.type === 'ASSIGNMENT' && '📝 Topshiriq'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPortfolioForDetails(null)}
                  className="p-2 hover:bg-red-100 rounded-lg"
                  title="Yopish"
                >
                  <X size={20} className="text-red-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              {selectedPortfolioForDetails.description && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedPortfolioForDetails.description}</p>
                </div>
              )}

              {/* File download */}
              {selectedPortfolioForDetails.file_url && (
                <a
                  href={`http://localhost:4000${selectedPortfolioForDetails.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Download className="text-red-600" size={20} />
                  <span className="text-red-700 font-medium">
                    {selectedPortfolioForDetails.file_name || 'Faylni yuklab olish'}
                  </span>
                </a>
              )}

              {/* Rating Component */}
              <PortfolioRating
                portfolioId={selectedPortfolioForDetails.id}
                canRate={true}
                onRated={() => {
                  // Refresh student data
                  if (selectedStudent) {
                    viewStudentDetails(selectedStudent.student.id);
                  }
                }}
              />

              {/* Comments Component */}
              <PortfolioComments
                portfolioId={selectedPortfolioForDetails.id}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
