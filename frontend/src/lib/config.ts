/**
 * Application Configuration
 * Environment-based configuration for frontend application
 * 
 * This file centralizes all environment-dependent configuration
 * to avoid hardcoded URLs and enable easy deployment across environments.
 */

// API Base URL - defaults to localhost for development
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// WebSocket URL - defaults to localhost for development  
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

// Environment detection
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Feature flags
export const FEATURES = {
    enableWebSocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== 'false',
    enableAIFeatures: process.env.NEXT_PUBLIC_ENABLE_AI !== 'false',
    enableFileAnalysis: process.env.NEXT_PUBLIC_ENABLE_FILE_ANALYSIS !== 'false',
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
};

// File upload constraints
export const FILE_UPLOAD = {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 3,
    allowedDocTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    allowedMediaTypes: [
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
    ],
};

// API endpoints
export const API_ENDPOINTS = {
    auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        me: '/auth/me',
    },
    portfolio: {
        list: '/portfolio',
        create: '/portfolio',
        update: (id: string) => `/portfolio/${id}`,
        delete: (id: string) => `/portfolio/${id}`,
        categories: '/portfolio/categories',
    },
    admin: {
        users: '/admin/users',
        importStudents: '/admin/import-students',
    },
    registrar: {
        portfolios: '/registrar/portfolios',
        approve: (id: string) => `/registrar/approve/${id}`,
        reject: (id: string) => `/registrar/reject/${id}`,
        students: '/registrar/students',
    },
    employer: {
        students: '/employer/students',
        student: (id: string) => `/employer/students/${id}`,
    },
    notifications: {
        list: '/notifications',
        personal: '/notifications/personal',
        create: '/notifications',
        markRead: (id: string) => `/notifications/${id}/read`,
        markAllRead: '/notifications/read-all',
        markPersonalRead: (id: number) => `/notifications/personal/${id}/read`,
        markAllPersonalRead: '/notifications/personal/read-all',
    },
};

// Pagination defaults
export const PAGINATION = {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
};

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
    short: 60 * 1000, // 1 minute
    medium: 5 * 60 * 1000, // 5 minutes
    long: 30 * 60 * 1000, // 30 minutes
};

// Toast notification defaults
export const TOAST_DEFAULTS = {
    duration: 3000, // 3 seconds
    position: 'top-right' as const,
};

// Application metadata
export const APP_METADATA = {
    name: 'KUAFCV Portfolio System',
    shortName: 'KUAFCV',
    description: 'Talabalar portfolio boshqaruv tizimi',
    version: '1.0.0',
};
