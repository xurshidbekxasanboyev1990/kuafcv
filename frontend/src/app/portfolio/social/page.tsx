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
  Download,
  Eye,
  File,
  FileText,
  Heart,
  Loader2,
  Plus,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/textarea';

const CATEGORY = 'SOCIAL';
const CATEGORY_LABEL = 'Ijtimoiy va ko\'ngillilik';

export default function SocialPortfolioPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchPortfolios = async () => {
    try {
      setLoadingData(true);
      const data = await portfolio.getMy();
      const socialItems = data.filter((item: PortfolioItem) => item.category === CATEGORY);
      setItems(socialItems);
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPortfolios();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{CATEGORY_LABEL}</h1>
              <p className="text-muted-foreground">
                Ko'ngillilik, xayriya faoliyati, mentorlik va ijtimoiy loyihalar.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)} className="w-full md:w-auto gap-2">
            <Plus className="w-4 h-4" />
            Yangi Tajriba Qo'shish
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
          >
            {message.type === 'success' ? (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Grid Content */}
        <div className="grid grid-cols-1 gap-6">
          {loadingData ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-xl" />
              </div>
            ))
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <Heart className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Hozircha ma'lumot yo'q</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Siz hali hech qanday ijtimoiy faoliyat kiritmagansiz.
                </p>
                <Button variant="outline" onClick={() => setShowModal(true)}>
                  Boshlash
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id} className="group hover:shadow-md transition-all duration-200 flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold line-clamp-2" title={item.title}>
                          {item.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <StatusBadge status={item.approval_status || 'PENDING'} />
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded-md text-muted-foreground">
                        <Heart className="w-5 h-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4 flex flex-col">
                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-normal">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                      {item.description || "Tavsif mavjud emas"}
                    </p>

                    {/* Footer */}
                    <div className="pt-4 mt-auto border-t">
                      {item.files && item.files.length > 0 ? (
                        <div className="space-y-2">
                          {item.files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 bg-muted/50 p-2.5 rounded-md group-hover:bg-muted transition-colors">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-xs font-medium truncate">
                                  {file.name || file.file_name || 'Hujjat'}
                                </span>
                              </div>
                              <a
                                href={getFileUrl(file.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-background rounded-md text-primary transition-colors focus:ring-2 focus:ring-ring"
                                title="Faylni yuklab olish"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : item.file_url ? (
                        <div className="flex items-center justify-between gap-3 bg-muted/50 p-2.5 rounded-md group-hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate">
                              {item.file_name || 'Hujjat'}
                            </span>
                          </div>
                          <a
                            href={getFileUrl(item.file_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-background rounded-md text-primary transition-colors focus:ring-2 focus:ring-ring"
                            title="Faylni yuklab olish"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-muted/20 rounded-md border border-dashed text-center">
                          <span className="text-xs text-muted-foreground">Fayl biriktirilmagan</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-3 bg-gray-50 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowFilesModal(true);
                      }}
                      className="text-muted-foreground hover:text-primary w-full"
                    >
                      <Eye className="h-4 w-4 mr-2" /> Ko'rish
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <SocialPortfolioModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchPortfolios();
            setMessage({ type: 'success', text: 'Muvaffaqiyatli saqlandi!' });
            setTimeout(() => setMessage(null), 5000);
          }}
        />
      )}

      {showFilesModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowFilesModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedItem.approval_status} />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowFilesModal(false)} className="h-8 w-8">
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
                        <Button variant="outline" size="sm" asChild className="gap-2">
                          <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                            <Eye size={16} />
                            Ochish
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="gap-2">
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
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <a href={getFileUrl(selectedItem.file_url)} target="_blank" rel="noopener noreferrer">
                          <Eye size={16} />
                          Ochish
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="gap-2">
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

function SocialPortfolioModal({
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
    category: CATEGORY,
    tags: [] as string[],
  });
  
  interface FileWithPreview extends File {
    preview?: string;
  }
  
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const MAX_SIZE = 50 * 1024 * 1024;
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/bmp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
    ];

    if (file.size > MAX_SIZE) return `Fayl hajmi 50MB dan oshmasligi kerak.`;
    if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') return 'Fayl turi qo\'llab-quvvatlanmaydi';

    return null;
  };

  const createPreview = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  const handleFiles = (selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles);
    setError('');

    if (files.length + newFiles.length > 3) {
      setError('Maksimal 3 ta fayl yuklash mumkin');
      return;
    }

    const validFiles: FileWithPreview[] = [];
    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      const fileWithPreview = Object.assign(file, {
        preview: createPreview(file),
      });
      validFiles.push(fileWithPreview);
    }

    setFiles([...files, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const file = files[index];
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles(files.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;
    if (formData.tags.includes(trimmedTag)) {
      setError('Bu teg allaqachon mavjud');
      return;
    }
    if (formData.tags.length >= 10) {
      setError('Eng ko\'pi bilan 10 ta teg qo\'shish mumkin');
      return;
    }
    setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
    setTagInput('');
    setError('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((tag) => tag !== tagToRemove) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Sarlavha kiritish majburiy');
      return;
    }

    setLoading(true);
    try {
      await portfolio.create(formData, files);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-primary/20">
        <CardHeader className="border-b sticky top-0 bg-card z-10 flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <CardTitle>Ijtimoiy Faoliyat Qo'shish</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="after:content-['*'] after:ml-0.5 after:text-destructive">
                Sarlavha (Faoliyat nomi)
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masalan: Bolalar uyiga ko'ngillilik"
                maxLength={200}
                required
                className="focus-visible:ring-primary"
              />
              <p className="text-xs text-muted-foreground text-right">{formData.title.length}/200</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Tavsif (Batafsil ma'lumot)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Faoliyat maqsadi, ishtirokchilar va natijalar..."
                rows={5}
                maxLength={1000}
                className="resize-none focus-visible:ring-primary"
              />
              <p className="text-xs text-muted-foreground text-right">{formData.description.length}/1000</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Teglar</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Xayriya, Ko'ngillilik, Jamiyat..."
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="secondary">
                  Qo'shish
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/30 rounded-lg border border-dashed">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 group">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* File Upload with Drag & Drop */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Fayllar (Rasmlar yoki Sertifikatlar)
              </Label>

              <div
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative group transition-all duration-200 ${
                  isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-input hover:border-primary/50 bg-muted/5'
                } ${files.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => files.length < 3 && fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.bmp,.mp4,.webm,.mov,.mp3,.wav"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={files.length >= 3}
                />
                <div className={`p-3 rounded-full mb-3 transition-all ${isDragging ? 'bg-primary/20 scale-110' : 'bg-primary/10 group-hover:scale-110'}`}>
                  <Upload className={`w-6 h-6 text-primary ${isDragging ? 'animate-bounce' : ''}`} />
                </div>
                <p className="text-sm font-medium">
                  {isDragging ? (
                    <span className="text-primary">Fayllarni shu yerga tashlang</span>
                  ) : (
                    <>Fayllarni <span className="text-primary">tanlang</span> yoki shu yerga tashlang</>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, JPG, PNG (Maks 50MB)</p>
                <p className="text-xs text-muted-foreground mt-2">{files.length}/3 fayl yuklangan</p>
              </div>

              {files.length > 0 && (
                <div className="grid gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm group hover:bg-muted/30 transition-colors">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted/50 border flex items-center justify-center">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                        ) : file.type.startsWith('image/') ? (
                          <ImageIcon className="w-5 h-5 text-blue-500" />
                        ) : (
                          <File className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-6 border-t mt-6">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Bekor qilish
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Saqlash
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

