// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { portfolio, PortfolioItem } from '@/lib/api';
import { getFileUrl } from '@/lib/config';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  File,
  FileText,
  GraduationCap,
  Plus,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const CATEGORY = 'ACADEMIC';
const CATEGORY_LABEL = 'Akademik faoliyat';
const CATEGORY_ICON = '🎓';

export default function AcademicPortfolioPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchPortfolios = async () => {
    setLoadingData(true);
    try {
      const data = await portfolio.getMy();
      setItems(data.filter(item => item.category === CATEGORY));
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
      default:
        return '📁 Boshqa';
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
    <MainLayout showMarquee={false}>
      <div className="p-4 md:p-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
            {message.text}
          </div>
        )}

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-red-800 flex items-center gap-2">
              <span className="text-3xl">{CATEGORY_ICON}</span>
              {CATEGORY_LABEL}
            </h1>
            <p className="text-red-600 mt-1">Jami: {items.length} ta</p>
            <p className="text-sm text-red-500 mt-2">
              Ilmiy maqolalar, tezislar, konferensiya ishtiroklar, grant loyihalar va boshqa akademik yutuqlar
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={20} />
            <span>Yangi qo'shish</span>
          </button>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-red-100">
            <GraduationCap className="mx-auto text-red-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-red-800 mb-2">Hozircha akademik portfolio yo'q</h3>
            <p className="text-red-600 mb-4">Birinchi akademik yutuqingizni qo'shing</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Portfolio qo'shish
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
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">{item.title}</h3>
                    <p className="text-red-500 text-sm">{getTypeLabel(item.type)}</p>
                  </div>
                  {getStatusBadge(item.approval_status)}
                </div>

                {item.description && (
                  <p className="text-red-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                )}

                {item.file_url && (
                  <div className="p-3 bg-red-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File size={24} className="text-red-400" />
                      <div>
                        <p className="text-red-700 text-sm font-medium">{item.file_name}</p>
                        <p className="text-red-400 text-xs">
                          {item.size_bytes ? `${(item.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                    </div>
                    <a
                      href={getFileUrl(item.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-red-100 rounded-lg hover:bg-red-200 text-red-600"
                      aria-label="Faylni yuklab olish"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AcademicPortfolioModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchPortfolios();
            setMessage({ type: 'success', text: 'Akademik portfolio qo\'shildi' });
            setTimeout(() => setMessage(null), 3000);
          }}
        />
      )}
    </MainLayout>
  );
}

// Academic Portfolio Modal
function AcademicPortfolioModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'DOCUMENT',
    title: '',
    description: '',
    category: CATEGORY,
    tags: [] as string[],
  });
  const [files, setFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Sarlavha majburiy');
      return;
    }

    setLoading(true);
    try {
      await portfolio.create(formData, files);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
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

  // File validation with comprehensive checks
  const validateFile = (selectedFile: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB limit for security and performance
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    // File size validation
    if (selectedFile.size > maxSize) {
      setError('Fayl hajmi 50MB dan oshmasligi kerak');
      return false;
    }

    // MIME type validation for security
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Faqat PDF, DOCX yoki XLSX formatdagi fayllar qabul qilinadi');
      return false;
    }

    // File name sanitization check
    const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (dangerousChars.test(selectedFile.name)) {
      setError('Fayl nomi noto\'g\'ri belgilar saqlaydi');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setError('');

    if (files.length + selectedFiles.length > 3) {
      setError('Maksimal 3 ta fayl yuklash mumkin');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      if (validateFile(file)) {
        validFiles.push(file);
      } else {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setFiles([...files, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto transform transition-all animate-slideUp">
        {/* Header with gradient accent */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">{CATEGORY_ICON}</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Akademik Portfolio</h2>
              <p className="text-sm text-gray-500 mt-0.5">Ilmiy yutuqlaringizni qo'shing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
            aria-label="Formani yopish"
          >
            <X size={22} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Error Alert with icon and animation */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 flex items-start gap-3 animate-shake">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600" aria-label="Xatoni yopish">
              <X size={18} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Academic Work Type Selection with enhanced UI */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={16} className="text-red-500" />
              Akademik ish turi
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 bg-white transition-all hover:border-gray-300"
              aria-label="Akademik ish turini tanlang"
            >
              <option value="DOCUMENT">📄 Ilmiy maqola/tezis</option>
              <option value="PUBLICATION">📚 Nashr etilgan ish</option>
              <option value="CERTIFICATE">🏆 Konferensiya sertifikati</option>
              <option value="PROJECT">🚀 Grant loyiha</option>
              <option value="AWARD">🥇 Ilmiy mukofot</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Akademik faoliyatingiz turini tanlang</p>
          </div>

          {/* Title Input with character count */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-red-500">*</span>
              Sarlavha
              <span className="ml-auto text-xs font-normal text-gray-400">
                {formData.title.length}/200
              </span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value.slice(0, 200) })}
              required
              maxLength={200}
              placeholder="Masalan: Machine Learning yordamida matn tahlili"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 placeholder-gray-400 transition-all hover:border-gray-300"
              aria-label="Ish sarlavhasi"
            />
            <p className="text-xs text-gray-500">To'liq va aniq sarlavha kiriting</p>
          </div>

          {/* Description Textarea with enhanced styling */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              Tavsif
              <span className="ml-auto text-xs font-normal text-gray-400">
                {formData.description.length}/1000
              </span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 1000) })}
              rows={4}
              maxLength={1000}
              placeholder="Ishingiz haqida qisqacha ma'lumot. Nimaga bag'ishlangan, qanday natijalar olindi..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 placeholder-gray-400 resize-none transition-all hover:border-gray-300"
              aria-label="Ish tavsifi"
            />
            <p className="text-xs text-gray-500">Batafsil tavsif berish tavsiya etiladi</p>
          </div>

          {/* File Upload with multiple files support */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Upload size={16} className="text-red-500" />
              Fayllar yuklash ({files.length}/3)
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={files.length >= 3}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Fayllar tanlash"
              />
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                      <File size={20} className="text-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 truncate">{file.name}</p>
                        <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                        aria-label="Faylni o'chirish"
                      >
                        <X size={16} className="text-green-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">PDF, DOCX yoki XLSX (maks. 3 ta, har biri 50MB)</p>
          </div>

          {/* Tags Input with visual chips */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Teglar</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Teg kiriting va Enter bosing..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-800 placeholder-gray-400 transition-all hover:border-gray-300"
                aria-label="Teg kiritish"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-medium transition-all active:scale-95"
                aria-label="Teg qo'shish"
              >
                Qo'shish
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-xl">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-900 transition-colors"
                      aria-label={`${tag} tegni o'chirish`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">Masalan: ilmiy-tadqiqot, AI, dasturlash</p>
          </div>

          {/* Action Buttons with enhanced styling */}
          <div className="flex gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all active:scale-95"
              aria-label="Bekor qilish"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-medium shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
              aria-label={loading ? 'Saqlanmoqda...' : "Qo'shish"}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Qo'shish
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

