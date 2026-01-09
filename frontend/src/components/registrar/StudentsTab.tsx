'use client';

import { FilterOptions, registrar, User } from '@/lib/api';
import { getFileUrl } from '@/lib/config';
import {
    ChevronLeft,
    ChevronRight,
    Lock,
    RefreshCw,
    Search,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface StudentsTabProps {
    setMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

export default function RegistrarStudentsTab({ setMessage }: StudentsTabProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<FilterOptions | null>(null);
    const [filterValues, setFilterValues] = useState({ faculty: '', specialty: '', course: '', group: '' });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 50;

    // Password reset state
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { page: String(page), limit: String(limit) };
            if (search) params.search = search;
            if (filterValues.faculty) params.faculty = filterValues.faculty;
            if (filterValues.specialty) params.specialty = filterValues.specialty;
            if (filterValues.course) params.course = filterValues.course;
            if (filterValues.group) params.group = filterValues.group;

            const response = await registrar.getStudents(params);
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

    const openPasswordModal = (user: User) => {
        setSelectedUserForPassword(user);
        setNewPassword('');
        setPasswordModalOpen(true);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForPassword || !newPassword) return;

        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" });
            return;
        }

        setPasswordLoading(true);
        try {
            await registrar.changeStudentPassword(selectedUserForPassword.id, newPassword);
            setMessage({ type: 'success', text: "Parol muvaffaqiyatli o'zgartirildi" });
            setPasswordModalOpen(false);
            setSelectedUserForPassword(null);
            setNewPassword('');
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : "Parolni o'zgartirishda xatolik" });
        } finally {
            setPasswordLoading(false);
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
                                                {u.profile_image ? (
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-red-200">
                                                        <img
                                                            src={getFileUrl(u.profile_image)}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                        <span className="text-red-600 font-bold text-sm">
                                                            {u.full_name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
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
                                                    onClick={() => openPasswordModal(u)}
                                                    className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg"
                                                    title="Parolni o'zgartirish"
                                                >
                                                    <Lock size={16} />
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
                                    {u.profile_image ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-red-200">
                                            <img
                                                src={getFileUrl(u.profile_image)}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                            <span className="text-red-600 font-bold">{u.full_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-red-800 font-medium text-sm">{u.full_name}</p>
                                        <p className="text-red-400 text-xs">{u.email}</p>
                                        <p className="text-red-500 text-xs mt-1">ID: {u.student_id || '-'}</p>
                                    </div>
                                    <button onClick={() => openPasswordModal(u)} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg">
                                        <Lock size={16} />
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

            {/* Password Change Modal */}
            {passwordModalOpen && selectedUserForPassword && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handlePasswordChange} className="bg-white rounded-xl max-w-md w-full p-6 relative">
                        <button
                            type="button"
                            onClick={() => setPasswordModalOpen(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Parolni o'zgartirish</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Talaba: <b>{selectedUserForPassword.full_name}</b>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Yangi parol
                                </label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Yangi parol (min 8 ta belgi)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    minLength={8}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPasswordModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-70 flex items-center gap-2"
                                >
                                    {passwordLoading ? (
                                        <RefreshCw className="animate-spin" size={16} />
                                    ) : (
                                        <Lock size={16} />
                                    )}
                                    O'zgartirish
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
