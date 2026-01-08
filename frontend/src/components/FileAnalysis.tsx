// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useState } from 'react';
import {
  Brain,
  FileText,
  Image,
  Award,
  Code,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
  Sparkles,
  Shield,
  FileSearch,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  User,
  Bot,
  ScanText,
  Save,
  History,
  Copy,
  Download,
  GitCompare,
  Wand2,
  Files,
} from 'lucide-react';

interface FileAnalysisProps {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  mimeType?: string;
  portfolioId?: string;
  onClose?: () => void;
}

interface AnalysisResult {
  analysis: string;
  file_type: string;
  file_name: string;
  check_ai: boolean;
  note?: string;
}

// Yangi professional API response interface
interface LinguisticAnalysis {
  overall_assessment: {
    conclusion: string;
    confidence_level: string;
    ai_probability_range: string;
  };
  ai_signals: Array<{
    signal: string;
    description: string;
    weight: string;
  }>;
  human_signals: Array<{
    signal: string;
    description: string;
    weight: string;
  }>;
  linguistic_analysis: {
    rhythm_score: number;
    personality_score: number;
    naturalness_score: number;
    notes: string;
  };
  document_specific_notes: string;
  recommendation: string;
  document_type?: string;
  text_length?: number;
  analysis_version?: string;
  raw_analysis?: string;
  parsing_failed?: boolean;
}

// Text comparison interface
interface ComparisonResult {
  similarity: {
    overall: number;
    lexical: number;
    grammatical: number;
    stylistic: number;
  };
  authorship: {
    same_author_probability: number;
    style_differences: string[];
    vocabulary_differences: string[];
  };
  ai_analysis: {
    text1_ai_probability: string;
    text2_ai_probability: string;
    more_ai_like: string;
  };
  conclusion: string;
  recommendations: string[];
}

// Improvement suggestions interface
interface ImprovementSuggestion {
  grammar: {
    errors: Array<{text: string; correction: string; explanation: string}>;
    score: number;
  };
  style: {
    suggestions: string[];
    score: number;
  };
  structure: {
    suggestions: string[];
    score: number;
  };
  vocabulary: {
    weak_words: string[];
    alternatives: Record<string, string[]>;
    score: number;
  };
  clarity: {
    unclear_parts: string[];
    suggestions: string[];
    score: number;
  };
  strengths: string[];
  overall_score: number;
  improved_version?: string;
}

export default function FileAnalysis({ fileUrl, fileName, fileType, mimeType, portfolioId, onClose }: FileAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [linguisticAnalysis, setLinguisticAnalysis] = useState<LinguisticAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'linguistic' | 'ocr' | 'compare' | 'improve'>('analysis');
  const [checkAI, setCheckAI] = useState(true);
  const [textForCheck, setTextForCheck] = useState('');
  const [documentType, setDocumentType] = useState<string>('general');
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  
  // Yangi state'lar - Compare va Improve uchun
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [improvementSuggestion, setImprovementSuggestion] = useState<ImprovementSuggestion | null>(null);
  const [textToImprove, setTextToImprove] = useState('');
  const [improveDocType, setImproveDocType] = useState('general');
  const [exporting, setExporting] = useState(false);

  // Determine file type for analysis
  const getFileTypeForAnalysis = () => {
    if (fileType) return fileType;
    if (!mimeType) return 'document';
    
    if (mimeType.startsWith('image/')) {
      if (fileName.toLowerCase().includes('sertifikat') || 
          fileName.toLowerCase().includes('certificate') ||
          fileName.toLowerCase().includes('diplom')) {
        return 'certificate';
      }
      return 'project';
    }
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word')) {
      if (fileName.toLowerCase().includes('maqola') || 
          fileName.toLowerCase().includes('article') ||
          fileName.toLowerCase().includes('tezis')) {
        return 'article';
      }
      return 'document';
    }
    return 'document';
  };

  const analyzeFile = async () => {
    setLoading(true);
    setError('');
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai/analyze-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          file_url: fileUrl,
          file_type: getFileTypeForAnalysis(),
          file_name: fileName,
          check_ai: checkAI,
        }),
      });

      if (!res.ok) throw new Error('Tahlil xatolik');
      
      const data = await res.json();
      setAnalysis(data);
      setProcessingTime(Date.now() - startTime);
    } catch (err) {
      setError('Fayl tahlilida xatolik yuz berdi');
    }
    setLoading(false);
  };

  const performLinguisticAnalysis = async () => {
    if (textForCheck.length < 50) {
      setError('Kamida 50 belgi kiriting');
      return;
    }
    
    setLoading(true);
    setError('');
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai/detect-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text: textForCheck,
          language: 'uz',
          document_type: documentType,
        }),
      });

      if (!res.ok) throw new Error('Tahlil xatolik');
      
      const data = await res.json();
      setLinguisticAnalysis(data);
      const elapsed = Date.now() - startTime;
      setProcessingTime(elapsed);
      
      // Avtomatik saqlash
      try {
        await fetch('/api/ai/save-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            portfolio_id: portfolioId,
            file_url: fileUrl,
            file_name: fileName || 'Matn tahlili',
            file_type: fileType || 'text',
            mime_type: mimeType,
            analysis_type: 'linguistic_analysis',
            analysis_result: data,
            ai_probability_range: data.overall_assessment?.ai_probability_range,
            confidence_level: data.overall_assessment?.confidence_level,
            conclusion: data.overall_assessment?.conclusion,
            rhythm_score: data.linguistic_analysis?.rhythm_score || 0,
            personality_score: data.linguistic_analysis?.personality_score || 0,
            naturalness_score: data.linguistic_analysis?.naturalness_score || 0,
            analyzed_text: textForCheck,
            document_type: documentType,
            processing_time_ms: elapsed,
          }),
        });
      } catch (saveErr) {
        console.error('Auto-save error:', saveErr);
      }
    } catch (err) {
      setError('Lingvistik tahlilda xatolik yuz berdi');
    }
    setLoading(false);
  };

  // OCR - Rasmdan matn o'qish
  const extractTextFromImage = async () => {
    setOcrLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          file_url: fileUrl,
          file_name: fileName,
          language: 'uz',
        }),
      });

      if (!res.ok) throw new Error('OCR xatolik');
      
      const data = await res.json();
      setExtractedText(data.extracted_text);
    } catch (err) {
      setError('Matn o\'qishda xatolik yuz berdi');
    }
    setOcrLoading(false);
  };

  // Natijani saqlash
  const saveAnalysisResult = async () => {
    if (!linguisticAnalysis) return;
    
    try {
      const res = await fetch('/api/ai/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          portfolio_id: portfolioId,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          mime_type: mimeType,
          analysis_type: 'linguistic_analysis',
          analysis_result: linguisticAnalysis,
          ai_probability_range: linguisticAnalysis.overall_assessment?.ai_probability_range,
          confidence_level: linguisticAnalysis.overall_assessment?.confidence_level,
          conclusion: linguisticAnalysis.overall_assessment?.conclusion,
          rhythm_score: linguisticAnalysis.linguistic_analysis?.rhythm_score,
          personality_score: linguisticAnalysis.linguistic_analysis?.personality_score,
          naturalness_score: linguisticAnalysis.linguistic_analysis?.naturalness_score,
          analyzed_text: textForCheck,
          document_type: documentType,
          processing_time_ms: processingTime,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError('Saqlashda xatolik');
    }
  };

  // Tarixni export qilish
  const exportHistory = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/ai/export-history?format=${format}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error('Export xatolik');
      
      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tahlil_tarixi.csv';
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
        a.download = 'tahlil_tarixi.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Export qilishda xatolik');
    }
    setExporting(false);
  };

  // Ikki matnni taqqoslash
  const compareTexts = async () => {
    if (text1.length < 50 || text2.length < 50) {
      setError('Har bir matn kamida 50 belgi bo\'lishi kerak');
      return;
    }
    
    setLoading(true);
    setError('');
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai/compare-texts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text1,
          text2,
          compare_type: 'similarity',
        }),
      });

      if (!res.ok) throw new Error('Taqqoslash xatolik');
      
      const data = await res.json();
      setComparisonResult(data);
      setProcessingTime(Date.now() - startTime);
    } catch (err) {
      setError('Matnlarni taqqoslashda xatolik yuz berdi');
    }
    setLoading(false);
  };

  // Matnni yaxshilash tavsiyalari
  const getImprovementSuggestions = async () => {
    if (textToImprove.length < 50) {
      setError('Matn kamida 50 belgi bo\'lishi kerak');
      return;
    }
    
    setLoading(true);
    setError('');
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai/suggest-improvements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          text: textToImprove,
          document_type: improveDocType,
          language: 'uz',
        }),
      });

      if (!res.ok) throw new Error('Tavsiya xatolik');
      
      const data = await res.json();
      setImprovementSuggestion(data);
      setProcessingTime(Date.now() - startTime);
    } catch (err) {
      setError('Tavsiyalar olishda xatolik yuz berdi');
    }
    setLoading(false);
  };

  // Matnni clipboard ga nusxalash
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'yuqori': return 'text-green-600 bg-green-100';
      case "o'rta": return 'text-yellow-600 bg-yellow-100';
      case 'past': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConclusionIcon = (conclusion: string) => {
    if (conclusion.toLowerCase().includes('ai signallari yuqori')) {
      return <Bot className="w-6 h-6 text-red-500" />;
    }
    if (conclusion.toLowerCase().includes('inson signallari yuqori')) {
      return <User className="w-6 h-6 text-green-500" />;
    }
    return <Minus className="w-6 h-6 text-yellow-500" />;
  };

  const getWeightBadge = (weight: string) => {
    switch (weight) {
      case 'kuchli': return 'bg-red-100 text-red-700';
      case "o'rta": return 'bg-yellow-100 text-yellow-700';
      case 'kuchsiz': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const renderScoreBar = (score: number, label: string, color: string) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{score}/10</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Professional Fayl Analitikasi</h2>
                <p className="text-purple-200 text-sm">{fileName}</p>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Yopish">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <FileSearch className="w-4 h-4 inline mr-2" />
              Fayl Tahlili
            </button>
            <button
              onClick={() => setActiveTab('linguistic')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'linguistic'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Lingvistik Analiz
            </button>
            {mimeType?.startsWith('image/') && (
              <button
                onClick={() => setActiveTab('ocr')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'ocr'
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <ScanText className="w-4 h-4 inline mr-2" />
                OCR
              </button>
            )}
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <GitCompare className="w-4 h-4 inline mr-2" />
              Taqqoslash
            </button>
            <button
              onClick={() => setActiveTab('improve')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'improve'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Wand2 className="w-4 h-4 inline mr-2" />
              Yaxshilash
            </button>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => exportHistory('json')}
              disabled={exporting}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => exportHistory('csv')}
              disabled={exporting}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-4">
              {/* File Preview */}
              {mimeType?.startsWith('image/') && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={fileUrl} alt={fileName} className="w-full max-h-64 object-contain bg-gray-50" />
                </div>
              )}

              {/* Analysis Options */}
              {!analysis && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">Tahlil turi</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'certificate', label: 'Sertifikat', icon: Award },
                        { type: 'document', label: 'Hujjat', icon: FileText },
                        { type: 'article', label: 'Maqola/Tezis', icon: FileText },
                        { type: 'project', label: 'Loyiha', icon: Code },
                      ].map(item => (
                        <button
                          key={item.type}
                          className="p-3 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
                        >
                          <item.icon className="w-5 h-5 text-purple-600 mb-1" />
                          <span className="text-sm font-medium text-purple-800">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAI}
                      onChange={(e) => setCheckAI(e.target.checked)}
                      className="w-5 h-5 text-yellow-600"
                    />
                    <div>
                      <span className="font-medium text-yellow-800">AI belgilarini tekshirish</span>
                      <p className="text-xs text-yellow-600">Matnda AI yozuv belgilarini qidirish</p>
                    </div>
                  </label>

                  <button
                    onClick={analyzeFile}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Tahlil qilinmoqda...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Tahlil qilish
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Analysis Result */}
              {analysis && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Tahlil yakunlandi</span>
                  </div>

                  {analysis.note && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                      <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-700">{analysis.note}</p>
                    </div>
                  )}

                  <div className="prose prose-purple max-w-none">
                    <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
                      {analysis.analysis}
                    </div>
                  </div>

                  <button
                    onClick={() => setAnalysis(null)}
                    className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50"
                  >
                    Qayta tahlil qilish
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'linguistic' && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Professional Lingvistik Analiz
                </h3>
                <p className="text-sm text-blue-600">
                  Bu AI-detektor emas. Til xususiyatlarini tahlil qilib, <strong>analitik xulosa</strong> beradi.
                  100% aniqlik kafolatlanmaydi.
                </p>
              </div>

              {!linguisticAnalysis && (
                <>
                  {/* Document Type Selection */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-3">Hujjat turi</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: 'general', label: 'Umumiy' },
                        { value: 'cv', label: 'CV/Rezyume' },
                        { value: 'essay', label: 'Esse' },
                        { value: 'article', label: 'Maqola/Tezis' },
                      ].map(item => (
                        <button
                          key={item.value}
                          onClick={() => setDocumentType(item.value)}
                          className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                            documentType === item.value
                              ? 'bg-purple-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    {documentType === 'cv' && (
                      <p className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                        ⚠️ CV/Rezyume uchun ishonchlilik past bo'ladi - rasmiy til talab qilinadi
                      </p>
                    )}
                  </div>

                  <textarea
                    value={textForCheck}
                    onChange={(e) => setTextForCheck(e.target.value)}
                    placeholder="Tahlil qilish uchun matnni shu yerga kiriting (kamida 50 belgi)..."
                    className="w-full h-48 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{textForCheck.length} belgi</span>
                    <span className={textForCheck.length >= 50 ? 'text-green-600' : 'text-red-500'}>
                      {textForCheck.length >= 50 ? '✓ Yetarli' : 'Kamida 50 belgi kerak'}
                    </span>
                  </div>

                  <button
                    onClick={performLinguisticAnalysis}
                    disabled={loading || textForCheck.length < 50}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Tahlil qilinmoqda...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        Lingvistik Tahlil
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Linguistic Analysis Result */}
              {linguisticAnalysis && (
                <div className="space-y-6">
                  {/* Main Assessment */}
                  {linguisticAnalysis.overall_assessment && (
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border">
                      <div className="flex items-center gap-4 mb-4">
                        {getConclusionIcon(linguisticAnalysis.overall_assessment.conclusion)}
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {linguisticAnalysis.overall_assessment.conclusion}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(linguisticAnalysis.overall_assessment.confidence_level)}`}>
                              Ishonchlilik: {linguisticAnalysis.overall_assessment.confidence_level}
                            </span>
                            <span className="text-sm text-gray-500">
                              Ehtimollik: {linguisticAnalysis.overall_assessment.ai_probability_range}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Linguistic Scores */}
                  {linguisticAnalysis.linguistic_analysis && (
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        Lingvistik Ko'rsatkichlar
                      </h4>
                      <div className="space-y-4">
                        {renderScoreBar(linguisticAnalysis.linguistic_analysis.rhythm_score, 'Til ritmi va oqimi', 'bg-purple-500')}
                        {renderScoreBar(linguisticAnalysis.linguistic_analysis.personality_score, 'Shaxsiylik signallari', 'bg-blue-500')}
                        {renderScoreBar(linguisticAnalysis.linguistic_analysis.naturalness_score, 'Tabiiylik darajasi', 'bg-green-500')}
                      </div>
                      {linguisticAnalysis.linguistic_analysis.notes && (
                        <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {linguisticAnalysis.linguistic_analysis.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Signals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Signals */}
                    {linguisticAnalysis.ai_signals && linguisticAnalysis.ai_signals.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                          <Bot className="w-5 h-5" />
                          AI Signallari
                        </h4>
                        <div className="space-y-3">
                          {linguisticAnalysis.ai_signals.map((signal, i) => (
                            <div key={i} className="bg-white p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-red-700 text-sm">{signal.signal}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${getWeightBadge(signal.weight)}`}>
                                  {signal.weight}
                                </span>
                              </div>
                              <p className="text-xs text-red-600">{signal.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Human Signals */}
                    {linguisticAnalysis.human_signals && linguisticAnalysis.human_signals.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Inson Signallari
                        </h4>
                        <div className="space-y-3">
                          {linguisticAnalysis.human_signals.map((signal, i) => (
                            <div key={i} className="bg-white p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-green-700 text-sm">{signal.signal}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${getWeightBadge(signal.weight)}`}>
                                  {signal.weight}
                                </span>
                              </div>
                              <p className="text-xs text-green-600">{signal.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Document Specific Notes */}
                  {linguisticAnalysis.document_specific_notes && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Hujjat turiga xos eslatmalar
                      </h4>
                      <p className="text-sm text-yellow-700">{linguisticAnalysis.document_specific_notes}</p>
                    </div>
                  )}

                  {/* Recommendation */}
                  {linguisticAnalysis.recommendation && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Tavsiya</h4>
                      <p className="text-sm text-blue-700">{linguisticAnalysis.recommendation}</p>
                    </div>
                  )}

                  {/* Raw Analysis (if parsing failed) */}
                  {linguisticAnalysis.raw_analysis && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Tahlil natijasi</h4>
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap">{linguisticAnalysis.raw_analysis}</pre>
                    </div>
                  )}

                  {/* Metadata & Actions */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="text-xs text-gray-400">
                      <span>Matn: {linguisticAnalysis.text_length} belgi</span>
                      <span className="mx-2">•</span>
                      <span>Vaqt: {processingTime}ms</span>
                      <span className="mx-2">•</span>
                      <span>v{linguisticAnalysis.analysis_version}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveAnalysisResult}
                        disabled={saved}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                          saved 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Saqlandi' : 'Saqlash'}
                      </button>
                      <button
                        onClick={() => { setLinguisticAnalysis(null); setTextForCheck(''); }}
                        className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm"
                      >
                        Qayta tahlil
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OCR Tab */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img src={fileUrl} alt={fileName} className="w-full max-h-64 object-contain bg-gray-50" />
              </div>

              <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                <h3 className="font-semibold text-cyan-800 mb-2 flex items-center gap-2">
                  <ScanText className="w-5 h-5" />
                  OCR - Rasmdan Matn O'qish
                </h3>
                <p className="text-sm text-cyan-600">
                  AI yordamida rasmdagi barcha yozuvlarni aniqlash va matn sifatida chiqarish
                </p>
              </div>

              {!extractedText && (
                <button
                  onClick={extractTextFromImage}
                  disabled={ocrLoading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Matn o'qilmoqda...
                    </>
                  ) : (
                    <>
                      <ScanText className="w-5 h-5" />
                      Matnni O'qish
                    </>
                  )}
                </button>
              )}

              {extractedText && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Matn topildi</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(extractedText)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-200"
                      >
                        <Copy className="w-4 h-4" />
                        Nusxalash
                      </button>
                      <button
                        onClick={() => {
                          setTextForCheck(extractedText);
                          setActiveTab('linguistic');
                        }}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-200"
                      >
                        <Shield className="w-4 h-4" />
                        Tahlil qilish
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {extractedText}
                    </pre>
                  </div>

                  <div className="text-xs text-gray-400">
                    {extractedText.length} belgi • {extractedText.split(/\s+/).length} so'z
                  </div>

                  <button
                    onClick={() => setExtractedText('')}
                    className="px-4 py-2 border border-cyan-300 text-cyan-700 rounded-lg hover:bg-cyan-50"
                  >
                    Qayta o'qish
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Compare Tab - Ikki matnni taqqoslash */}
          {activeTab === 'compare' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <GitCompare className="w-5 h-5" />
                  Ikki Matnni Taqqoslash
                </h3>
                <p className="text-sm text-blue-600">
                  Ikki matnning uslubiy o'xshashligini va mualliflik ehtimolini aniqlash
                </p>
              </div>

              {!comparisonResult && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birinchi matn</label>
                    <textarea
                      value={text1}
                      onChange={(e) => setText1(e.target.value)}
                      placeholder="Birinchi matnni kiriting (kamida 50 belgi)..."
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="text-xs text-gray-400">{text1.length} belgi</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ikkinchi matn</label>
                    <textarea
                      value={text2}
                      onChange={(e) => setText2(e.target.value)}
                      placeholder="Ikkinchi matnni kiriting (kamida 50 belgi)..."
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="text-xs text-gray-400">{text2.length} belgi</span>
                  </div>

                  <button
                    onClick={compareTexts}
                    disabled={loading || text1.length < 50 || text2.length < 50}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Taqqoslanmoqda...
                      </>
                    ) : (
                      <>
                        <GitCompare className="w-5 h-5" />
                        Taqqoslash
                      </>
                    )}
                  </button>
                </div>
              )}

              {comparisonResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Taqqoslash yakunlandi</span>
                  </div>

                  {/* Similarity Scores */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3">O'xshashlik darajasi</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Umumiy</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${comparisonResult.similarity?.overall || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{comparisonResult.similarity?.overall || 0}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Leksik</span>
                        <span className="text-sm font-medium">{comparisonResult.similarity?.lexical || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Grammatik</span>
                        <span className="text-sm font-medium">{comparisonResult.similarity?.grammatical || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Uslubiy</span>
                        <span className="text-sm font-medium">{comparisonResult.similarity?.stylistic || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Authorship Analysis */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-3">Mualliflik tahlili</h4>
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-700">
                        Bir muallif ehtimoli: <strong>{comparisonResult.authorship?.same_author_probability || 0}%</strong>
                      </span>
                    </div>
                    {comparisonResult.authorship?.style_differences?.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Uslub farqlari:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comparisonResult.authorship.style_differences.map((diff, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              {diff}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Analysis */}
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-3">AI tahlili</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">1-matn AI ehtimoli</span>
                        <p className="font-medium text-sm">{comparisonResult.ai_analysis?.text1_ai_probability || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">2-matn AI ehtimoli</span>
                        <p className="font-medium text-sm">{comparisonResult.ai_analysis?.text2_ai_probability || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Xulosa</h4>
                    <p className="text-sm text-gray-700">{comparisonResult.conclusion}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Vaqt: {processingTime}ms</span>
                    <button
                      onClick={() => { setComparisonResult(null); setText1(''); setText2(''); }}
                      className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
                    >
                      Qayta taqqoslash
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Improve Tab - Matnni yaxshilash */}
          {activeTab === 'improve' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Matnni Yaxshilash Tavsiyalari
                </h3>
                <p className="text-sm text-green-600">
                  AI yordamida matnni grammatik, uslubiy va strukturaviy jihatdan yaxshilash
                </p>
              </div>

              {!improvementSuggestion && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hujjat turi</label>
                    <select
                      value={improveDocType}
                      onChange={(e) => setImproveDocType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      aria-label="Hujjat turi"
                    >
                      <option value="general">Umumiy matn</option>
                      <option value="cv">CV / Rezyume</option>
                      <option value="essay">Esse</option>
                      <option value="article">Ilmiy maqola</option>
                      <option value="thesis">Tezis / Dissertatsiya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matn</label>
                    <textarea
                      value={textToImprove}
                      onChange={(e) => setTextToImprove(e.target.value)}
                      placeholder="Yaxshilash kerak bo'lgan matnni kiriting..."
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <span className="text-xs text-gray-400">{textToImprove.length} belgi</span>
                  </div>

                  <button
                    onClick={getImprovementSuggestions}
                    disabled={loading || textToImprove.length < 50}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Tahlil qilinmoqda...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Tavsiyalar olish
                      </>
                    )}
                  </button>
                </div>
              )}

              {improvementSuggestion && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Tahlil yakunlandi</span>
                  </div>

                  {/* Overall Score */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-800">Umumiy baho</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              (improvementSuggestion.overall_score || 0) >= 70 ? 'bg-green-500' :
                              (improvementSuggestion.overall_score || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${improvementSuggestion.overall_score || 0}%` }}
                          />
                        </div>
                        <span className="text-2xl font-bold text-gray-800">
                          {improvementSuggestion.overall_score || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  {improvementSuggestion.strengths?.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">💪 Kuchli tomonlar</h4>
                      <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                        {improvementSuggestion.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Grammar Errors */}
                  {improvementSuggestion.grammar?.errors?.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">
                        ✏️ Grammatik xatolar ({improvementSuggestion.grammar.score}/10)
                      </h4>
                      <div className="space-y-2">
                        {improvementSuggestion.grammar.errors.map((err, i) => (
                          <div key={i} className="text-sm p-2 bg-white rounded border border-red-100">
                            <span className="text-red-600 line-through">{err.text}</span>
                            <span className="mx-2">→</span>
                            <span className="text-green-600 font-medium">{err.correction}</span>
                            <p className="text-xs text-gray-500 mt-1">{err.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Style Suggestions */}
                  {improvementSuggestion.style?.suggestions?.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        🎨 Uslub ({improvementSuggestion.style.score}/10)
                      </h4>
                      <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        {improvementSuggestion.style.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Vocabulary */}
                  {improvementSuggestion.vocabulary?.weak_words?.length > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">
                        📚 So'z boyligi ({improvementSuggestion.vocabulary.score}/10)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {improvementSuggestion.vocabulary.weak_words.map((word, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improved Version */}
                  {improvementSuggestion.improved_version && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">📝 Yaxshilangan variant</h4>
                        <button
                          onClick={() => copyToClipboard(improvementSuggestion.improved_version || '')}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs flex items-center gap-1 hover:bg-gray-300"
                        >
                          <Copy className="w-3 h-3" />
                          Nusxalash
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {improvementSuggestion.improved_version}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Vaqt: {processingTime}ms</span>
                    <button
                      onClick={() => { setImprovementSuggestion(null); setTextToImprove(''); }}
                      className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
                    >
                      Qayta tahlil
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
