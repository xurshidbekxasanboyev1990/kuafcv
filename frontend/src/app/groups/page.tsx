'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import Filters from '@/components/Filters';
import { registrar, User, FilterOptions } from '@/lib/api';
import { Users, Eye, Phone, Mail, GraduationCap } from 'lucide-react';

export default function GroupsPage() {
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
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && (!user || !['ADMIN', 'REGISTRAR'].includes(user.role))) {
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

      const response = await registrar.getStudents(params);
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
    if (user && ['ADMIN', 'REGISTRAR'].includes(user.role)) {
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-800 flex items-center gap-3">
            <Users className="text-red-500" size={32} />
            Talabalar Kontingenti
          </h1>
          <p className="text-red-600 mt-1">Jami: {total} ta talaba</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-red-100 animate-pulse">
                <div className="h-32 bg-red-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-red-100">
            <Users className="mx-auto text-red-300 mb-4" size={48} />
            <p className="text-red-500">Talabalar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-lg">
                        {student.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">{student.full_name}</h3>
                      <p className="text-red-500 text-sm">ID: {student.student_id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                    title="Batafsil"
                  >
                    <Eye size={18} />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-red-600">
                    <GraduationCap size={16} className="text-red-400" />
                    <span>{student.student_data?.faculty || 'Fakultet ko\'rsatilmagan'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="text-red-400">📚</span>
                    <span>{student.student_data?.specialty || 'Mutaxassislik ko\'rsatilmagan'}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Kurs: {student.student_data?.course || '-'}</span>
                    <span>Guruh: {student.student_data?.group || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-red-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-red-800">Talaba ma'lumotlari</h2>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 hover:bg-red-100 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Basic Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-2xl">
                      {selectedStudent.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800">{selectedStudent.full_name}</h3>
                    <p className="text-red-500">ID: {selectedStudent.student_id}</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <Mail className="text-red-500" size={18} />
                    <span className="text-red-700">{selectedStudent.email}</span>
                  </div>
                  {selectedStudent.student_data?.phone && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <Phone className="text-red-500" size={18} />
                      <span className="text-red-700">{selectedStudent.student_data.phone}</span>
                    </div>
                  )}
                </div>

                {/* Academic Info */}
                <h4 className="font-semibold text-red-800 mb-3">Ta'lim ma'lumotlari</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Fakultet', value: selectedStudent.student_data?.faculty },
                    { label: 'Mutaxassislik', value: selectedStudent.student_data?.specialty },
                    { label: 'Kurs', value: selectedStudent.student_data?.course },
                    { label: 'Guruh', value: selectedStudent.student_data?.group },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-red-50 rounded-lg">
                      <p className="text-red-500 text-sm">{item.label}</p>
                      <p className="text-red-800 font-medium">{item.value || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
