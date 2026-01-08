// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  Upload,
  X,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { admin, User, FilterOptions } from '@/lib/api';

interface StudentsTabProps {
  setMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export default function StudentsTab({ setMessage }: StudentsTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [filterValues, setFilterValues] = useState({ faculty: '', specialty: '', course: '', group: '' });
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { role: 'STUDENT', page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (filterValues.faculty) params.faculty = filterValues.faculty;
      if (filterValues.specialty) params.specialty = filterValues.specialty;
      if (filterValues.course) params.course = filterValues.course;
      if (filterValues.group) params.group = filterValues.group;

      const response = await admin.getUsers(params);
      setUsers(response.students || []);
      setFilters(response.filters || null);
      setTotal(response.total || 0);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Xatolik' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, filterValues, page]);

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);

    try {
      const result = await admin.importStudents(importFile);
      setImportResult(result);
      fetchStudents();
    } catch (err) {
      setImportResult({ error: err instanceof Error ? err.message : 'Xatolik' });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu talabani o'chirishga ishonchingiz komilmi?")) return;
    try {
      await admin.deleteUser(id);
      setMessage({ type: 'success', text: "Talaba o'chirildi" });
      fetchStudents();
    } catch (err) {
      setMessage({ type: 'error', text: "O'chirishda xatolik" });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={16} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-red-800 w-full sm:w-64 text-sm"
            />
          </div>
          <button
            onClick={() => fetchStudents()}
            className="p-2 border border-red-200 rounded-lg hover:bg-red-50 flex-shrink-0"
          >
            <RefreshCw size={18} className="text-red-600" />
          </button>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm justify-center"
        >
          <Upload size={18} />
          <span>Excel Import</span>
        </button>
      </div>

      {/* Filters */}
      {filters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={filterValues.faculty}
            onChange={(e) => setFilterValues({ ...filterValues, faculty: e.target.value })}
            className="px-3 py-2 border border-red-200 rounded-lg text-red-700 bg-white text-sm"
          >
            <option value="">Barcha fakultetlar</option>
            {filters.faculties?.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            value={filterValues.course}
            onChange={(e) => setFilterValues({ ...filterValues, course: e.target.value })}
            className="px-3 py-2 border border-red-200 rounded-lg text-red-700 bg-white text-sm"
          >
            <option value="">Barcha kurslar</option>
            {filters.courses?.map((c) => (
              <option key={c} value={String(c)}>{c}-kurs</option>
            ))}
          </select>
          <select
            value={filterValues.group}
            onChange={(e) => setFilterValues({ ...filterValues, group: e.target.value })}
            className="px-3 py-2 border border-red-200 rounded-lg text-red-700 bg-white text-sm"
          >
            <option value="">Barcha guruhlar</option>
            {filters.groups?.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="text-red-600 text-sm">
        Jami: <strong>{total.toLocaleString()}</strong> ta talaba
      </div>

      {/* Table (Desktop + Mobile responsive) */}
      <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">Talaba</th>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">ID</th>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">Fakultet</th>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">Guruh</th>
                <th className="px-4 py-3 text-left text-red-700 font-medium text-sm">Kurs</th>
                <th className="px-4 py-3 text-right text-red-700 font-medium text-sm">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-500 text-sm">Yuklanmoqda...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-500 text-sm">Talaba topilmadi</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-red-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold text-sm">
                            {u.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-red-800 font-medium text-sm">{u.full_name}</p>
                          <p className="text-red-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-red-600 text-sm">{u.student_id || '-'}</td>
                    <td className="px-4 py-3 text-red-600 text-sm">{u.student_data?.faculty || '-'}</td>
                    <td className="px-4 py-3 text-red-600 text-sm">{u.student_data?.group || '-'}</td>
                    <td className="px-4 py-3 text-red-600 text-sm">{u.student_data?.course || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-red-100">
          {loading ? (
            <div className="px-4 py-8 text-center text-red-500 text-sm">Yuklanmoqda...</div>
          ) : users.length === 0 ? (
            <div className="px-4 py-8 text-center text-red-500 text-sm">Talaba topilmadi</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">{u.full_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 font-medium text-sm">{u.full_name}</p>
                    <p className="text-red-400 text-xs">{u.email}</p>
                    <p className="text-red-500 text-xs mt-1">ID: {u.student_id || '-'}</p>
                  </div>
                  <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-red-400">Fakultet</p>
                    <p className="text-red-700 font-medium">{u.student_data?.faculty || '-'}</p>
                  </div>
                  <div>
                    <p className="text-red-400">Guruh</p>
                    <p className="text-red-700 font-medium">{u.student_data?.group || '-'}</p>
                  </div>
                  <div>
                    <p className="text-red-400">Kurs</p>
                    <p className="text-red-700 font-medium">{u.student_data?.course || '-'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-red-100">
            <div className="text-red-600 text-sm">
              Sahifa {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} className="text-red-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <ChevronRight size={18} className="text-red-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-red-800">Talabalarni Import</h2>
              <button onClick={() => setShowImport(false)} className="p-2 hover:bg-red-100 rounded-lg">
                <X size={20} className="text-red-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  importFile ? 'border-green-300 bg-green-50' : 'border-red-200 hover:border-red-400'
                }`}
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {importFile ? (
                  <div>
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={28} />
                    <p className="text-green-700 font-medium text-sm">{importFile.name}</p>
                    <p className="text-green-600 text-xs">{(importFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-red-400 mb-2" size={28} />
                    <p className="text-red-600 text-sm">Excel fayl tanlang</p>
                    <p className="text-red-400 text-xs mt-1">.xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>

              {importResult && (
                <div className={`p-4 rounded-lg text-sm ${importResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {importResult.error ? (
                    <p>{importResult.error}</p>
                  ) : (
                    <div>
                      <p><strong>{importResult.imported}</strong> ta yangi qo'shildi</p>
                      <p><strong>{importResult.updated}</strong> ta yangilandi</p>
                      {importResult.skipped > 0 && <p><strong>{importResult.skipped}</strong> ta o'tkazib yuborildi</p>}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                >
                  Yopish
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 text-sm"
                >
                  {importing ? 'Import...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
