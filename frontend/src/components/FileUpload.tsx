'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Check, File as FileIcon, FileText, Image as ImageIcon, Upload, Video, X } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

interface FileWithPreview extends File {
    preview?: string;
    progress?: number;
    status?: 'pending' | 'uploading' | 'complete' | 'error';
    error?: string;
}

interface FileUploadProps {
    files: FileWithPreview[];
    setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
    maxFiles?: number;
    maxSize?: number; // in bytes
    accept?: string;
    onError?: (error: string) => void;
    disabled?: boolean;
    className?: string;
}

// Allowed MIME types - xavfsiz formatlar
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

export default function FileUpload({
    files,
    setFiles,
    maxFiles = 3,
    maxSize = 50 * 1024 * 1024, // 50MB
    accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.bmp,.mp4,.webm,.mov,.mp3,.wav',
    onError,
    disabled = false,
    className,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validate file
    const validateFile = useCallback((file: File): string | null => {
        if (file.size > maxSize) {
            return `Fayl hajmi ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal ${(maxSize / 1024 / 1024).toFixed(0)}MB.`;
        }
        if (!ALLOWED_TYPES.includes(file.type) && file.type !== '') {
            return 'Fayl turi qo\'llab-quvvatlanmaydi';
        }
        if (file.name.includes('../') || file.name.includes('..\\')) {
            return 'Xavfli fayl nomi';
        }
        return null;
    }, [maxSize]);

    // Create preview for images
    const createPreview = useCallback((file: File): string | undefined => {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        }
        return undefined;
    }, []);

    // Handle file selection
    const handleFiles = useCallback((selectedFiles: FileList | File[]) => {
        const newFiles = Array.from(selectedFiles);

        if (files.length + newFiles.length > maxFiles) {
            onError?.(`Maksimal ${maxFiles} ta fayl yuklash mumkin`);
            return;
        }

        const validFiles: FileWithPreview[] = [];

        for (const file of newFiles) {
            const error = validateFile(file);
            if (error) {
                onError?.(error);
                continue;
            }

            const fileWithPreview: FileWithPreview = Object.assign(file, {
                preview: createPreview(file),
                progress: 0,
                status: 'pending' as const,
            });

            validFiles.push(fileWithPreview);
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
        }
    }, [files.length, maxFiles, validateFile, createPreview, setFiles, onError]);

    // Handle drag events
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }
    }, [disabled, handleFiles]);

    // Handle click to select
    const handleClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [handleFiles]);

    // Remove file
    const removeFile = useCallback((index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            // Revoke preview URL to prevent memory leak
            if (newFiles[index]?.preview) {
                URL.revokeObjectURL(newFiles[index].preview!);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    }, [setFiles]);

    // Get file icon
    const getFileIcon = (file: FileWithPreview) => {
        if (file.type.startsWith('image/')) {
            return <ImageIcon className="w-5 h-5 text-blue-500" />;
        }
        if (file.type.startsWith('video/')) {
            return <Video className="w-5 h-5 text-purple-500" />;
        }
        if (file.type.includes('pdf')) {
            return <FileText className="w-5 h-5 text-red-500" />;
        }
        return <FileIcon className="w-5 h-5 text-gray-500" />;
    };

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Drop Zone */}
            <div
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
                    isDragging && 'border-primary bg-primary/5 scale-[1.02]',
                    disabled && 'opacity-50 cursor-not-allowed',
                    !isDragging && !disabled && 'border-gray-200 hover:border-primary/50 hover:bg-gray-50',
                    files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled || files.length >= maxFiles}
                />

                <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                        'p-3 rounded-full transition-colors',
                        isDragging ? 'bg-primary/20' : 'bg-primary/10'
                    )}>
                        <Upload className={cn(
                            'w-6 h-6 transition-transform',
                            isDragging ? 'text-primary scale-110' : 'text-primary'
                        )} />
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            {isDragging ? (
                                'Fayllarni shu yerga tashlang'
                            ) : (
                                <>Fayllarni <span className="text-primary">tanlang</span> yoki shu yerga tashlang</>
                            )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PDF, Word, Excel, PowerPoint, rasm, video (maks. {(maxSize / 1024 / 1024).toFixed(0)}MB)
                        </p>
                    </div>

                    <p className="text-xs text-gray-400">
                        {files.length}/{maxFiles} fayl yuklangan
                    </p>
                </div>
            </div>

            {/* File List with Preview */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:bg-gray-100 transition-colors"
                        >
                            {/* Preview or Icon */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                                {file.preview ? (
                                    <img
                                        src={file.preview}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    getFileIcon(file)
                                )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatSize(file.size)}
                                </p>

                                {/* Progress Bar */}
                                {file.status === 'uploading' && file.progress !== undefined && (
                                    <div className="mt-1">
                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300 ease-out"
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{file.progress}%</p>
                                    </div>
                                )}

                                {/* Status */}
                                {file.status === 'complete' && (
                                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                        <Check className="w-3 h-3" /> Yuklandi
                                    </p>
                                )}
                                {file.status === 'error' && (
                                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3 h-3" /> {file.error || 'Xatolik'}
                                    </p>
                                )}
                            </div>

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Hook for uploading files with progress
export function useFileUpload() {
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    const uploadFile = useCallback(async (
        file: File,
        url: string,
        formData: FormData,
        token: string,
        onProgress?: (progress: number) => void
    ): Promise<Response> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                    onProgress?.(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(new Response(xhr.response, {
                        status: xhr.status,
                        statusText: xhr.statusText,
                    }));
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            xhr.open('POST', url);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    }, []);

    const resetProgress = useCallback(() => {
        setUploadProgress({});
    }, []);

    return { uploadProgress, uploadFile, resetProgress };
}
