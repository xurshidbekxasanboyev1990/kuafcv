// API helper functions

const API_URL = '/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Token qo'shish
  const storedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (storedToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${storedToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // 401 - Token yaroqsiz
  if (response.status === 401) {
    // Avtomatik redirect qilmaslik - AuthProvider o'zi boshqaradi
    throw new Error('Avtorizatsiya muddati tugagan');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Xatolik yuz berdi');
  }

  return data;
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password
      }),
    }),

  me: () => apiFetch<User>('/auth/me'),

  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
};

// Admin
export const admin = {
  getUsers: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<StudentsResponse>(`/admin/users${query}`);
  },

  createUser: (data: CreateUserData) =>
    apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(data) }),

  deleteUser: (id: string) =>
    apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),

  importStudents: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/import-students`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        throw new Error(data.message || 'Import xatoligi');
      }
      return data;
    } catch (e) {
      if (!response.ok) {
        throw new Error(`Server xatoligi: ${response.status}`);
      }
      throw new Error('Server javobini o\'qishda xatolik');
    }
  },
};

// Portfolio
export const portfolio = {
  getMy: () => apiFetch<PortfolioItem[]>('/portfolio'),

  create: async (data: CreatePortfolioData, file?: File) => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.tags && data.tags.length > 0) {
      formData.append('tags', JSON.stringify(data.tags));
    }
    if (file) {
      formData.append('file', file);
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/portfolio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Portfolio yaratishda xatolik');
    }
    return result;
  },

  update: (id: string, data: CreatePortfolioData) =>
    apiFetch(`/portfolio/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/portfolio/${id}`, { method: 'DELETE' }),
};

// Registrar
export const registrar = {
  getPortfolios: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<PortfoliosResponse>(`/registrar/portfolios${query}`);
  },

  approve: (id: string) =>
    apiFetch(`/registrar/approve/${id}`, { method: 'POST' }),

  reject: (id: string, reason?: string) =>
    apiFetch(`/registrar/reject/${id}`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: reason }),
    }),

  getStudents: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<StudentsResponse>(`/registrar/students${query}`);
  },
};

// Employer
export const employer = {
  getStudents: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<StudentsResponse>(`/employer/students${query}`);
  },

  getStudent: (id: string) =>
    apiFetch<{ student: User; portfolios: PortfolioItem[] }>(`/employer/students/${id}`),
};

// Notifications
export interface NotificationsResponse {
  global: Notification[];
  personal: PersonalNotification[];
  unread_count: number;
}

export interface PersonalNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: string;
  is_read: boolean;
  created_at: string;
}

export const notifications = {
  get: () => apiFetch<NotificationsResponse>('/notifications'),

  getPersonal: () => apiFetch<{ notifications: PersonalNotification[]; unread_count: number }>('/notifications/personal'),

  create: (data: { title: string; message: string; type?: string; target_role?: string }) =>
    apiFetch('/notifications', { method: 'POST', body: JSON.stringify(data) }),

  markRead: (id: string) =>
    apiFetch(`/notifications/${id}/read`, { method: 'POST' }),

  markAllRead: () =>
    apiFetch('/notifications/read-all', { method: 'POST' }),

  markPersonalRead: (id: number) =>
    apiFetch(`/notifications/personal/${id}/read`, { method: 'POST' }),

  markAllPersonalRead: () =>
    apiFetch('/notifications/personal/read-all', { method: 'POST' }),
};

// Dashboard
export const dashboard = {
  getStats: () => apiFetch<DashboardStats>('/dashboard/stats'),
};

// Types
export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin' | 'registrar' | 'employer' | 'STUDENT' | 'ADMIN' | 'REGISTRAR' | 'EMPLOYER';
  full_name: string;
  student_id?: string;
  company_name?: string;
  student_data?: {
    faculty?: string;
    specialty?: string;
    course?: number;
    group?: string;
    phone?: string;
    [key: string]: unknown;
  };
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  type: 'PROJECT' | 'CERTIFICATE' | 'ASSIGNMENT';
  title: string;
  description?: string;
  tags?: string[];
  file_url?: string;
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
  owner_id: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // New stats fields
  view_count?: number;
  rating_avg?: number;
  rating_count?: number;
  comment_count?: number;
  bookmark_count?: number;
}

export interface PortfolioItemWithOwner extends PortfolioItem {
  owner: User;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_role?: string;
  is_read: boolean;
  created_at: string;
}

export interface FilterOptions {
  faculties: string[];
  specialties: string[];
  courses: number[];
  groups: string[];
}

export interface StudentsResponse {
  students: User[];
  filters: FilterOptions;
  total: number;
}

export interface PortfoliosResponse {
  items: PortfolioItemWithOwner[];
  filters: FilterOptions;
  total: number;
}

export interface DashboardStats {
  total_students: number;
  total_portfolios: number;
  pending_portfolios: number;
  approved_portfolios: number;
  students_by_faculty: Record<string, number>;
  portfolios_by_status: Record<string, number>;
  recent_portfolios: number;
  recent_notifications: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: string;
  full_name: string;
  student_id?: string;
  company_name?: string;
}

export interface CreatePortfolioData {
  type: string;
  title: string;
  description?: string;
  tags?: string[];
}

// Generic API helper for simple REST calls
export const api = {
  get: <T = unknown>(endpoint: string) => apiFetch<T>(endpoint, { method: 'GET' }),
  post: <T = unknown>(endpoint: string, data?: unknown) => apiFetch<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  put: <T = unknown>(endpoint: string, data?: unknown) => apiFetch<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: <T = unknown>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};
