/**
 * File Utilities
 * Helper functions for file handling and display
 */

import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Presentation,
  Sheet,
  Video as VideoIcon
} from 'lucide-react';

/**
 * Get appropriate icon for file based on MIME type
 */
export function getFileIcon(mimeType: string = '', size = 24) {
  const className = 'flex-shrink-0';

  // Images
  if (mimeType.startsWith('image/')) {
    return <ImageIcon size={size} className={`${className} text-blue-500`} />;
  }

  // Videos
  if (mimeType.startsWith('video/')) {
    return <VideoIcon size={size} className={`${className} text-purple-500`} />;
  }

  // PDFs
  if (mimeType.includes('pdf')) {
    return <FileText size={size} className={`${className} text-red-600`} />;
  }

  // Word documents
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText size={size} className={`${className} text-blue-600`} />;
  }

  // Excel spreadsheets
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return <Sheet size={size} className={`${className} text-green-600`} />;
  }

  // PowerPoint presentations
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return <Presentation size={size} className={`${className} text-orange-600`} />;
  }

  // Default
  return <FileIcon size={size} className={`${className} text-gray-400`} />;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Check if file is a document
 */
export function isDocumentFile(file: File): boolean {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  return docTypes.includes(file.type);
}

/**
 * Create a preview URL for file (if image)
 */
export function createFilePreviewUrl(file: File): string | null {
  if (isImageFile(file)) {
    return URL.createObjectURL(file);
  }
  return null;
}

/**
 * Revoke preview URL to prevent memory leaks
 */
export function revokeFilePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Get accept attribute value for file input
 * Faqat xavfsiz office va media formatlar qabul qilinadi
 */
export function getAcceptAttribute(fileTypes: 'document' | 'media' | 'all'): string {
  // Xavfsiz formatlar - JSON, XML, ZIP, RAR, SVG olib tashlandi
  const safeFormats = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.bmp,.mp4,.webm,.mov,.mp3,.wav';

  switch (fileTypes) {
    case 'document':
      return safeFormats;
    case 'media':
      return safeFormats;
    case 'all':
      return safeFormats;
    default:
      return safeFormats;
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalFilename);
  const nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.'));

  return `${sanitizeFilename(nameWithoutExt)}_${timestamp}_${random}.${extension}`;
}

/**
 * Validate multiple files
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateFiles(
  files: File[],
  options: {
    maxFiles?: number;
    maxSize?: number;
    allowedTypes?: string[];
  }
): FileValidationResult {
  const errors: string[] = [];
  const { maxFiles = 3, maxSize = 50 * 1024 * 1024, allowedTypes = [] } = options;

  if (files.length > maxFiles) {
    errors.push(`Maksimal ${maxFiles} ta fayl yuklash mumkin`);
  }

  files.forEach((file) => {
    if (!isValidFileSize(file, maxSize)) {
      errors.push(`${file.name}: Fayl hajmi ${formatFileSize(maxSize)} dan oshmasligi kerak`);
    }

    if (allowedTypes.length > 0 && !isValidFileType(file, allowedTypes)) {
      errors.push(`${file.name}: Ruxsat berilmagan fayl turi`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
