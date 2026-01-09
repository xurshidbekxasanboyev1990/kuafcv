// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { getFileUrl } from '@/lib/config';
import {
  AlertCircle,
  Award,
  BarChart3,
  Brain,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  User,
  X
} from 'lucide-react';
import { useState } from 'react';

interface StudentInfo {
  id: string;
  full_name: string;
  student_id: string;
  faculty: string;
  specialty: string;
  course: number;
  group: string;
  profile_image?: string | null;
}

interface AnalysisResult {
  student: StudentInfo;
  portfolio_count: number;
  analysis: string;
}

interface AIAnalyticsProps {
  studentId?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function AIAnalytics({ studentId, onClose, isModal = false }: AIAnalyticsProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [inputStudentId, setInputStudentId] = useState(studentId || '');

  const analyzePortfolio = async (targetId?: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/analyze-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: targetId || inputStudentId || undefined }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Tahlil qilishda xatolik');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze if studentId provided
  useState(() => {
    if (studentId) {
      analyzePortfolio(studentId);
    }
  });

  const parseAnalysis = (text: string) => {
    const sections: { title: string; content: string; icon: React.ReactNode; color: string }[] = [];

    // Extract sections
    const kuchliMatch = text.match(/KUCHLI TOMONLAR[:\s]*([\s\S]*?)(?=RIVOJLANTIRISH|TAVSIYALAR|UMUMIY|$)/i);
    const rivojMatch = text.match(/RIVOJLANTIRISH[^:]*[:\s]*([\s\S]*?)(?=TAVSIYALAR|UMUMIY|$)/i);
    const tavsiyaMatch = text.match(/TAVSIYALAR[:\s]*([\s\S]*?)(?=UMUMIY|$)/i);
    const balMatch = text.match(/UMUMIY BAL[:\s]*([\s\S]*?)$/i);

    if (kuchliMatch) {
      sections.push({
        title: 'Kuchli tomonlar',
        content: kuchliMatch[1].trim(),
        icon: <Star className="text-yellow-500" size={20} />,
        color: 'bg-yellow-50 border-yellow-200',
      });
    }

    if (rivojMatch) {
      sections.push({
        title: 'Rivojlantirish kerak',
        content: rivojMatch[1].trim(),
        icon: <Target className="text-orange-500" size={20} />,
        color: 'bg-orange-50 border-orange-200',
      });
    }

    if (tavsiyaMatch) {
      sections.push({
        title: 'Tavsiyalar',
        content: tavsiyaMatch[1].trim(),
        icon: <Lightbulb className="text-blue-500" size={20} />,
        color: 'bg-blue-50 border-blue-200',
      });
    }

    if (balMatch) {
      sections.push({
        title: 'Umumiy baho',
        content: balMatch[1].trim(),
        icon: <Award className="text-green-500" size={20} />,
        color: 'bg-green-50 border-green-200',
      });
    }

    // If no sections found, return full text
    if (sections.length === 0) {
      sections.push({
        title: 'Tahlil natijasi',
        content: text,
        icon: <Brain className="text-purple-500" size={20} />,
        color: 'bg-purple-50 border-purple-200',
      });
    }

    return sections;
  };

  const extractScore = (text: string): number | null => {
    const scoreMatch = text.match(/(\d{1,3})\s*(?:ball?|\/100|%)/i);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      return score <= 100 ? score : null;
    }
    return null;
  };

  const content = (
    <div className={`${isModal ? '' : 'bg-white rounded-2xl border border-gray-200 shadow-lg'} overflow-hidden`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Portfolio Tahlili</h2>
              <p className="text-purple-200 text-sm flex items-center gap-1">
                <Sparkles size={14} />
                GPT-4o model bilan
              </p>
            </div>
          </div>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Yopish"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Search Input */}
        {!studentId && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={inputStudentId}
              onChange={(e) => setInputStudentId(e.target.value)}
              placeholder="Talaba ID kiriting (bo'sh qoldiring o'zingiz uchun)"
              className="flex-1 px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-purple-200 focus:bg-white/30 focus:outline-none"
            />
            <button
              onClick={() => analyzePortfolio()}
              disabled={loading}
              className="px-6 py-2.5 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <BarChart3 size={18} />
              )}
              Tahlil
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="relative inline-flex">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Brain size={32} className="text-purple-600" />
              </div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-gray-600 font-medium">AI tahlil qilmoqda...</p>
            <p className="text-sm text-gray-400 mt-1">Bu bir necha soniya davom etishi mumkin</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-medium">Xatolik yuz berdi</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={() => analyzePortfolio()}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Qayta urinish
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-4">
                {result.student.profile_image ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-purple-200">
                    <img
                      src={getFileUrl(result.student.profile_image)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                    {result.student.full_name?.charAt(0) || 'T'}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{result.student.full_name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      ID: {result.student.student_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap size={14} />
                      {result.student.course}-kurs, {result.student.group}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.student.faculty} • {result.student.specialty}
                  </p>
                </div>
                <div className="text-center px-4 py-2 bg-white rounded-xl border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600">{result.portfolio_count}</div>
                  <div className="text-xs text-gray-500">Portfolio</div>
                </div>
              </div>
            </div>

            {/* Score Badge */}
            {extractScore(result.analysis) && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-lg">
                  <Award size={24} />
                  <div>
                    <div className="text-3xl font-bold">{extractScore(result.analysis)}</div>
                    <div className="text-xs text-green-100">100 balldan</div>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Sections */}
            <div className="space-y-4">
              {parseAnalysis(result.analysis).map((section, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 ${section.color}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {section.icon}
                    <h4 className="font-semibold text-gray-800">{section.title}</h4>
                  </div>
                  <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => analyzePortfolio()}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Brain size={18} />
                Qayta tahlil
              </button>
              <button
                onClick={() => {
                  const text = `Talaba: ${result.student.full_name}\n\n${result.analysis}`;
                  navigator.clipboard.writeText(text);
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <FileText size={18} />
                Nusxa olish
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !result && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="text-purple-600" size={36} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Portfolio tahlilini boshlang</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              AI talabaning barcha tasdiqlangan portfoliolarini tahlil qilib, kuchli tomonlari va rivojlantirish kerak bo'lgan sohalarni aniqlaydi.
            </p>
            {!studentId && (
              <button
                onClick={() => analyzePortfolio()}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={18} />
                  O'z portfoliomni tahlil qilish
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
