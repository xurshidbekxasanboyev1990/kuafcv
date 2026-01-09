// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { ScoreGauge, SimpleBarChart, SimplePieChart } from '@/components/ui/SimpleCharts';
import {
  ArrowLeft,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  History,
  Image,
  PieChart,
  RefreshCw,
  Search,
  TrendingUp,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AnalysisRecord {
  id: string;
  file_name: string;
  file_type: string;
  analysis_type: string;
  conclusion: string;
  confidence_level: string;
  ai_probability_range: string;
  rhythm_score: number;
  personality_score: number;
  naturalness_score: number;
  processing_time_ms: number;
  document_type: string;
  text_length: number;
  created_at: string;
}

interface AnalysisStats {
  total_analyses: number;
  ai_detected_count: number;
  human_detected_count: number;
  mixed_count: number;
  avg_processing_time: number;
  most_common_document_type: string;
  today_count: number;
  week_count: number;
}

export default function AnalysisHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchHistory();
      fetchStats();
    }
  }, [user, authLoading]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/analysis-history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/ai/analysis-stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const exportHistory = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/ai/export-history?format=${format}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error('Export error');

      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tahlil_tarixi_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tahlil_tarixi_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
    setExporting(false);
  };

  // Filter and search
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.conclusion?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || item.analysis_type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getConclusionColor = (conclusion: string) => {
    if (!conclusion) return 'text-gray-600 bg-gray-100';
    if (conclusion.toLowerCase().includes('ai signallari yuqori')) {
      return 'text-red-600 bg-red-100';
    }
    if (conclusion.toLowerCase().includes('inson signallari yuqori')) {
      return 'text-green-600 bg-green-100';
    }
    return 'text-yellow-600 bg-yellow-100';
  };

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'yuqori': return 'bg-green-100 text-green-700';
      case "o'rta": return 'bg-yellow-100 text-yellow-700';
      case 'past': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  // Safe stats with default values
  const safeStats = {
    total_analyses: stats?.total_analyses || 0,
    human_detected_count: stats?.human_detected_count || 0,
    ai_detected_count: stats?.ai_detected_count || 0,
    mixed_count: stats?.mixed_count || 0,
    avg_processing_time: stats?.avg_processing_time || 0,
    today_count: stats?.today_count || 0,
    week_count: stats?.week_count || 0,
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white -m-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Orqaga"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Tahlil Tarixi</h1>
                <p className="text-red-200">Barcha lingvistik tahlil natijalari</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-800">{safeStats.total_analyses}</p>
                <p className="text-sm text-red-600">Jami tahlil</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{safeStats.human_detected_count}</p>
                <p className="text-sm text-gray-500">Inson matni</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{safeStats.ai_detected_count}</p>
                <p className="text-sm text-gray-500">AI matni</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{Math.round(safeStats.avg_processing_time)}ms</p>
                <p className="text-sm text-gray-500">O'rtacha vaqt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {showCharts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart - AI vs Human */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-red-600" />
                Tahlil natijalari taqsimoti
              </h3>
              {safeStats.total_analyses > 0 ? (
                <SimplePieChart
                  data={[
                    { label: 'Inson matni', value: safeStats.human_detected_count, color: '#10B981' },
                    { label: 'AI matni', value: safeStats.ai_detected_count, color: '#EF4444' },
                    { label: 'Aralash', value: safeStats.mixed_count, color: '#F59E0B' },
                  ]}
                  size={180}
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Hali tahlil yo'q</p>
                </div>
              )}
            </div>

            {/* Bar Chart - Score Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Vaqt bo'yicha tahlillar
              </h3>
              <SimpleBarChart
                data={[
                  { label: 'Bugun', value: safeStats.today_count, color: '#EF4444' },
                  { label: 'Bu hafta', value: safeStats.week_count, color: '#DC2626' },
                  { label: 'Jami', value: safeStats.total_analyses, color: '#B91C1C' },
                ]}
              />
            </div>

            {/* Average Scores */}
            {history.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  O'rtacha ball ko'rsatkichlari
                </h3>
                <div className="flex justify-around flex-wrap gap-4">
                  <ScoreGauge
                    score={Math.round(history.reduce((sum, h) => sum + (h.rhythm_score || 0), 0) / history.length) || 0}
                    label="Ritm"
                    color="#3B82F6"
                  />
                  <ScoreGauge
                    score={Math.round(history.reduce((sum, h) => sum + (h.personality_score || 0), 0) / history.length) || 0}
                    label="Shaxsiylik"
                    color="#EF4444"
                  />
                  <ScoreGauge
                    score={Math.round(history.reduce((sum, h) => sum + (h.naturalness_score || 0), 0) / history.length) || 0}
                    label="Tabiiylik"
                    color="#10B981"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle Charts Button */}
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="text-sm text-red-600 hover:text-red-800"
        >
          {showCharts ? '📊 Grafiklarni yashirish' : '📊 Grafiklarni ko\'rsatish'}
        </button>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Fayl nomi yoki xulosa bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm"
                aria-label="Tahlil turini tanlash"
              >
                <option value="all">Barchasi</option>
                <option value="linguistic_analysis">Lingvistik</option>
                <option value="file_analysis">Fayl tahlili</option>
              </select>
            </div>

            {/* Export */}
            <div className="flex gap-2">
              <button
                onClick={() => exportHistory('csv')}
                disabled={exporting}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => { fetchHistory(); fetchStats(); }}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="Yangilash"
                title="Yangilash"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Yuklanmoqda...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tahlil tarixi topilmadi</p>
              <p className="text-sm text-gray-400">Fayl tahlil qilganingizda bu yerda ko'rinadi</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Fayl</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Xulosa</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Ishonchlilik</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">AI ehtimoli</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Sana</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedHistory.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                              {record.file_type?.includes('image') ? (
                                <Image className="w-4 h-4 text-red-600" />
                              ) : (
                                <FileText className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm truncate max-w-[200px]">
                                {record.file_name || 'Nomsiz'}
                              </p>
                              <p className="text-xs text-gray-400">{record.text_length} belgi</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getConclusionColor(record.conclusion)}`}>
                            {record.conclusion || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${getConfidenceBadge(record.confidence_level)}`}>
                            {record.confidence_level || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-700">{record.ai_probability_range || '-'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-500">{formatDate(record.created_at)}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-500">{record.processing_time_ms}ms</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {filteredHistory.length} ta natijadan {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, filteredHistory.length)} ko'rsatilmoqda
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      aria-label="Oldingi sahifa"
                      title="Oldingi sahifa"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm ${currentPage === page
                            ? 'bg-red-600 text-white'
                            : 'hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      aria-label="Keyingi sahifa"
                      title="Keyingi sahifa"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">Tahlil tafsilotlari</h3>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Fayl nomi</p>
                  <p className="font-medium">{selectedRecord.file_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Xulosa</p>
                    <p className={`inline-block px-2 py-1 rounded-full text-sm ${getConclusionColor(selectedRecord.conclusion)}`}>
                      {selectedRecord.conclusion || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">AI ehtimoli</p>
                    <p className="font-medium">{selectedRecord.ai_probability_range}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{selectedRecord.rhythm_score}/10</p>
                    <p className="text-xs text-red-600">Ritm</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-700">{selectedRecord.personality_score}/10</p>
                    <p className="text-xs text-red-700">Shaxsiylik</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-500">{selectedRecord.naturalness_score}/10</p>
                    <p className="text-xs text-red-500">Tabiiylik</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hujjat turi</p>
                  <p className="font-medium">{selectedRecord.document_type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Matn uzunligi</p>
                  <p className="font-medium">{selectedRecord.text_length} belgi</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tahlil vaqti</p>
                  <p className="font-medium">{selectedRecord.processing_time_ms}ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sana</p>
                  <p className="font-medium">{formatDate(selectedRecord.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
