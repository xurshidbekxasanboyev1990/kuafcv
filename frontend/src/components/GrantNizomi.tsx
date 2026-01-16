'use client';

import { Award, BookOpen, Download, FileText, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface GrantNizomiProps {
  onClose: () => void;
  onAnalyze?: () => void;
}

export default function GrantNizomi({ onClose, onAnalyze }: GrantNizomiProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'download'>('view');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Award size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Universitet Iftixori</h2>
                <p className="text-amber-100 text-sm flex items-center gap-2 mt-1">
                  <BookOpen size={14} />
                  Grant nizomi va talablar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onAnalyze && (
                <button
                  onClick={onAnalyze}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Sparkles size={16} />
                  AI Tahlil
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="Yopish"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'view'
                  ? 'bg-white text-orange-600'
                  : 'bg-white/20 hover:bg-white/30'
                }`}
            >
              <span className="flex items-center gap-2">
                <FileText size={16} />
                Ko'rish
              </span>
            </button>
            <button
              onClick={() => setActiveTab('download')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'download'
                  ? 'bg-white text-orange-600'
                  : 'bg-white/20 hover:bg-white/30'
                }`}
            >
              <span className="flex items-center gap-2">
                <Download size={16} />
                Yuklab olish
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'view' ? (
            <div className="h-full">
              <iframe
                src="/grant-nizomi.pdf"
                className="w-full h-full min-h-[70vh]"
                title="Grant Nizomi"
              />
            </div>
          ) : (
            <div className="p-8">
              <div className="max-w-lg mx-auto space-y-4">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Download className="text-orange-500" size={36} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Hujjatlarni yuklab oling</h3>
                  <p className="text-gray-500 mt-2">Grant nizomi va talablar hujjatlari</p>
                </div>

                {/* PDF Download */}
                <a
                  href="/grant-nizomi.pdf"
                  download="Universitet_Iftixori_Grant_Nizomi.pdf"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 group-hover:text-red-600 transition-colors">
                      PDF format
                    </h4>
                    <p className="text-sm text-gray-500">Ko'rish va chop etish uchun</p>
                  </div>
                  <Download className="text-gray-400 group-hover:text-red-500 transition-colors" size={20} />
                </a>

                {/* DOCX Download */}
                <a
                  href="/grant-nizomi.docx"
                  download="Universitet_Iftixori_Grant_Nizomi.docx"
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      Word format
                    </h4>
                    <p className="text-sm text-gray-500">Tahrirlash uchun</p>
                  </div>
                  <Download className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
                </a>

                {/* Info */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Award className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-medium text-amber-800">Universitet Iftixori granti</h4>
                      <p className="text-sm text-amber-600 mt-1">
                        Bu grant talabalarning ilmiy va ijodiy yutuqlarini qo'llab-quvvatlash maqsadida tashkil etilgan.
                        Batafsil ma'lumot uchun hujjatni o'qing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
