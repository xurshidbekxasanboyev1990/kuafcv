'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import MarqueeBanner from '@/components/MarqueeBanner';
import FileAnalysis from '@/components/FileAnalysis';
import { portfolio, PortfolioItem } from '@/lib/api';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Upload,
  File,
  Image,
  Video,
  Download,
  Brain,
  Sparkles,
  Eye,
  Star,
  MessageCircle,
  BarChart3,
} from 'lucide-react';
import AIAnalytics from '@/components/AIAnalytics';
import { PortfolioStatsCard } from '@/components/PortfolioFeatures';

export default function PortfolioPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState<{url: string; name: string; type?: string; mimeType?: string} | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchPortfolios = async () => {
    setLoadingData(true);
    try {
      const data = await portfolio.getMy();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchPortfolios();
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle size={14} />
            Tasdiqlangan
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle size={14} />
            Rad etilgan
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
            <Clock size={14} />
            Kutilmoqda
          </span>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PROJECT':
        return '🚀 Loyiha';
      case 'CERTIFICATE':
        return '🏆 Sertifikat';
      case 'DOCUMENT':
        return '📄 Hujjat';
      case 'MEDIA':
        return '🎬 Media';
      default:
        return '📁 Boshqa';
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File size={24} className="text-red-400" />;
    if (mimeType.startsWith('image/')) return <Image size={24} className="text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video size={24} className="text-purple-500" />;
    return <File size={24} className="text-red-400" />;
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
      {/* Marquee Banner */}
      <div className="ml-64">
        <MarqueeBanner userRole="STUDENT" />
      </div>
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-800 flex items-center gap-3">
              <FileText className="text-red-500" size={32} />
              Mening Portfolio
            </h1>
            <p className="text-red-600 mt-1">Jami: {items.length} ta</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAIAnalysis(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Brain size={20} />
              <span>AI Tahlil</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus size={20} />
              <span>Yangi qo'shish</span>
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
            <button 
              onClick={() => setMessage(null)} 
              className="ml-auto"
              aria-label="Xabarni yopish"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Portfolios */}
        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-red-100 animate-pulse">
                <div className="h-32 bg-red-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-red-100">
            <FileText className="mx-auto text-red-300 mb-4" size={48} />
            <p className="text-red-500 mb-4">Hozircha portfolio yo'q</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Birinchi portfolioni qo'shish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-red-800">{item.title}</h3>
                    <p className="text-red-500 text-sm">{getTypeLabel(item.type)}</p>
                  </div>
                  {getStatusBadge(item.approval_status)}
                </div>

                {item.description && (
                  <p className="text-red-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                )}

                {/* Fayl ko'rsatish */}
                {item.file_url && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(item.mime_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-red-700 text-sm font-medium truncate">{item.file_name}</p>
                        <p className="text-red-400 text-xs">
                          {item.size_bytes ? `${(item.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                      <a
                        href={`http://localhost:4000${item.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-red-100 rounded-lg hover:bg-red-200 text-red-600"
                        aria-label="Faylni yuklab olish"
                        title="Faylni yuklab olish"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                    {/* AI Fayl Tahlili tugmasi */}
                    <button
                      onClick={() => setFileAnalysis({
                        url: `http://localhost:4000${item.file_url}`,
                        name: item.file_name || item.title,
                        type: item.type,
                        mimeType: item.mime_type
                      })}
                      className="mt-2 w-full py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={16} />
                      AI bilan tahlil qilish
                    </button>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rejection reason */}
                {item.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <p className="text-red-700 text-sm">
                      <strong>Rad sababi:</strong> {item.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Portfolio Stats - mini version */}
                {item.approval_status === 'APPROVED' && (
                  <div className="flex items-center gap-4 mb-3 py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye size={14} />
                      <span className="text-sm">{item.view_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star size={14} className="fill-yellow-400" />
                      <span className="text-sm">{item.rating_avg?.toFixed(1) || '0.0'}</span>
                      <span className="text-xs text-gray-400">({item.rating_count || 0})</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <MessageCircle size={14} />
                      <span className="text-sm">{item.comment_count || 0}</span>
                    </div>
                    <button
                      onClick={() => setSelectedPortfolio(item)}
                      className="ml-auto text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                    >
                      <BarChart3 size={14} />
                      Batafsil
                    </button>
                  </div>
                )}

                {/* Date */}
                <p className="text-red-400 text-xs">
                  {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <PortfolioModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              setMessage({ type: 'success', text: 'Portfolio yaratildi' });
              fetchPortfolios();
            }}
          />
        )}

        {/* AI Analysis Modal */}
        {showAIAnalysis && (
          <AIAnalytics 
            onClose={() => setShowAIAnalysis(false)} 
            isModal={true} 
          />
        )}

        {/* File Analysis Modal */}
        {fileAnalysis && (
          <FileAnalysis
            fileUrl={fileAnalysis.url}
            fileName={fileAnalysis.name}
            fileType={fileAnalysis.type}
            mimeType={fileAnalysis.mimeType}
            onClose={() => setFileAnalysis(null)}
          />
        )}

        {/* Portfolio Stats Modal */}
        {selectedPortfolio && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
                  <BarChart3 className="text-red-600" />
                  {selectedPortfolio.title} - Statistika
                </h2>
                <button 
                  onClick={() => setSelectedPortfolio(null)} 
                  className="p-2 hover:bg-red-100 rounded-lg"
                  aria-label="Statistikani yopish"
                >
                  <X size={20} className="text-red-500" />
                </button>
              </div>
              <PortfolioStatsCard portfolioId={selectedPortfolio.id} isOwner={true} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Portfolio Modal
function PortfolioModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'PROJECT',
    title: '',
    description: '',
    tags: [] as string[],
  });
  const [file, setFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ruxsat berilgan fayl turlari
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  const allowedMediaTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
  ];

  const getAcceptedTypes = () => {
    if (formData.type === 'DOCUMENT' || formData.type === 'CERTIFICATE') {
      return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
    }
    return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mpeg,.webm,.mov,.mp3,.wav';
  };

  const validateFile = (selectedFile: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (selectedFile.size > maxSize) {
      setError('Fayl hajmi 50MB dan oshmasligi kerak');
      return false;
    }

    if (formData.type === 'DOCUMENT' || formData.type === 'CERTIFICATE') {
      if (!allowedDocTypes.includes(selectedFile.type)) {
        setError('Faqat PDF, DOCX, XLSX, PPTX formatdagi fayllar qabul qilinadi');
        return false;
      }
    } else {
      if (!allowedDocTypes.includes(selectedFile.type) && !allowedMediaTypes.includes(selectedFile.type)) {
        setError('Faqat ruxsat berilgan fayl turlari qabul qilinadi');
        return false;
      }
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setError('');
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Sarlavha kiritilishi shart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await portfolio.create(formData, file || undefined);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-red-800">Yangi portfolio</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-red-100 rounded-lg"
            aria-label="Formani yopish"
          >
            <X size={20} className="text-red-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Turi */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Turi</label>
            <select
              value={formData.type}
              onChange={(e) => {
                setFormData({ ...formData, type: e.target.value });
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-red-800 bg-white"
              aria-label="Portfolio turi"
            >
              <option value="PROJECT">🚀 Loyiha</option>
              <option value="CERTIFICATE">🏆 Sertifikat</option>
              <option value="DOCUMENT">📄 Hujjat</option>
              <option value="MEDIA">🎬 Media</option>
              <option value="OTHER">📁 Boshqa</option>
            </select>
          </div>

          {/* Sarlavha */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Sarlavha *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Portfolio sarlavhasi"
              className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-red-800"
            />
          </div>

          {/* Tavsif */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Tavsif</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Qisqacha tavsif"
              className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-red-800"
            />
          </div>

          {/* Fayl yuklash */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">
              Fayl yuklash
              <span className="text-red-400 font-normal ml-1">
                {formData.type === 'DOCUMENT' || formData.type === 'CERTIFICATE'
                  ? '(PDF, DOCX, XLSX, PPTX)'
                  : '(PDF, DOCX, JPEG, PNG, MP4...)'}
              </span>
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                file ? 'border-green-300 bg-green-50' : 'border-red-200 hover:border-red-400 hover:bg-red-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptedTypes()}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Fayl tanlash"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <div className="text-left">
                    <p className="text-green-700 font-medium">{file.name}</p>
                    <p className="text-green-600 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="p-1 hover:bg-green-200 rounded"
                    aria-label="Faylni olib tashlash"
                    title="Faylni olib tashlash"
                  >
                    <X size={18} className="text-green-600" />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <Upload className="mx-auto text-red-400 mb-2" size={32} />
                  <p className="text-red-600">Fayl tanlash uchun bosing</p>
                  <p className="text-red-400 text-xs mt-1">Max: 50MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Teglar */}
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">Teglar</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Teg qo'shish"
                className="flex-1 px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 text-red-800"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Qo'shish
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-red-50 text-red-600 rounded flex items-center gap-1 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

