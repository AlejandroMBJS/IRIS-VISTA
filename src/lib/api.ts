import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  RegisterResponse,
  User,
  PendingUser,
  ApproveUserPayload,
  RejectUserPayload,
  Product,
  PurchaseRequest,
  DashboardStats,
  ApprovalStats,
  PurchaseConfig,
  UserBasic,
  ProductMetadata as ProductMetadataType
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Request interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = response.data.data;
          setAccessToken(access_token);
          localStorage.setItem('refresh_token', refresh_token);

          const originalRequest = error.config;
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch {
          setAccessToken(null);
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const data = response.data.data!;
    setAccessToken(data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
    const response = await api.post<ApiResponse<RegisterResponse>>('/auth/register', credentials);
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      localStorage.removeItem('refresh_token');
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};

// Users API (Admin)
export const usersApi = {
  list: async (params?: { page?: number; per_page?: number; search?: string; role?: string; status?: string }) => {
    const response = await api.get<ApiResponse<User[]>>('/users', { params });
    return response.data;
  },

  get: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data!;
  },

  create: async (data: Partial<User> & { password: string }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  toggleStatus: async (id: number): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/toggle`);
    return response.data.data!;
  },

  // Pending user approval methods
  listPending: async (): Promise<PendingUser[]> => {
    const response = await api.get<ApiResponse<PendingUser[]>>('/users/pending');
    return response.data.data!;
  },

  getPendingCount: async (): Promise<{ count: number }> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/users/pending/count');
    return response.data.data!;
  },

  approve: async (id: number, data: ApproveUserPayload): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(`/users/${id}/approve`, data);
    return response.data.data!;
  },

  reject: async (id: number, data: RejectUserPayload): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(`/users/${id}/reject`, data);
    return response.data.data!;
  },

  bulkImport: async (users: Array<{
    employee_number: string;
    email: string;
    password: string;
    name: string;
    role: string;
    company_code?: string;
    cost_center?: string;
    department?: string;
  }>): Promise<{
    total: number;
    success: number;
    failed: number;
    results: Array<{
      employee_number: string;
      email: string;
      success: boolean;
      error?: string;
    }>;
  }> => {
    const response = await api.post<ApiResponse<{
      total: number;
      success: number;
      failed: number;
      results: Array<{
        employee_number: string;
        email: string;
        success: boolean;
        error?: string;
      }>;
    }>>('/users/bulk-import', { users });
    return response.data.data!;
  },
};

// Products API
export const productsApi = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    source?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return response.data;
  },

  get: async (id: number): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },

  getCategories: async (source?: string): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/products/categories', {
      params: { source }
    });
    return response.data.data!;
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  updateStock: async (id: number, stock: number): Promise<Product> => {
    const response = await api.patch<ApiResponse<Product>>(`/products/${id}/stock`, { stock });
    return response.data.data!;
  },

  bulkImport: async (products: Array<{
    sku: string;
    name: string;
    name_zh?: string;
    name_es?: string;
    description?: string;
    category: string;
    model?: string;
    specification?: string;
    spec_zh?: string;
    spec_es?: string;
    supplier?: string;
    supplier_code?: string;
    price?: number;
    currency?: string;
    stock?: number;
    min_stock?: number;
    max_stock?: number;
    location?: string;
    image_url?: string;
    is_active?: boolean;
    is_ecommerce?: boolean;
    product_url?: string;
    brand?: string;
    asin?: string;
  }>): Promise<{
    total: number;
    success: number;
    failed: number;
    results: Array<{
      row: number;
      sku: string;
      name: string;
      success: boolean;
      error?: string;
    }>;
  }> => {
    const response = await api.post<ApiResponse<{
      total: number;
      success: number;
      failed: number;
      results: Array<{
        row: number;
        sku: string;
        name: string;
        success: boolean;
        error?: string;
      }>;
    }>>('/products/bulk-import', { products });
    return response.data.data!;
  },
};

// Purchase Requests API - Supports both single and multi-product
export interface CreatePurchaseRequestItemInput {
  url: string;
  quantity: number;
  product_title?: string;
  product_image_url?: string;
  product_description?: string;
  estimated_price?: number;
  currency?: string;
}

export interface CreatePurchaseRequestInput {
  // Multi-product support
  items?: CreatePurchaseRequestItemInput[];

  // Legacy single-product fields (for backward compatibility)
  url?: string;
  quantity?: number;
  product_title?: string;
  product_image_url?: string;
  product_description?: string;
  estimated_price?: number;
  currency?: string;

  // Common fields
  justification: string;
  urgency?: 'normal' | 'urgent';
}

export interface TranslatedText {
  original: string;
  en: string;
  zh: string;
  es: string;
}

export interface ProductMetadata {
  url: string;
  title: string;
  description: string;
  image_url: string;
  price: number | null;
  currency: string;
  site_name: string;
  is_amazon: boolean;
  amazon_asin: string;
  error: string | null;
  title_translated?: TranslatedText;
  description_translated?: TranslatedText;
}

// Public config for purchase requests page
export interface PurchaseRequestConfig {
  module_name: string;
  module_description: string;
  module_active: boolean;
  allow_urgent: boolean;
  require_justification: boolean;
  show_internal_catalog: boolean;
  require_cost_center: boolean;
  require_project: boolean;
  require_budget_code: boolean;
}

export const purchaseRequestsApi = {
  // Get public purchase request config
  getConfig: async (): Promise<PurchaseRequestConfig> => {
    const response = await api.get<ApiResponse<PurchaseRequestConfig>>('/purchase-requests/config');
    return response.data.data!;
  },

  // Extract metadata from URL (preview before submission)
  extractMetadata: async (url: string): Promise<ProductMetadata> => {
    const response = await api.post<ApiResponse<ProductMetadata>>('/purchase-requests/extract-metadata', { url });
    return response.data.data!;
  },

  // Create a new purchase request
  create: async (data: CreatePurchaseRequestInput): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>('/purchase-requests', data);
    return response.data.data!;
  },

  // Get my requests
  getMyRequests: async (params?: { page?: number; per_page?: number; status?: string }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/purchase-requests/my', { params });
    return response.data;
  },

  // Get a specific request
  get: async (id: number): Promise<PurchaseRequest> => {
    const response = await api.get<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}`);
    return response.data.data!;
  },

  // Update a request (only if pending or info_requested)
  update: async (id: number, data: Partial<CreatePurchaseRequestInput>): Promise<PurchaseRequest> => {
    const response = await api.put<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}`, data);
    return response.data.data!;
  },

  // Cancel a request
  cancel: async (id: number): Promise<void> => {
    await api.delete(`/purchase-requests/${id}`);
  },
};

// Cart types
export interface CartItem {
  id: number;
  url: string;
  product_title: string;
  product_image_url: string;
  product_description: string;
  estimated_price: number;
  currency: string;
  quantity: number;
  subtotal: number;
  source: 'external' | 'catalog';
  catalog_product_id?: number;
  is_amazon_url: boolean;
  amazon_asin?: string;
  created_at: string;
}

export interface CartSummary {
  items: CartItem[];
  item_count: number;
  total_items: number;
  total: number;
  currency: string;
}

export interface AddToCartInput {
  url: string;
  product_title?: string;
  product_image_url?: string;
  product_description?: string;
  estimated_price?: number;
  currency?: string;
  quantity?: number;
  source?: 'external' | 'catalog';
  catalog_product_id?: number;
}

export interface UpdateCartItemInput {
  quantity?: number;
  product_title?: string;
  product_image_url?: string;
  product_description?: string;
  estimated_price?: number;
}

// Cart API
export const cartApi = {
  // Get current cart
  get: async (): Promise<CartSummary> => {
    const response = await api.get<ApiResponse<CartSummary>>('/cart');
    return response.data.data!;
  },

  // Get cart count for navbar badge
  getCount: async (): Promise<number> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/cart/count');
    return response.data.data?.count || 0;
  },

  // Add item to cart
  add: async (item: AddToCartInput): Promise<CartItem> => {
    const response = await api.post<ApiResponse<CartItem>>('/cart', item);
    return response.data.data!;
  },

  // Update cart item
  update: async (id: number, data: UpdateCartItemInput): Promise<CartItem> => {
    const response = await api.put<ApiResponse<CartItem>>(`/cart/${id}`, data);
    return response.data.data!;
  },

  // Remove item from cart
  remove: async (id: number): Promise<void> => {
    await api.delete(`/cart/${id}`);
  },

  // Clear entire cart
  clear: async (): Promise<void> => {
    await api.delete('/cart');
  },
};

// Legacy requests API for backward compatibility
export const requestsApi = {
  list: async (params?: { page?: number; per_page?: number; status?: string }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/requests', { params });
    return response.data;
  },

  getMyRequests: async (params?: { page?: number; per_page?: number; status?: string }) => {
    return purchaseRequestsApi.getMyRequests(params);
  },

  get: async (id: number): Promise<PurchaseRequest> => {
    return purchaseRequestsApi.get(id);
  },

  cancel: async (id: number): Promise<void> => {
    return purchaseRequestsApi.cancel(id);
  },

  // Legacy create method for internal catalog requests
  create: async (data: import('@/types').CreateRequestInput): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>('/requests', data);
    return response.data.data!;
  },
};

// Approvals API
export const approvalsApi = {
  listPending: async (params?: { page?: number; per_page?: number; status?: string; my_actions?: boolean }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/approvals', { params });
    return response.data;
  },

  getStats: async (): Promise<ApprovalStats> => {
    const response = await api.get<ApiResponse<ApprovalStats>>('/approvals/stats');
    return response.data.data!;
  },

  get: async (id: number): Promise<PurchaseRequest> => {
    const response = await api.get<ApiResponse<PurchaseRequest>>(`/approvals/${id}`);
    return response.data.data!;
  },

  approve: async (id: number, comment?: string): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/approvals/${id}/approve`, { comment });
    return response.data.data!;
  },

  reject: async (id: number, comment: string): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/approvals/${id}/reject`, { comment });
    return response.data.data!;
  },

  requestInfo: async (id: number, comment: string): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/approvals/${id}/request-info`, { comment });
    return response.data.data!;
  },
};

// Admin API
export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return response.data.data!;
  },

  // Approved Orders Dashboard
  getApprovedOrders: async (params?: {
    page?: number;
    per_page?: number;
    filter?: 'all' | 'amazon_cart' | 'pending_manual' | 'purchased' | 'delivered' | 'cancelled';
  }) => {
    const response = await api.get<ApiResponse<PurchaseRequest[]>>('/admin/approved-orders', { params });
    return response.data;
  },

  markAsPurchased: async (id: number, notes?: string, orderNumber?: string): Promise<PurchaseRequest> => {
    const response = await api.patch<ApiResponse<PurchaseRequest>>(`/admin/orders/${id}/purchased`, {
      notes,
      order_number: orderNumber
    });
    return response.data.data!;
  },

  addToCart: async (orderId: number, itemId?: number): Promise<PurchaseRequest> => {
    // Use retry-cart endpoint which handles add to cart functionality
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/admin/orders/${orderId}/retry-cart`, {
      item_id: itemId
    });
    return response.data.data!;
  },

  retryAddToCart: async (id: number): Promise<PurchaseRequest> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(`/admin/orders/${id}/retry-cart`);
    return response.data.data!;
  },

  // Update admin notes for an order
  updateOrderNotes: async (id: number, adminNotes: string): Promise<PurchaseRequest> => {
    const response = await api.patch<ApiResponse<PurchaseRequest>>(`/admin/orders/${id}/notes`, {
      admin_notes: adminNotes
    });
    return response.data.data!;
  },

  // Mark order as delivered
  markAsDelivered: async (id: number, notes?: string): Promise<PurchaseRequest> => {
    const response = await api.patch<ApiResponse<PurchaseRequest>>(`/admin/orders/${id}/delivered`, {
      notes
    });
    return response.data.data!;
  },

  // Cancel order
  cancelOrder: async (id: number, notes: string): Promise<PurchaseRequest> => {
    const response = await api.patch<ApiResponse<PurchaseRequest>>(`/admin/orders/${id}/cancel`, {
      notes
    });
    return response.data.data!;
  },

  // Purchase Config
  getPurchaseConfig: async (): Promise<PurchaseConfig> => {
    const response = await api.get<ApiResponse<PurchaseConfig>>('/admin/purchase-config');
    return response.data.data!;
  },

  savePurchaseConfig: async (data: Partial<PurchaseConfig>): Promise<PurchaseConfig> => {
    const response = await api.put<ApiResponse<PurchaseConfig>>('/admin/purchase-config', data);
    return response.data.data!;
  },

  testMetadataExtraction: async (url: string): Promise<ProductMetadataType> => {
    const response = await api.post<ApiResponse<ProductMetadataType>>('/admin/purchase-config/test', { url });
    return response.data.data!;
  },

  getApprovers: async (): Promise<UserBasic[]> => {
    const response = await api.get<ApiResponse<UserBasic[]>>('/admin/purchase-config/users');
    return response.data.data!;
  },

  // Filter Rules
  listFilterRules: async () => {
    const response = await api.get<ApiResponse<import('@/types').FilterRule[]>>('/admin/filter-rules');
    return response.data.data || [];
  },

  createFilterRule: async (data: Omit<import('@/types').FilterRule, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<ApiResponse<import('@/types').FilterRule>>('/admin/filter-rules', data);
    return response.data.data!;
  },

  updateFilterRule: async (id: number, data: Partial<import('@/types').FilterRule>) => {
    const response = await api.put<ApiResponse<import('@/types').FilterRule>>(`/admin/filter-rules/${id}`, data);
    return response.data.data!;
  },

  toggleFilterRule: async (id: number) => {
    const response = await api.patch<ApiResponse<import('@/types').FilterRule>>(`/admin/filter-rules/${id}/toggle`);
    return response.data.data!;
  },

  deleteFilterRule: async (id: number) => {
    await api.delete(`/admin/filter-rules/${id}`);
  },
};

// Email Config API
export interface EmailConfig {
  id: number;
  provider: string;
  api_key_set: boolean;
  from_email: string;
  from_name: string;
  reply_to_email: string;
  enabled: boolean;
  send_on_approval: boolean;
  send_on_rejection: boolean;
  send_on_info_request: boolean;
  send_on_purchased: boolean;
  send_on_new_request: boolean;
  send_on_urgent: boolean;
  send_reminders: boolean;
  last_test_at?: string;
  last_test_success: boolean;
  last_test_error?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailConfigInput {
  api_key?: string;
  from_email?: string;
  from_name?: string;
  reply_to_email?: string;
  enabled?: boolean;
  send_on_approval?: boolean;
  send_on_rejection?: boolean;
  send_on_info_request?: boolean;
  send_on_purchased?: boolean;
  send_on_new_request?: boolean;
  send_on_urgent?: boolean;
  send_reminders?: boolean;
}

export const emailConfigApi = {
  get: async (): Promise<EmailConfig> => {
    const response = await api.get<ApiResponse<EmailConfig>>('/admin/email-config');
    return response.data.data!;
  },

  save: async (data: EmailConfigInput): Promise<EmailConfig> => {
    const response = await api.put<ApiResponse<EmailConfig>>('/admin/email-config', data);
    return response.data.data!;
  },

  test: async (email: string): Promise<void> => {
    await api.post('/admin/email-config/test', { email });
  },
};

// Amazon Config API
export interface AmazonConfig {
  id: number;
  email: string;
  marketplace: string;
  has_password: boolean;
  is_active: boolean;
  last_login_at?: string;
  last_test_at?: string;
  test_status: string;
  test_message: string;
  created_at: string;
  updated_at: string;
}

export interface AmazonConfigInput {
  email: string;
  password?: string;
  marketplace?: string;
  is_active?: boolean;
}

export interface AmazonSessionStatus {
  is_logged_in: boolean;
  last_activity?: string;
  session_valid: boolean;
}

export const amazonConfigApi = {
  get: async (): Promise<AmazonConfig> => {
    const response = await api.get<ApiResponse<AmazonConfig>>('/admin/amazon/config');
    return response.data.data!;
  },

  save: async (data: AmazonConfigInput): Promise<AmazonConfig> => {
    const response = await api.put<ApiResponse<AmazonConfig>>('/admin/amazon/config', data);
    return response.data.data!;
  },

  test: async (): Promise<{ status: string; message: string }> => {
    const response = await api.post<ApiResponse<{ status: string; message: string }>>('/admin/amazon/test');
    return response.data.data!;
  },

  getSessionStatus: async (): Promise<AmazonSessionStatus> => {
    const response = await api.get<ApiResponse<AmazonSessionStatus>>('/admin/amazon/session');
    return response.data.data!;
  },
};

// Notifications API
export interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: number;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationCount {
  unread: number;
  total: number;
}

export interface PendingCounts {
  unread_notifications: number;
  pending_approvals: number;
  pending_orders: number;
}

export const notificationsApi = {
  list: async (params?: { page?: number; per_page?: number; unread?: boolean }) => {
    const response = await api.get<ApiResponse<NotificationData[]>>('/notifications', { params });
    return response.data;
  },

  getCount: async (): Promise<NotificationCount> => {
    const response = await api.get<ApiResponse<NotificationCount>>('/notifications/count');
    return response.data.data!;
  },

  getPendingCounts: async (): Promise<PendingCounts> => {
    const response = await api.get<ApiResponse<PendingCounts>>('/notifications/pending-counts');
    return response.data.data!;
  },

  markAsRead: async (id: number): Promise<NotificationData> => {
    const response = await api.patch<ApiResponse<NotificationData>>(`/notifications/${id}/read`);
    return response.data.data!;
  },

  markAllAsRead: async (): Promise<{ updated: number }> => {
    const response = await api.post<ApiResponse<{ updated: number }>>('/notifications/read-all');
    return response.data.data!;
  },
};

// Activity Logs types
export interface ActivityLog {
  id: number;
  user_id: number | null;
  user_name: string;
  user_email: string;
  type: 'login' | 'login_failed' | 'logout' | 'token_refresh' | 'password_reset' | 'registration';
  success: boolean;
  ip_address: string;
  user_agent: string;
  details: string;
  identifier: string;
  session_id: string;
  expires_at: string | null;
  ended_at: string | null;
  created_at: string;
  is_active: boolean;
  duration_seconds: number | null;
}

export interface ActivityStats {
  total_logins: number;
  failed_logins: number;
  active_sessions: number;
  unique_users: number;
  today_logins: number;
  today_failed_logins: number;
}

export interface ActivityLogsResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ActivityLogsFilters {
  page?: number;
  per_page?: number;
  type?: string;
  user_id?: number;
  success?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
}

// Activity Logs API
export const activityLogsApi = {
  getLogs: async (filters: ActivityLogsFilters = {}): Promise<ActivityLogsResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.user_id) params.append('user_id', filters.user_id.toString());
    if (filters.success !== undefined) params.append('success', filters.success.toString());
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get<ApiResponse<ActivityLogsResponse>>(`/admin/activity-logs?${params.toString()}`);
    return response.data.data!;
  },

  getStats: async (): Promise<ActivityStats> => {
    const response = await api.get<ApiResponse<ActivityStats>>('/admin/activity-logs/stats');
    return response.data.data!;
  },

  getActiveSessions: async (): Promise<ActivityLog[]> => {
    const response = await api.get<ApiResponse<ActivityLog[]>>('/admin/activity-logs/sessions');
    return response.data.data!;
  },

  endSession: async (id: number): Promise<void> => {
    await api.delete(`/admin/activity-logs/sessions/${id}`);
  },
};

export default api;
