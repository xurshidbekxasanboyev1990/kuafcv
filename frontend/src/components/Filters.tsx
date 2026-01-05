'use client';

import { FilterOptions } from '@/lib/api';
import { Search, X } from 'lucide-react';

interface FiltersProps {
  filters: FilterOptions;
  values: {
    search: string;
    faculty: string;
    specialty: string;
    course: string;
    group: string;
  };
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

export default function Filters({ filters, values, onChange, onClear }: FiltersProps) {
  const hasFilters = Object.values(values).some((v) => v !== '');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Qidiruv */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-red-700 mb-1">Qidiruv</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={18} />
            <input
              type="text"
              placeholder="Ism, ID, Email..."
              value={values.search}
              onChange={(e) => onChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-800 placeholder-red-300"
            />
          </div>
        </div>

        {/* Fakultet */}
        <div>
          <label className="block text-sm font-medium text-red-700 mb-1">Fakultet</label>
          <select
            value={values.faculty}
            onChange={(e) => onChange('faculty', e.target.value)}
            className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-800 bg-white"
          >
            <option value="">Barchasi</option>
            {filters.faculties.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Mutaxassislik */}
        <div>
          <label className="block text-sm font-medium text-red-700 mb-1">Mutaxassislik</label>
          <select
            value={values.specialty}
            onChange={(e) => onChange('specialty', e.target.value)}
            className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-800 bg-white"
          >
            <option value="">Barchasi</option>
            {filters.specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Kurs */}
        <div>
          <label className="block text-sm font-medium text-red-700 mb-1">Kurs</label>
          <select
            value={values.course}
            onChange={(e) => onChange('course', e.target.value)}
            className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-800 bg-white"
          >
            <option value="">Barchasi</option>
            {filters.courses.map((c) => (
              <option key={c} value={c.toString()}>{c}-kurs</option>
            ))}
          </select>
        </div>

        {/* Guruh */}
        <div>
          <label className="block text-sm font-medium text-red-700 mb-1">Guruh</label>
          <select
            value={values.group}
            onChange={(e) => onChange('group', e.target.value)}
            className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-800 bg-white"
          >
            <option value="">Barchasi</option>
            {filters.groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tozalash tugmasi */}
      {hasFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={18} />
            <span>Filtrlarni tozalash</span>
          </button>
        </div>
      )}
    </div>
  );
}
