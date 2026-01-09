// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import {
  BarChart3,
  Brain,
  Eye,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Search,
  Star,
  Trash2,
  Video,
  X,
  Download,
  File
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { useAuth } from '@/components/AuthProvider';
import MainLayout from '@/components/MainLayout';
import { portfolio, PortfolioItem } from '@/lib/api';
import { getFileUrl } from '@/lib/config';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, StatusBadge } from '@/components/ui/StatusBadge';
// Note: We're reusing existing specialized components for now, but wrapped in new layout
import AIAnalytics from '@/components/AIAnalytics';
import FileAnalysis from '@/components/FileAnalysis';

// Category labels
const categoryLabels: Record<string, string> = {
  'ACADEMIC': 'Akademik faoliyat',
  'LEADERSHIP': 'Tashkiliy va yetakchilik',
  'SOCIAL': 'Ijtimoiy va ko\'ngillilik',
  'PROJECTS': 'Loyihalar va tashabbuslar',
  'TECHNICAL': 'Raqamli va texnik tajriba',
  'CAREER': 'Karyera va professional',
  'INTERNATIONAL': 'Xalqaro va tillar',
  'AWARDS': 'Mukofotlar va yutuqlar',
};

function getCategoryLabel(category: string) {
  return categoryLabels[category] || category;
}

export default function PortfolioPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [allItems, setAllItems] = useState<PortfolioItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'PENDING'>('ALL');

  // AI & Analysis State
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState<{ url: string; name: string; type?: string; mimeType?: string } | null>(null);
  
  // Files Modal State
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchPortfolios = async () => {
    setLoadingData(true);
    try {
      const data = await portfolio.getMy();
      startTransition(() => {
        setAllItems(data);
      });
    } catch (err) {
      console.error("Failed to fetch portfolios", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      fetchPortfolios();
    }
  }, [user]);

  // Filter Logic
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesStatus = statusFilter !== 'ALL' ? item.approval_status === statusFilter : true;
      const matchesSearch = searchQuery
        ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [selectedCategory, statusFilter, searchQuery, allItems]);

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham bu yozuvni o'chirmoqchimisiz?")) return;
    try {
      await portfolio.delete(id);
      fetchPortfolios(); // Refresh list
    } catch (e) {
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon size={20} className="text-blue-500" />;
    if (mimeType?.startsWith('video/')) return <Video size={20} className="text-pink-500" />;
    return <FileText size={20} className="text-gray-500" />;
  };

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mening Portfoliom</h1>
            <p className="text-muted-foreground">Yutuqlaringizni boshqaring va tahlil qiling</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowAIAnalysis(true)} variant="outline" className="gap-2">
              <BarChart3 size={16} />
              AI Tahlil
            </Button>
            {/* Add New Button usually triggers a modal or redirects. keeping basic for now */}
            {/* Note: Sub-pages exist for specific adds, but general add might be useful */}
          </div>
        </div>

        {/* Filters Bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Qidirish..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ALL')}
              >
                Barchasi
              </Button>
              <Button
                variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('APPROVED')}
                className={statusFilter === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Tasdiqlangan
              </Button>
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING')}
                className={statusFilter === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                Kutilmoqda
              </Button>
              <Button
                variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('REJECTED')}
                className={statusFilter === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Rad etilgan
              </Button>
            </div>
          </div>
        </Card>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedCategory === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap"
          >
            Barcha Kategoriyalar
          </Button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className="whitespace-nowrap"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Grid Content */}
        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 w-full" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Portfolio topilmadi</h3>
            <p className="text-gray-500">Qidiruv so'rovingiz bo'yicha hech narsa topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow group">
                {/* Preview Image/Icon Area */}
                <div className="relative h-48 bg-gray-100 flex items-center justify-center border-b overflow-hidden">
                  {item.file_url ? (
                    item.mime_type?.startsWith('image/') ? (
                      <img
                        src={getFileUrl(item.file_url)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        {getFileIcon(item.mime_type)}
                        <span className="text-xs uppercase">{item.mime_type?.split('/').pop()}</span>
                      </div>
                    )
                  ) : (
                    <FileText className="h-12 w-12 text-gray-300" />
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={item.approval_status} />
                  </div>
                  {item.category && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs shadow-sm">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="flex-1 p-4">
                  <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {item.description || 'Tavsif yo\'q'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{item.view_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} />
                      <span>{(item.rating_avg || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle size={14} />
                      <span>{item.comment_count || 0}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-3 bg-gray-50 border-t flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowFilesModal(true);
                    }}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Eye className="h-4 w-4 mr-2" /> Ko'rish
                  </Button>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        setFileAnalysis({
                          url: getFileUrl(item.file_url || ''),
                          name: item.title,
                          type: item.mime_type || 'application/pdf',
                          mimeType: item.mime_type
                        });
                      }}
                      title="AI Tahlil"
                    >
                      <Brain size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI Analysis Overlay */}
      {showAIAnalysis && (
        <AIAnalytics onClose={() => setShowAIAnalysis(false)} />
      )}

      {/* File Analysis Overlay */}
      {fileAnalysis && (
        <FileAnalysis
          fileUrl={fileAnalysis.url}
          fileName={fileAnalysis.name}
          fileType={fileAnalysis.type || 'application/pdf'}
          mimeType={fileAnalysis.mimeType}
          onClose={() => setFileAnalysis(null)}
        />
      )}

      {/* Files Modal */}
      {showFilesModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowFilesModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{getCategoryLabel(selectedItem.category)}</Badge>
                  <StatusBadge status={selectedItem.approval_status} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilesModal(false)}
                className="h-8 w-8"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {selectedItem.description && (
                <p className="text-muted-foreground mb-6">{selectedItem.description}</p>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-lg mb-3">Fayllar ({selectedItem.files?.length || (selectedItem.file_url ? 1 : 0)})</h3>
                
                {selectedItem.files && selectedItem.files.length > 0 ? (
                  selectedItem.files.map((file, idx) => (
                    <div key={idx} className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors group">
                      <div className="flex items-center gap-4 overflow-hidden flex-1">
                        <div className="h-12 w-12 bg-background rounded-lg flex items-center justify-center border shrink-0">
                          <File size={24} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{file.name || file.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-2"
                        >
                          <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                            <Eye size={16} />
                            Ochish
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-2"
                        >
                          <a href={getFileUrl(file.url)} download>
                            <Download size={16} />
                            Yuklash
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : selectedItem.file_url ? (
                  <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors group">
                    <div className="flex items-center gap-4 overflow-hidden flex-1">
                      <div className="h-12 w-12 bg-background rounded-lg flex items-center justify-center border shrink-0">
                        <File size={24} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{selectedItem.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedItem.size_bytes ? `${(selectedItem.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a href={getFileUrl(selectedItem.file_url)} target="_blank" rel="noopener noreferrer">
                          <Eye size={16} />
                          Ochish
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a href={getFileUrl(selectedItem.file_url)} download>
                          <Download size={16} />
                          Yuklash
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Fayl topilmadi</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

