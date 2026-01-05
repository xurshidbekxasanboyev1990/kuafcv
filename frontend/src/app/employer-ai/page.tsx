'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Student {
  id: string;
  fullName?: string | null;
  email?: string | null;
  studentId?: string | null;
  faculty?: string | null;
  group?: string | null;
  course?: number | null;
  specialty?: string | null;
}

interface PortfolioData {
  portfolio: {
    fullName?: string;
    studentId?: string;
    email?: string;
  };
  analysis: {
    score: number;
    strengths: string[];
    improvements: string[];
    summary: string;
  };
}

export default function EmployerAIPage() {
  const { user } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Students list state
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  
  // Analysis state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);

  // Load students
  useEffect(() => {
    if (!token || !user || user.role !== 'EMPLOYER') return;
    
    const loadStudents = async () => {
      try {
        const res = await fetch(`${API_URL}/employer/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Backend returns {students: [...]} not just array
          const studentsList = Array.isArray(data) ? data : (data.students || []);
          setStudents(studentsList);
          setFilteredStudents(studentsList);
        }
      } catch (error) {
        // Error will be handled by error boundary
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [token, user]);

  // Apply filters
  useEffect(() => {
    let result = students;

    // Search by name, studentId, email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.fullName?.toLowerCase().includes(query) ||
        s.studentId?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
      );
    }

    // Filter by faculty
    if (selectedFaculty) {
      result = result.filter(s => s.faculty === selectedFaculty);
    }

    // Filter by group
    if (selectedGroup) {
      result = result.filter(s => s.group === selectedGroup);
    }

    // Filter by course
    if (selectedCourse) {
      result = result.filter(s => s.course?.toString() === selectedCourse);
    }

    // Filter by specialty
    if (selectedSpecialty) {
      result = result.filter(s => s.specialty === selectedSpecialty);
    }

    setFilteredStudents(result);
  }, [searchQuery, selectedFaculty, selectedGroup, selectedCourse, selectedSpecialty, students]);

  // Get unique values for filters
  const faculties = Array.from(new Set(students.map(s => s.faculty).filter(Boolean))) as string[];
  const groups = Array.from(new Set(students.map(s => s.group).filter(Boolean))) as string[];
  const courses = Array.from(new Set(students.map(s => s.course).filter(Boolean))) as number[];
  const specialties = Array.from(new Set(students.map(s => s.specialty).filter(Boolean))) as string[];

  // Analyze student portfolio
  const analyzeStudent = async (student: Student) => {
    setSelectedStudent(student);
    setAnalyzing(true);
    setPortfolioData(null);

    try {
      const res = await fetch(`${API_URL}/employer/students/${student.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPortfolioData(data);
      } else {
        alert('Portfolio tahlilida xatolik');
      }
    } catch (error) {
      // Error will be handled by error boundary
      alert('Server bilan bog\'lanishda xatolik');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!user || user.role !== 'EMPLOYER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 responsive-padding-y">
      <div className="responsive-container-xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
                🤖
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">AI Talaba Analitikasi</h1>
                <p className="text-purple-100 text-lg">Talabalarni tanlang va portfoliolarini tahlil qiling</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtrlar va Qidiruv
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-2">
              <label className="block text-sm font-medium text-red-700 mb-2">
                🔍 Qidiruv (Ism, ID, Email)
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Qidirish..."
                className="w-full px-4 py-2.5 rounded-lg border-2 border-red-200 bg-white text-red-800 placeholder-red-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Faculty Filter */}
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                🏛️ Fakultet
              </label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-red-200 bg-white text-red-800 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">Barchasi</option>
                {faculties.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Specialty Filter */}
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                📚 Mutaxassislik
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-red-200 bg-white text-red-800 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">Barchasi</option>
                {specialties.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                📖 Kurs
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-red-200 bg-white text-red-800 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">Barchasi</option>
                {courses.sort((a, b) => a - b).map(c => (
                  <option key={c} value={c.toString()}>{c}-kurs</option>
                ))}
              </select>
            </div>

            {/* Group Filter */}
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                👥 Guruh
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-red-200 bg-white text-red-800 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">Barchasi</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-red-700">
              Jami: <span className="font-bold text-red-600 text-lg">{filteredStudents.length}</span> talaba topildi
            </p>
            {(searchQuery || selectedFaculty || selectedGroup || selectedCourse || selectedSpecialty) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFaculty('');
                  setSelectedGroup('');
                  setSelectedCourse('');
                  setSelectedSpecialty('');
                }}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                ✖ Filtrlarni tozalash
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Students List */}
          <div className="bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
            <div className="p-6 border-b border-red-200">
              <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Talabalar Ro'yxati
              </h2>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-red-600">Yuklanmoqda...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-red-600">Talaba topilmadi</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => analyzeStudent(student)}
                      className={`p-4 hover:bg-red-50 cursor-pointer transition-all ${
                        selectedStudent?.id === student.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {student.fullName?.charAt(0) || student.email?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-red-800 truncate">
                            {student.fullName || 'Ism kiritilmagan'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <span className="font-mono">{student.studentId}</span>
                            {student.group && (
                              <>
                                <span>•</span>
                                <span>{student.group}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
            <div className="p-6 border-b border-red-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Tahlil Natijalari
              </h2>
            </div>

            <div className="p-6 max-h-[600px] overflow-y-auto">
              {!selectedStudent ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-red-600 text-lg">
                    Talabani tanlang va tahlil qiling
                  </p>
                </div>
              ) : analyzing ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-red-800 font-semibold text-lg">Tahlil qilinmoqda...</p>
                  <p className="text-red-600">Iltimos kuting</p>
                </div>
              ) : portfolioData ? (
                <div className="space-y-6">
                  {/* Student Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {portfolioData.portfolio.fullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-red-800">
                          {portfolioData.portfolio.fullName}
                        </h3>
                        <p className="text-red-600 font-mono">
                          {portfolioData.portfolio.studentId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-center bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border-2 border-purple-200">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 shadow-2xl mb-4">
                      <span className="text-5xl font-black text-white">
                        {portfolioData.analysis.score}%
                      </span>
                    </div>
                    <p className="text-xl font-bold text-red-800">
                      Portfolio To'liqlik Darajasi
                    </p>
                  </div>

                  {/* Summary */}
                  {portfolioData.analysis.summary && (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                      <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">📝</span> Umumiy Xulosa
                      </h4>
                      <p className="text-red-700 leading-relaxed">
                        {portfolioData.analysis.summary}
                      </p>
                    </div>
                  )}

                  {/* Strengths */}
                  {portfolioData.analysis.strengths && portfolioData.analysis.strengths.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">💪</span> Kuchli Tomonlar
                        <span className="ml-auto px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                          {portfolioData.analysis.strengths.length}
                        </span>
                      </h4>
                      <ul className="space-y-3">
                        {portfolioData.analysis.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                              ✓
                            </div>
                            <span className="text-red-700 leading-relaxed flex-1">
                              {strength}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {portfolioData.analysis.improvements && portfolioData.analysis.improvements.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                      <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎯</span> Yaxshilash Takliflari
                        <span className="ml-auto px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                          {portfolioData.analysis.improvements.length}
                        </span>
                      </h4>
                      <ul className="space-y-3">
                        {portfolioData.analysis.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="text-red-700 leading-relaxed flex-1">
                              {improvement}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-red-600">
                    Tahlil ma'lumotlari topilmadi
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

