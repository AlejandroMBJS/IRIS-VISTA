// User types
export type UserRole = 'admin' | 'purchase_admin' | 'supply_chain_manager' | 'general_manager' | 'employee';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export interface User {
  id: number;
  employee_number: string;
  email: string;
  name: string;
  role: UserRole;
  company_code: string;
  cost_center: string;
  department: string;
  status: UserStatus;
}

export interface PendingUser {
  id: number;
  employee_number: string;
  email: string;
  name: string;
  status: UserStatus;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  employee_number: string;
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  employee_number: string;
  name: string;
  email: string;
  status: UserStatus;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ApproveUserPayload {
  role: UserRole;
  company_code?: string;
  cost_center?: string;
  department?: string;
}

export interface RejectUserPayload {
  reason: string;
}

// Product types
export type ProductSource = 'internal' | 'external';
export type StockStatus = 'in_stock' | 'limited' | 'out_of_stock';

export interface ProductImage {
  id: number;
  url: string;
  sort_order: number;
  is_primary: boolean;
  caption?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  name_zh?: string;
  name_es?: string;
  description?: string;
  category: string;
  model: string;
  specification: string;
  spec_zh?: string;
  spec_es?: string;
  supplier: string;
  supplier_code?: string;
  price: number;
  currency: string;
  stock: number;
  min_stock?: number;
  max_stock?: number;
  location?: string;
  stock_status: StockStatus;
  image_url?: string;
  image_emoji?: string;
  clickup_id?: string;
  source: ProductSource;
  is_active: boolean;
  images?: ProductImage[];
  // E-commerce fields
  product_url?: string;
  is_ecommerce?: boolean;
  asin?: string;
  brand?: string;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Request types - Simplified URL-based model
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'info_requested' | 'purchased' | 'delivered' | 'cancelled';
export type Urgency = 'normal' | 'urgent';

export interface TranslatedText {
  original: string;
  en: string;
  zh: string;
  es: string;
}

export interface RequestHistory {
  id: number;
  user_id: number;
  user?: User;
  action: string;
  comment: string;
  comment_translated?: TranslatedText;
  old_status: string;
  new_status: string;
  created_at: string;
}

// Request item for multi-product support
export interface PurchaseRequestItem {
  id: number;
  url: string;
  product_title: string;
  product_title_translated?: TranslatedText;
  product_image_url: string;
  product_description?: string;
  product_description_translated?: TranslatedText;
  estimated_price?: number;
  currency: string;
  quantity: number;
  subtotal: number;
  is_amazon_url: boolean;
  amazon_asin?: string;
  added_to_cart: boolean;
  added_to_cart_at?: string;
  cart_error?: string;
}

export interface PurchaseRequest {
  id: number;
  request_number: string;

  // Multi-product support
  items?: PurchaseRequestItem[];
  product_count: number;
  total_estimated?: number;

  // Legacy single-product fields (for backward compatibility)
  url?: string;
  product_title?: string;
  product_title_translated?: TranslatedText;
  product_image_url?: string;
  product_description?: string;
  product_description_translated?: TranslatedText;
  estimated_price?: number;
  currency: string;
  quantity: number;

  // Request details
  justification: string;
  urgency: Urgency;

  // Requester
  requester_id: number;
  requester?: User;

  // Status
  status: RequestStatus;

  // Amazon automation (legacy single-product)
  is_amazon_url: boolean;
  added_to_cart: boolean;
  added_to_cart_at?: string;
  cart_error?: string;
  amazon_asin?: string;

  // Approval info
  approved_by?: User;
  approved_by_id?: number;
  approved_at?: string;
  rejected_by?: User;
  rejected_by_id?: number;
  rejected_at?: string;
  rejection_reason?: string;

  // PO Number (assigned when approved)
  po_number?: string;

  // Info request
  info_requested_at?: string;
  info_request_note?: string;

  // Purchase completion
  purchased_by?: User;
  purchased_by_id?: number;
  purchased_at?: string;
  purchase_notes?: string;
  order_number?: string;

  // Delivery info
  delivered_by?: User;
  delivered_by_id?: number;
  delivered_at?: string;
  delivery_notes?: string;

  // Cancellation info
  cancelled_by?: User;
  cancelled_by_id?: number;
  cancelled_at?: string;
  cancellation_notes?: string;

  // Admin notes (visible to admin, purchase_admin, gm, and requester)
  admin_notes?: string;

  // Translated fields
  justification_translated?: TranslatedText;
  rejection_reason_translated?: TranslatedText;
  info_request_note_translated?: TranslatedText;
  purchase_notes_translated?: TranslatedText;
  delivery_notes_translated?: TranslatedText;
  cancellation_notes_translated?: TranslatedText;
  admin_notes_translated?: TranslatedText;

  // History
  history?: RequestHistory[];

  // Timestamps
  created_at: string;
  updated_at: string;

  // Legacy fields for backward compatibility
  type?: string;
  total_amount?: number;
  cost_center?: string;
  purpose?: string;
  notes?: string;
  priority?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Dashboard Stats
export interface DashboardStats {
  total_users: number;
  active_users: number;
  pending_users: number;
  total_products: number;
  total_requests: number;
  pending_approvals: number;
  approved_requests: number;
  purchased_orders: number;
  amazon_in_cart: number;
  pending_manual: number;
  amazon_configured: boolean;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  info_required: number;
  purchased: number;
  total: number;
  urgent: number;
  amazon_in_cart: number;
}

// Purchase Config types
export interface ApprovalLevel {
  max_amount: number;
  approver_role: string;
  approver_id?: number;
}

export interface CustomField {
  name: string;
  label: string;
  label_zh?: string;
  label_es?: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

export interface UserBasic {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface PurchaseConfig {
  id: number;

  // General Configuration
  module_name: string;
  module_description: string;
  module_active: boolean;
  allow_urgent: boolean;
  require_justification: boolean;

  // Metadata Extraction
  extraction_timeout_seconds: number;
  allow_manual_edit: boolean;
  cache_enabled: boolean;
  cache_duration_hours: number;
  custom_user_agent: string;
  allowed_domains: string[];
  blocked_domains: string[];

  // Approval Flow
  default_approver_id: number | null;
  default_approver?: UserBasic;
  auto_approve_enabled: boolean;
  auto_approve_max_amount: number;
  approval_levels: ApprovalLevel[];

  // Notifications - Requester
  notify_requester_approved: boolean;
  notify_requester_rejected: boolean;
  notify_requester_info_requested: boolean;
  notify_requester_purchased: boolean;

  // Notifications - Approver
  notify_approver_new_request: boolean;
  notify_approver_urgent: boolean;

  // Notifications - Admin
  notify_admin_new_approved: boolean;

  // Reminders
  reminder_pending_hours: number;
  reminder_unpurchased_hours: number;

  // Form Fields
  require_cost_center: boolean;
  require_project: boolean;
  require_budget_code: boolean;
  custom_fields: CustomField[];

  // Purchase Request Options
  show_internal_catalog: boolean;

  // Admin Panel
  admin_default_view: 'cards' | 'table';
  admin_visible_columns: string[];
  admin_default_sort: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Product Metadata from URL extraction
export interface ProductMetadata {
  title: string;
  description: string;
  image_url: string;
  price?: number;
  currency?: string;
  site_name?: string;
}

// Filter Rule types
export type FilterRuleType = 'price_max' | 'price_min' | 'category_allow' | 'category_block' | 'supplier_block' | 'keyword_block';

export interface FilterRule {
  id: number;
  name: string;
  description: string;
  rule_type: FilterRuleType;
  value: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Legacy request types (for internal catalog requests)
export interface CreateRequestItemInput {
  product_id: number;
  name: string;
  specification: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  source: string;
  image_url?: string;
}

export interface CreateRequestInput {
  type: 'material_issue' | 'purchase_requisition';
  cost_center: string;
  purpose: string;
  priority: string;
  items: CreateRequestItemInput[];
}
