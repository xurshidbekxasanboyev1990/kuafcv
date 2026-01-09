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
  Plus,
  Rocket,
  Upload,
  X
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

const CATEGORY = 'PROJECTS';
const CATEGORY_LABEL = 'Loyihalar va tashabbuslar';
const CATEGORY_ICON = '🚀';

export default function ProjectsPortfolioPage() {
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <MainLayout showMarquee={false}>
      <div className="p-4 md:p-8 space-y-6">
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
            {message.type === 'error' && <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <span className="text-4xl">{CATEGORY_ICON}</span>
              {CATEGORY_LABEL}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Shaxsiy va jamoa loyihalari, startup tashabbuslar, innovatsion g'oyalar.
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            size="lg"
            className="gap-2 shadow-sm"
          >
            <Plus size={20} />
            Yangi qo'shish
          </Button>
        </div>

        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Rocket className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hozircha loyihalar yo'q</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Birinchi loyihangizni qo'shing va mahoratingizni namoyish eting.
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus size={18} className="mr-2" />
                Portfolio qo'shish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="group hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <StatusBadge status={item.approval_status} />
                  </div>
                  <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.description && (
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {/* Display all files */}
                  {item.files && item.files.length > 0 ? (
                    <div className="space-y-2">
                      {item.files.map((file, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between group-hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 bg-background rounded flex items-center justify-center border shrink-0">
                              <File size={16} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{file.name || file.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                              </p>
                            </div>
                          </div>
                          <a
                            href={getFileUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors focus:ring-2 ring-primary/20 outline-none"
                            aria-label="Faylni yuklab olish"
                          >
                            <Download size={18} />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : item.file_url && (
                    <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between group-hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-8 w-8 bg-background rounded flex items-center justify-center border shrink-0">
                          <File size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.size_bytes ? `${(item.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </div>
                      </div>
                      <a
                        href={getFileUrl(item.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors focus:ring-2 ring-primary/20 outline-none"
                        aria-label="Faylni yuklab olish"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-wider rounded border border-primary/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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

      {showModal && (
        <ProjectsPortfolioModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchPortfolios();
            setMessage({ type: 'success', text: 'Loyiha muvaffaqiyatli qo\'shildi' });
            setTimeout(() => setMessage(null), 3000);
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

// Projects Portfolio Modal
function ProjectsPortfolioModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    type: 'PROJECT',
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

  const validateFile = (file: File): string | null => {
    const MAX_SIZE = 50 * 1024 * 1024;
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (file.size > MAX_SIZE) return `Fayl hajmi ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal 50MB.`;
    // Skip type check for now if needed or add more types, but good to have
    // if (!ALLOWED_TYPES.includes(file.type)) return 'Fayl turi qo\'llab-quvvatlanmaydi.';

    if (file.name.includes('../') || file.name.includes('..\\')) return 'Xavfli fayl nomi.';
    return null;
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
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      validFiles.push(file);
    }

    setFiles([...files, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (!trimmedTag) return;
    if (formData.tags.includes(trimmedTag)) { setError('Bu teg allaqachon qo\'shilgan'); return; }
    if (formData.tags.length >= 10) { setError('Maksimal 10 ta teg'); return; }
    if (trimmedTag.length > 30) { setError('Teg 30 belgidan oshmasin'); return; }
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
    if (!formData.title.trim()) { setError('Sarlavha kiritish majburiy'); return; }
    if (formData.title.length > 200) { setError('Sarlavha 200 belgidan oshmasin'); return; }
    if (formData.description.length > 1000) { setError('Tavsif 1000 belgidan oshmasin'); return; }
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

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xl">{CATEGORY_ICON}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Loyiha Portfolio</h2>
                <p className="text-sm text-muted-foreground">Shaxsiy yoki jamoa loyihasi</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X size={18} />
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Sarlavha <span className="text-destructive">*</span></Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value.slice(0, 200) })}
                required
                maxLength={200}
                placeholder="Masalan: E-commerce platformasi"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Loyihangiz nomini kiriting</span>
                <span>{formData.title.length}/200</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tavsif</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 1000) })}
                rows={4}
                maxLength={1000}
                placeholder="Loyiha maqsadi, ishlatilgan texnologiyalar, natijalar..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
              <div className="text-right text-xs text-muted-foreground">
                {formData.description.length}/1000
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Upload size={16} />
                Fayllar ({files.length}/3)
              </Label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                  onChange={handleFileChange}
                  disabled={files.length >= 3}
                  className="hidden"
                />
                <div className="bg-primary/5 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                  <Upload size={20} className="text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">Fayllarni yuklash uchun bosing</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, Img, ZIP (maks 50MB)</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={18} className="text-primary shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                  placeholder="Masalan: React"
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} variant="secondary">
                  Qo'shish
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="pl-2 pr-1 py-1 flex gap-1 items-center">
                      #{tag}
                      <X
                        size={14}
                        className="cursor-pointer hover:text-destructive ml-1"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

