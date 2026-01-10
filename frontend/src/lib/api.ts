// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
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
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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

  // 401 - Token yaroqsiz (Login bundan mustasno)
  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    // Avtomatik redirect qilmaslik - AuthProvider o'zi boshqaradi
    throw new Error('Avtorizatsiya muddati tugagan');
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.errors && Array.isArray(data.errors)
      ? `${data.message || 'Xatolik'}: ${data.errors.join('. ')}`
      : (data.message || 'Xatolik yuz berdi');
    throw new Error(errorMsg);
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

  updateProfile: async (data: { full_name?: string; email?: string }, file?: File) => {
    const formData = new FormData();
    if (data.full_name) formData.append('full_name', data.full_name);
    if (data.email) formData.append('email', data.email);
    if (file) formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Profilni yangilashda xatolik');
    }
    return response.json();
  },

  changePassword: (data: any) =>
    apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

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

  changeUserPassword: (id: string, password: string) =>
    apiFetch(`/admin/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: password }),
    }),

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

  getCategories: () => apiFetch<{ categories: PortfolioCategory[] }>('/portfolio/categories'),

  create: async (data: CreatePortfolioData, files?: File[]) => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.category) {
      formData.append('category', data.category);
    }
    if (data.tags && data.tags.length > 0) {
      formData.append('tags', JSON.stringify(data.tags));
    }
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
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

  changeStudentPassword: (id: string, password: string) =>
    apiFetch(`/registrar/students/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: password }),
    }),
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

export interface PortfolioCategory {
  value: string;
  label: string;
}

export interface PortfolioItem {
  id: string;
  type: 'PROJECT' | 'CERTIFICATE' | 'ASSIGNMENT';
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  file_url?: string;
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
  files?: FileInfo[];
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

export interface FileInfo {
  url: string;
  name?: string;
  file_name?: string; // Backend compatibility
  mime_type: string;
  size: number;
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
  category?: string;
  tags?: string[];
}

// Webhook types
export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  headers?: Record<string, string>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  log_count?: number;
  error_count?: number;
}

export interface WebhookLog {
  id: number;
  webhook_id: string;
  event_type: string;
  payload: unknown;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  attempt: number;
  duration_ms?: number;
  created_at: string;
}

export interface WebhookEvent {
  value: string;
  label: string;
}

// Webhooks API
export const webhooks = {
  getAll: () => apiFetch<{ webhooks: Webhook[]; total: number; available_events: string[] }>('/admin/webhooks'),

  getOne: (id: string) => apiFetch<Webhook>(`/admin/webhooks/${id}`),

  getEvents: () => apiFetch<{ events: WebhookEvent[] }>('/admin/webhooks/events'),

  create: (data: Partial<Webhook>) =>
    apiFetch<{ success: boolean; message: string; id: string }>('/admin/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Webhook>) =>
    apiFetch(`/admin/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/admin/webhooks/${id}`, { method: 'DELETE' }),

  toggle: (id: string) => apiFetch(`/admin/webhooks/${id}/toggle`, { method: 'PUT' }),

  test: (id: string) =>
    apiFetch<{ success: boolean; status_code?: number; response_body?: string; error?: string; duration_ms: number }>(
      `/admin/webhooks/${id}/test`,
      { method: 'POST' }
    ),

  getLogs: (id: string, limit?: number) =>
    apiFetch<{ logs: WebhookLog[]; total: number }>(`/admin/webhooks/${id}/logs${limit ? `?limit=${limit}` : ''}`),

  clearLogs: (id: string) => apiFetch(`/admin/webhooks/${id}/logs`, { method: 'DELETE' }),
};

// Generic API helper for simple REST calls
export const api = {
  auth,
  admin,
  portfolio,
  registrar,
  employer,
  notifications,
  webhooks,
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
