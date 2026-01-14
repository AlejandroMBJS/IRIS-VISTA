'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ClipboardList,
  Plus,
  Loader2,
  X,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Package,
  Calendar,
  ExternalLink,
  FileText,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Filter,
  ShoppingCart,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { requestsApi } from '@/lib/api';
import { getTranslatedText } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import type { PurchaseRequest, PurchaseRequestItem } from '@/types';

// Format price to show all significant decimals (minimum 2)
const formatPrice = (price: number): string => {
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Get display number - PO number if approved/purchased, otherwise request number
const getDisplayNumber = (request: PurchaseRequest): string => {
  if ((request.status === 'approved' || request.status === 'purchased') && request.po_number) {
    return request.po_number;
  }
  return request.request_number;
};

type FilterType = 'all' | 'pending' | 'approved' | 'purchased' | 'rejected';

export default function RequestsPage() {
  const { language } = useLanguage();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const text = {
    en: {
      title: 'My Requests',
      subtitle: 'View and track your purchase requests',
      newRequest: 'New Request',
      noRequests: 'No requests found',
      createFirst: 'Create your first purchase request',
      refresh: 'Refresh',
      products: 'Products',
      total: 'Total',
      quantity: 'Qty',
      close: 'Close',
      status: 'Status',
      date: 'Date',
      justification: 'Justification',
      history: 'History',
      noHistory: 'No history available',
      rejectionReason: 'Rejection Reason',
      purchaseInfo: 'Purchase Information',
      orderNumber: 'Order Number',
      purchasedBy: 'Purchased by',
      purchaseNotes: 'Purchase Notes',
      adminNotes: 'Internal Notes',
      all: 'All',
      viewProduct: 'View',
      statuses: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        purchased: 'Purchased',
        info_requested: 'Info Requested',
        cancelled: 'Cancelled',
      },
      historyActions: {
        created: 'Request Created',
        approved: 'Approved',
        rejected: 'Rejected',
        returned: 'Info Requested',
        cancelled: 'Cancelled',
        modified: 'Modified',
        purchased: 'Purchased',
      },
    },
    zh: {
      title: '我的请求',
      subtitle: '查看和跟踪您的采购请求',
      newRequest: '新建请求',
      noRequests: '没有找到请求',
      createFirst: '创建您的第一个采购请求',
      refresh: '刷新',
      products: '产品',
      total: '总计',
      quantity: '数量',
      close: '关闭',
      status: '状态',
      date: '日期',
      justification: '理由',
      history: '历史记录',
      noHistory: '暂无历史记录',
      rejectionReason: '拒绝原因',
      purchaseInfo: '购买信息',
      orderNumber: '订单号',
      purchasedBy: '购买人',
      purchaseNotes: '购买备注',
      adminNotes: '内部备注',
      all: '全部',
      viewProduct: '查看',
      statuses: {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        purchased: '已购买',
        info_requested: '需要信息',
        cancelled: '已取消',
      },
      historyActions: {
        created: '请求已创建',
        approved: '已批准',
        rejected: '已拒绝',
        returned: '需要信息',
        cancelled: '已取消',
        modified: '已修改',
        purchased: '已购买',
      },
    },
    es: {
      title: 'Mis Solicitudes',
      subtitle: 'Ver y seguir sus solicitudes de compra',
      newRequest: 'Nueva Solicitud',
      noRequests: 'No se encontraron solicitudes',
      createFirst: 'Cree su primera solicitud de compra',
      refresh: 'Actualizar',
      products: 'Productos',
      total: 'Total',
      quantity: 'Cant',
      close: 'Cerrar',
      status: 'Estado',
      date: 'Fecha',
      justification: 'Justificación',
      history: 'Historial',
      noHistory: 'Sin historial disponible',
      rejectionReason: 'Motivo de Rechazo',
      purchaseInfo: 'Información de Compra',
      orderNumber: 'Número de Orden',
      purchasedBy: 'Comprado por',
      purchaseNotes: 'Notas de Compra',
      adminNotes: 'Notas Internas',
      all: 'Todos',
      viewProduct: 'Ver',
      statuses: {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        purchased: 'Comprado',
        info_requested: 'Info Solicitada',
        cancelled: 'Cancelado',
      },
      historyActions: {
        created: 'Solicitud Creada',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        returned: 'Info Solicitada',
        cancelled: 'Cancelado',
        modified: 'Modificado',
        purchased: 'Comprado',
      },
    },
  };

  const t = text[language];

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await requestsApi.getMyRequests({ per_page: 100 });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Get product items (handles both multi-product and legacy)
  const getProductItems = (request: PurchaseRequest): PurchaseRequestItem[] => {
    if (request.items && request.items.length > 0) {
      return request.items;
    }
    return [{
      id: 0,
      url: request.url || '',
      product_title: request.product_title || 'Product',
      product_title_translated: request.product_title_translated,
      product_image_url: request.product_image_url || '',
      product_description: request.product_description,
      product_description_translated: request.product_description_translated,
      estimated_price: request.estimated_price,
      currency: request.currency,
      quantity: request.quantity,
      subtotal: (request.estimated_price || 0) * request.quantity,
      is_amazon_url: request.is_amazon_url,
      added_to_cart: request.added_to_cart,
    }];
  };

  // Calculate total
  const calculateTotal = (request: PurchaseRequest) => {
    if (request.total_estimated) return request.total_estimated;
    const items = getProductItems(request);
    return items.reduce((sum, item) => sum + (item.estimated_price || 0) * item.quantity, 0);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" /> },
      approved: { bg: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      rejected: { bg: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3 mr-1" /> },
      purchased: { bg: 'bg-green-100 text-green-800', icon: <ShoppingCart className="h-3 w-3 mr-1" /> },
      info_requested: { bg: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      cancelled: { bg: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    const c = config[status] || config.pending;
    return (
      <Badge className={c.bg}>
        {c.icon}
        {t.statuses[status as keyof typeof t.statuses] || status}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'returned': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'cancelled': return <X className="h-4 w-4 text-gray-600" />;
      case 'purchased': return <ShoppingCart className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Count by status
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const purchasedCount = requests.filter(r => r.status === 'purchased').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  // Filter requests by status and date
  const filteredRequests = requests.filter(r => {
    // Filter by status
    if (filter !== 'all' && r.status !== filter) return false;

    // Filter by date range
    if (dateRange?.from) {
      const createdAt = new Date(r.created_at);
      createdAt.setHours(0, 0, 0, 0);

      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);

      if (createdAt < fromDate) return false;

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (createdAt > toDate) return false;
      }
    }

    return true;
  });

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: t.all, count: requests.length },
    { key: 'pending', label: t.statuses.pending, count: pendingCount },
    { key: 'approved', label: t.statuses.approved, count: approvedCount },
    { key: 'purchased', label: t.statuses.purchased, count: purchasedCount },
    { key: 'rejected', label: t.statuses.rejected, count: rejectedCount },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFA]">
      {/* Header */}
      <section className="border-b border-[#ABC0B9] bg-white px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl text-[#2D363F] font-semibold">
                {t.title}
              </h1>
              <p className="text-sm md:text-base text-[#4E616F] mt-1">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchRequests}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {t.refresh}
              </Button>
              <Link href="/purchase/new">
                <Button className="bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.newRequest}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 mb-6">
            <Card className="bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-gray-600">{t.statuses.pending}</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{approvedCount}</p>
                <p className="text-sm text-gray-600">{t.statuses.approved}</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{purchasedCount}</p>
                <p className="text-sm text-gray-600">{t.statuses.purchased}</p>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                <p className="text-sm text-gray-600">{t.statuses.rejected}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center mb-6">
            <div className="flex gap-2 flex-wrap items-center">
              <Filter className="h-5 w-5 text-gray-500" />
              {filters.map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f.key)}
                  className={filter === f.key ? 'bg-[#5C2F0E] hover:bg-[#2D363F]' : ''}
                >
                  {f.label} ({f.count})
                </Button>
              ))}
            </div>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              language={language}
              className="md:ml-auto min-w-[200px]"
            />
          </div>

          {/* Requests List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5C2F0E]" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">{t.noRequests}</p>
                {requests.length === 0 && (
                  <>
                    <p className="text-sm mb-4">{t.createFirst}</p>
                    <Link href="/purchase/new">
                      <Button className="bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        {t.newRequest}
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const items = getProductItems(request);
                const total = calculateTotal(request);

                return (
                  <Card
                    key={request.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedRequest(request)}
                  >
                    {/* Request Header */}
                    <div className="p-4 md:p-6 border-b border-[#ABC0B9] bg-white">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-[#2D363F]">
                            {getDisplayNumber(request)}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#4E616F]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products List */}
                    <div className="p-4 md:p-6 space-y-3">
                      <p className="text-sm font-medium text-[#4E616F]">
                        {t.products} ({items.length}):
                      </p>

                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-3 bg-[#FAFBFA] rounded-lg border border-[#ABC0B9]"
                        >
                          {/* Product Image */}
                          {item.product_image_url ? (
                            <div className="w-16 h-16 rounded bg-white border border-[#ABC0B9] overflow-hidden flex-shrink-0">
                              <Image
                                src={item.product_image_url}
                                alt={getTranslatedText(item.product_title_translated, item.product_title, language) || 'Product'}
                                width={64}
                                height={64}
                                className="object-contain w-full h-full"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded bg-[#ABC0B9] flex items-center justify-center flex-shrink-0">
                              <Package className="h-6 w-6 text-[#4E616F]" />
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#2D363F] truncate">
                              {getTranslatedText(item.product_title_translated, item.product_title, language)}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[#4E616F]">
                              <span>{t.quantity}: {item.quantity}</span>
                              {item.estimated_price && (
                                <span className="font-medium text-[#5C2F0E]">
                                  {item.currency || 'MXN'} ${formatPrice((item.estimated_price || 0) * item.quantity)}
                                </span>
                              )}
                              {item.is_amazon_url && (
                                <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                                  Amazon
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Item Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {item.url && !item.url.startsWith('catalog://') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {t.viewProduct}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Justification */}
                      {request.justification && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-[#ABC0B9]">
                          <p className="text-xs font-medium text-[#4E616F] uppercase mb-1">{t.justification}</p>
                          <p className="text-sm text-[#2D363F] line-clamp-2">{getTranslatedText(request.justification_translated, request.justification, language)}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {request.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-red-800 mb-1">
                            <XCircle className="h-4 w-4" />
                            {t.rejectionReason}
                          </div>
                          <p className="text-sm text-red-700">{getTranslatedText(request.rejection_reason_translated, request.rejection_reason, language)}</p>
                        </div>
                      )}

                      {/* Purchase Info (visible when purchased) */}
                      {request.status === 'purchased' && (request.purchase_notes || request.order_number) && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
                            <FileText className="h-4 w-4" />
                            {t.purchaseInfo}
                          </div>
                          {request.order_number && (
                            <p className="text-sm text-green-700">
                              <span className="font-medium">{t.orderNumber}:</span> {request.order_number}
                            </p>
                          )}
                          {request.purchased_by && (
                            <p className="text-sm text-green-700">
                              <span className="font-medium">{t.purchasedBy}:</span> {request.purchased_by.name}
                            </p>
                          )}
                          {request.purchase_notes && (
                            <p className="text-sm text-green-700 mt-1">{getTranslatedText(request.purchase_notes_translated, request.purchase_notes, language)}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Request Footer */}
                    <div className="px-4 md:px-6 py-4 bg-[#FAFBFA] border-t border-[#ABC0B9]">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-sm text-[#4E616F]">{t.total}</p>
                          <p className="text-xl font-bold text-[#5C2F0E]">
                            {request.currency} ${formatPrice(total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] p-6 rounded-t-xl flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-2xl text-white font-semibold mb-1">
                  {getDisplayNumber(selectedRequest)}
                </h2>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedRequest.status)}
                  <span className="text-white/80 text-sm">
                    {new Date(selectedRequest.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Items List */}
              <div>
                <p className="text-sm font-semibold text-[#2D363F] mb-3">
                  {t.products} ({getProductItems(selectedRequest).length})
                </p>
                <div className="space-y-3">
                  {getProductItems(selectedRequest).map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-[#FAFBFA] rounded-lg border border-[#ABC0B9]">
                      {item.product_image_url ? (
                        <div className="w-20 h-20 rounded-lg bg-white border border-[#ABC0B9] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <Image
                            src={item.product_image_url}
                            alt={getTranslatedText(item.product_title_translated, item.product_title, language) || 'Product'}
                            width={80}
                            height={80}
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-[#ABC0B9] flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-[#4E616F]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#2D363F] line-clamp-2">
                          {getTranslatedText(item.product_title_translated, item.product_title || 'Product', language)}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-[#4E616F]">{t.quantity}: {item.quantity}</span>
                          {item.estimated_price && (
                            <span className="text-sm font-semibold text-[#5C2F0E]">
                              {item.currency || 'MXN'} ${formatPrice(item.estimated_price)}
                            </span>
                          )}
                          {item.is_amazon_url && (
                            <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                              Amazon
                            </Badge>
                          )}
                        </div>
                        {item.url && !item.url.startsWith('catalog://') && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#5C2F0E] hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver producto
                          </a>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {item.estimated_price && (
                          <p className="font-bold text-[#2D363F]">
                            ${formatPrice(item.estimated_price * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-[#ABC0B9] flex justify-between items-center">
                <span className="text-lg font-semibold text-[#2D363F]">{t.total}:</span>
                <span className="text-2xl font-bold text-[#5C2F0E]">
                  {selectedRequest.currency} ${formatPrice(calculateTotal(selectedRequest))}
                </span>
              </div>

              {/* Justification */}
              {selectedRequest.justification && (
                <div className="p-3 bg-[#FAFBFA] rounded-lg border border-[#ABC0B9]">
                  <p className="text-xs font-medium text-[#4E616F] uppercase mb-1">{t.justification}</p>
                  <p className="text-sm text-[#2D363F]">{getTranslatedText(selectedRequest.justification_translated, selectedRequest.justification, language)}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">{t.rejectionReason}:</p>
                  <p className="text-sm text-red-700">{getTranslatedText(selectedRequest.rejection_reason_translated, selectedRequest.rejection_reason, language)}</p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.admin_notes && (
                <div className="p-3 bg-[#5C2F0E]/5 border border-[#5C2F0E]/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-[#5C2F0E]" />
                    <p className="text-sm font-medium text-[#5C2F0E]">{t.adminNotes}:</p>
                  </div>
                  <p className="text-sm text-[#4E616F]">{getTranslatedText(selectedRequest.admin_notes_translated, selectedRequest.admin_notes, language)}</p>
                </div>
              )}

              {/* Purchase Info */}
              {selectedRequest.status === 'purchased' && (selectedRequest.purchase_notes || selectedRequest.order_number || selectedRequest.purchased_by) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-green-700" />
                    </div>
                    <p className="text-base font-semibold text-green-800">{t.purchaseInfo}</p>
                  </div>
                  <div className="space-y-2 pl-10">
                    {selectedRequest.order_number && (
                      <p className="text-sm text-green-700">
                        <span className="font-medium">{t.orderNumber}:</span> {selectedRequest.order_number}
                      </p>
                    )}
                    {selectedRequest.purchased_by && (
                      <p className="text-sm text-green-700">
                        <span className="font-medium">{t.purchasedBy}:</span> {selectedRequest.purchased_by.name}
                      </p>
                    )}
                    {selectedRequest.purchase_notes && (
                      <p className="text-sm text-green-700 pt-2 border-t border-green-200">
                        {getTranslatedText(selectedRequest.purchase_notes_translated, selectedRequest.purchase_notes, language)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* History Timeline */}
              {selectedRequest.history && selectedRequest.history.length > 0 && (
                <div className="pt-4 border-t border-[#ABC0B9]">
                  <p className="text-sm font-semibold text-[#2D363F] mb-3">{t.history}</p>
                  <div className="space-y-3">
                    {selectedRequest.history.map((historyItem, idx) => (
                      <div key={historyItem.id || idx} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActionIcon(historyItem.action)}
                        </div>
                        <div className="flex-1 bg-[#FAFBFA] rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-[#2D363F]">
                              {t.historyActions[historyItem.action as keyof typeof t.historyActions] || historyItem.action}
                            </span>
                            <span className="text-xs text-[#80959A]">
                              {new Date(historyItem.created_at).toLocaleString()}
                            </span>
                          </div>
                          {historyItem.comment && (
                            <p className="text-sm text-[#4E616F] mt-1">{historyItem.comment}</p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-[#80959A] mt-1">
                            <User className="h-3 w-3" />
                            {historyItem.user?.name || `User #${historyItem.user_id}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#ABC0B9] flex justify-end flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
              >
                {t.close}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
