'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ShoppingCart,
  Package,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Filter,
  User,
  Calendar,
  Eye,
  X,
  Check,
  Clock,
  FileText,
  Link2,
  MessageSquare,
  Save,
  Edit3,
  Truck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { adminApi, amazonConfigApi, type AmazonConfig } from '@/lib/api';
import { getTranslatedText } from '@/lib/translations';
import type { PurchaseRequest, PurchaseRequestItem } from '@/types';
import type { DateRange } from 'react-day-picker';
import { useLanguage } from '@/contexts/LanguageContext';

type FilterType = 'amazon_cart' | 'pending_manual' | 'purchased' | 'delivered' | 'cancelled';

// Get display number - PO number if available (for approved orders), otherwise request number
const getDisplayNumber = (request: PurchaseRequest): string => {
  if (request.po_number) {
    return request.po_number;
  }
  return request.request_number;
};

export default function ApprovedOrdersPage() {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('pending_manual');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseRequest | null>(null);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderNumberError, setOrderNumberError] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Status change modals
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [statusChangeNotes, setStatusChangeNotes] = useState('');
  const [cancelNotesError, setCancelNotesError] = useState('');

  // Admin notes state
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState<Record<number, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<number | null>(null);

  // Date filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Amazon integration state
  const [amazonConfig, setAmazonConfig] = useState<AmazonConfig | null>(null);
  const isAmazonEnabled = amazonConfig?.is_active && amazonConfig?.has_password;

  const text = {
    en: {
      title: 'Orders',
      subtitle: 'Manage approved purchase requests',
      search: 'Search orders...',
      all: 'All',
      pendingPurchase: 'Pending',
      inCart: 'In Cart',
      purchased: 'Purchased',
      markPurchased: 'Mark as Purchased',
      retryCart: 'Retry',
      addToCart: 'Add to Cart',
      viewProduct: 'View',
      noOrders: 'No orders found',
      quantity: 'Qty',
      status: 'Status',
      approvedBy: 'Approved by',
      requester: 'Requester',
      cartError: 'Cart Error',
      pending: 'Pending',
      products: 'Products',
      total: 'Total',
      progress: 'Progress',
      addAllToCart: 'Add All to Cart',
      goToCart: 'Go to Cart',
      amazonConnected: 'Amazon: Connected',
      amazonDisconnected: 'Amazon: Disconnected',
      refresh: 'Refresh',
      export: 'Export',
      confirmPurchase: 'Confirm Purchase',
      orderNumberPlaceholder: 'Order/PO Number',
      orderNumberRequired: 'Order number is required',
      purchaseNotesPlaceholder: 'Purchase notes (tracking, delivery date, etc.)',
      notifyRequester: 'Notify requester',
      cancel: 'Cancel',
      confirmPurchaseBtn: 'Confirm Purchase',
      markDelivered: 'Mark Delivered',
      cancelOrder: 'Cancel Order',
      confirmDelivery: 'Confirm Delivery',
      confirmCancellation: 'Confirm Cancellation',
      deliveryNotes: 'Delivery notes (optional)',
      cancellationReason: 'Cancellation reason',
      cancellationRequired: 'Cancellation reason is required',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      itemsInCart: 'in cart',
      viewDetails: 'View Details',
      origin: 'Origin',
      external: 'External',
      catalog: 'Catalog',
      adminNotes: 'Internal Notes',
      adminNotesPlaceholder: 'Add internal notes (visible to admin & purchasing team)...',
      saveNotes: 'Save',
      editNotes: 'Edit',
      orderInfo: 'Order Info',
      openUrl: 'Open URL',
      amazonDisabled: 'Amazon integration disabled - open URLs manually',
    },
    zh: {
      title: '订单',
      subtitle: '管理已批准的采购请求',
      search: '搜索订单...',
      all: '全部',
      pendingPurchase: '待购买',
      inCart: '在购物车',
      purchased: '已购买',
      markPurchased: '标记为已购买',
      retryCart: '重试',
      addToCart: '加入购物车',
      viewProduct: '查看',
      noOrders: '未找到订单',
      quantity: '数量',
      status: '状态',
      approvedBy: '批准人',
      requester: '申请人',
      cartError: '购物车错误',
      pending: '待处理',
      products: '产品',
      total: '总计',
      progress: '进度',
      addAllToCart: '全部加入购物车',
      goToCart: '前往购物车',
      amazonConnected: 'Amazon: 已连接',
      amazonDisconnected: 'Amazon: 未连接',
      refresh: '刷新',
      export: '导出',
      confirmPurchase: '确认购买',
      orderNumberPlaceholder: '订单/PO号',
      orderNumberRequired: '订单号必填',
      purchaseNotesPlaceholder: '购买备注（追踪号、交货日期等）',
      notifyRequester: '通知申请人',
      cancel: '取消',
      confirmPurchaseBtn: '确认购买',
      markDelivered: '标记已交付',
      cancelOrder: '取消订单',
      confirmDelivery: '确认交付',
      confirmCancellation: '确认取消',
      deliveryNotes: '交付备注（可选）',
      cancellationReason: '取消原因',
      cancellationRequired: '取消原因必填',
      delivered: '已交付',
      cancelled: '已取消',
      itemsInCart: '在购物车',
      viewDetails: '查看详情',
      origin: '来源',
      external: '外部',
      catalog: '目录',
      adminNotes: '内部备注',
      adminNotesPlaceholder: '添加内部备注（管理员和采购团队可见）...',
      saveNotes: '保存',
      editNotes: '编辑',
      orderInfo: '订单信息',
      openUrl: '打开链接',
      amazonDisabled: 'Amazon集成已禁用 - 请手动打开链接',
    },
    es: {
      title: 'Órdenes',
      subtitle: 'Gestionar solicitudes de compra aprobadas',
      search: 'Buscar ordenes...',
      all: 'Todos',
      pendingPurchase: 'Pendientes',
      inCart: 'En Carrito',
      purchased: 'Comprados',
      markPurchased: 'Marcar Comprado',
      retryCart: 'Reintentar',
      addToCart: 'Agregar al Carrito',
      viewProduct: 'Ver',
      noOrders: 'No se encontraron pedidos',
      quantity: 'Cant',
      status: 'Estado',
      approvedBy: 'Aprobado por',
      requester: 'Solicitante',
      cartError: 'Error de Carrito',
      pending: 'Pendiente',
      products: 'Productos',
      total: 'Total',
      progress: 'Progreso',
      addAllToCart: 'Agregar Todo al Carrito',
      goToCart: 'Ir al Carrito',
      amazonConnected: 'Amazon: Conectado',
      amazonDisconnected: 'Amazon: Desconectado',
      refresh: 'Actualizar',
      export: 'Exportar',
      confirmPurchase: 'Confirmar Compra',
      orderNumberPlaceholder: 'Número de Orden/PO',
      orderNumberRequired: 'Número de orden requerido',
      purchaseNotesPlaceholder: 'Notas de compra (tracking, fecha de entrega, etc.)',
      notifyRequester: 'Notificar al solicitante',
      cancel: 'Cancelar',
      confirmPurchaseBtn: 'Confirmar Compra',
      markDelivered: 'Marcar Entregado',
      cancelOrder: 'Cancelar Pedido',
      confirmDelivery: 'Confirmar Entrega',
      confirmCancellation: 'Confirmar Cancelación',
      deliveryNotes: 'Notas de entrega (opcional)',
      cancellationReason: 'Razón de cancelación',
      cancellationRequired: 'Razón de cancelación requerida',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      itemsInCart: 'en carrito',
      viewDetails: 'Ver Detalles',
      origin: 'Origen',
      external: 'Externo',
      catalog: 'Catálogo',
      adminNotes: 'Notas Internas',
      adminNotesPlaceholder: 'Agregar notas internas (visibles para admin y equipo de compras)...',
      saveNotes: 'Guardar',
      editNotes: 'Editar',
      orderInfo: 'Info del Pedido',
      openUrl: 'Abrir URL',
      amazonDisabled: 'Integracion Amazon deshabilitada - abrir URLs manualmente',
    },
  };

  const t = text[language];

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getApprovedOrders({ filter });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAmazonConfig = async () => {
    try {
      const config = await amazonConfigApi.get();
      setAmazonConfig(config);
    } catch (error) {
      console.error('Failed to fetch Amazon config:', error);
    }
  };

  useEffect(() => {
    fetchAmazonConfig();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleMarkPurchased = async () => {
    if (!selectedOrder) return;

    // Validate order number is required
    if (!orderNumber.trim()) {
      setOrderNumberError(t.orderNumberRequired);
      return;
    }

    setOrderNumberError('');
    setProcessingId(selectedOrder.id);
    try {
      await adminApi.markAsPurchased(selectedOrder.id, purchaseNotes, orderNumber);
      setShowPurchaseModal(false);
      setSelectedOrder(null);
      setPurchaseNotes('');
      setOrderNumber('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark as purchased:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    setProcessingId(selectedOrder.id);
    try {
      await adminApi.markAsDelivered(selectedOrder.id, statusChangeNotes);
      setShowDeliveredModal(false);
      setSelectedOrder(null);
      setStatusChangeNotes('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    // Validate cancellation reason is required
    if (!statusChangeNotes.trim()) {
      setCancelNotesError(t.cancellationRequired);
      return;
    }

    setCancelNotesError('');
    setProcessingId(selectedOrder.id);
    try {
      await adminApi.cancelOrder(selectedOrder.id, statusChangeNotes);
      setShowCancelModal(false);
      setSelectedOrder(null);
      setStatusChangeNotes('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddToCart = async (orderId: number, itemId?: number) => {
    setProcessingId(orderId);
    try {
      await adminApi.addToCart(orderId, itemId);
      fetchOrders();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRetryCart = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      await adminApi.retryAddToCart(orderId);
      fetchOrders();
    } catch (error) {
      console.error('Failed to retry cart:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle saving admin notes
  const handleSaveAdminNotes = async (orderId: number) => {
    setSavingNotesId(orderId);
    try {
      await adminApi.updateOrderNotes(orderId, adminNotesInput[orderId] || '');
      setEditingNotesId(null);
      fetchOrders();
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSavingNotesId(null);
    }
  };

  // Start editing notes
  const startEditingNotes = (order: PurchaseRequest) => {
    setAdminNotesInput(prev => ({
      ...prev,
      [order.id]: order.admin_notes || ''
    }));
    setEditingNotesId(order.id);
  };

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
      cart_error: request.cart_error,
    }];
  };

  // Calculate cart progress
  const getCartProgress = (items: PurchaseRequestItem[]) => {
    const inCart = items.filter(item => item.added_to_cart).length;
    return { inCart, total: items.length };
  };

  // Calculate total
  const calculateTotal = (request: PurchaseRequest) => {
    const items = getProductItems(request);
    return items.reduce((sum, item) => sum + (item.estimated_price || 0) * item.quantity, 0);
  };

  const getItemStatusBadge = (item: PurchaseRequestItem) => {
    if (item.added_to_cart) {
      return (
        <Badge className="bg-[#ABC0B9]/30 text-[#2D363F] text-xs">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {t.inCart}
        </Badge>
      );
    }
    if (item.cart_error) {
      return (
        <Badge className="bg-[#AA2F0D]/20 text-[#AA2F0D] text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#F38756]/30 text-[#5C2F0E] text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  const getOrderStatusBadge = (order: PurchaseRequest) => {
    if (order.status === 'delivered') {
      return (
        <Badge className="bg-[#ABC0B9]/30 text-[#2D363F]">
          <Truck className="h-3 w-3 mr-1" />
          {t.delivered}
        </Badge>
      );
    }
    if (order.status === 'cancelled') {
      return (
        <Badge className="bg-[#AA2F0D]/20 text-[#AA2F0D]">
          <XCircle className="h-3 w-3 mr-1" />
          {t.cancelled}
        </Badge>
      );
    }
    if (order.status === 'purchased') {
      return (
        <Badge className="bg-[#ABC0B9]/30 text-[#2D363F]">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.purchased}
        </Badge>
      );
    }
    const items = getProductItems(order);
    const progress = getCartProgress(items);
    if (progress.inCart === progress.total && progress.total > 0) {
      return (
        <Badge className="bg-[#ABC0B9]/30 text-[#2D363F]">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {t.inCart}
        </Badge>
      );
    }
    if (progress.inCart > 0) {
      return (
        <Badge className="bg-[#F38756]/30 text-[#5C2F0E]">
          <Clock className="h-3 w-3 mr-1" />
          {progress.inCart}/{progress.total} {t.itemsInCart}
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#ABC0B9]/20 text-[#2D363F]">
        <Package className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: 'pending_manual', label: t.pendingPurchase },
    { key: 'amazon_cart', label: t.inCart },
    { key: 'purchased', label: t.purchased },
    { key: 'delivered', label: t.delivered },
    { key: 'cancelled', label: t.cancelled },
  ];

  // Count orders by status
  const pendingCount = orders.filter(o => o.status === 'approved' && !o.added_to_cart).length;
  const inCartCount = orders.filter(o => o.status === 'approved' && o.added_to_cart).length;
  const purchasedCount = orders.filter(o => o.status === 'purchased').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  // Filter orders by search and date range
  const filteredOrders = orders.filter((order) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        order.request_number?.toLowerCase().includes(query) ||
        order.po_number?.toLowerCase().includes(query) ||
        order.requester?.name?.toLowerCase().includes(query) ||
        order.product_title?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Filter by date range
    if (dateRange?.from) {
      const createdAt = new Date(order.approved_at || order.created_at);
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

  return (
    <div className="min-h-screen bg-[#FAFBFA] overflow-x-hidden">
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
              {isAmazonEnabled ? (
                <Badge variant="outline" className="bg-[#ABC0B9]/20 border-[#ABC0B9]-200 text-[#5C2F0E]">
                  {t.amazonConnected}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-[#ABC0B9]/20 border-[#ABC0B9] text-[#4E616F]">
                  {t.amazonDisconnected}
                </Badge>
              )}
              <Button
                variant="outline"
                onClick={fetchOrders}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {t.refresh}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          {/* Stats and Filters */}
          <div className="mb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-[#E95F20]">{pendingCount}</p>
                  <p className="text-sm text-[#4E616F]">{t.pendingPurchase}</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-[#4E616F]">{inCartCount}</p>
                  <p className="text-sm text-[#4E616F]">{t.inCart}</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-[#5C2F0E]">{purchasedCount}</p>
                  <p className="text-sm text-[#4E616F]">{t.purchased}</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-[#5C2F0E]">{deliveredCount}</p>
                  <p className="text-sm text-[#4E616F]">{t.delivered}</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-[#AA2F0D]">{cancelledCount}</p>
                  <p className="text-sm text-[#4E616F]">{t.cancelled}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex gap-2 flex-wrap items-center">
                <Filter className="h-5 w-5 text-white0" />
                {filters.map((f) => (
                  <Button
                    key={f.key}
                    variant={filter === f.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f.key)}
                    className={filter === f.key ? 'bg-[#5C2F0E] hover:bg-[#2D363F]' : ''}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row flex-1 gap-3 items-stretch sm:items-center md:ml-auto">
                <DateRangePicker
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  language={language}
                  className="w-full sm:w-auto"
                />
                <div className="w-full sm:flex-1 sm:min-w-[150px] sm:max-w-xs">
                  <Input
                    placeholder={t.search || 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#5C2F0E]" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-white0">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.noOrders}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const items = getProductItems(order);
                const progress = getCartProgress(items);
                const total = calculateTotal(order);

                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Order Header */}
                    <div className="p-4 md:p-6 border-b border-[#ABC0B9] bg-white">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-[#2D363F]">
                            {getDisplayNumber(order)}
                          </span>
                          {getOrderStatusBadge(order)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#4E616F]">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {order.requester?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-[#5C2F0E]" />
                            {order.approved_by?.name}
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
                                alt={getTranslatedText(item.product_title_translated, item.product_title, language)}
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
                            <div className="flex items-start gap-2">
                              <p className="font-medium text-[#2D363F] truncate">
                                {getTranslatedText(item.product_title_translated, item.product_title, language)}
                              </p>
                              {getItemStatusBadge(item)}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[#4E616F]">
                              <span>{t.quantity}: {item.quantity}</span>
                              <span className="font-medium text-[#5C2F0E]">
                                {item.currency}${((item.estimated_price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              {item.is_amazon_url && (
                                <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                                  Amazon
                                </Badge>
                              )}
                            </div>
                            {item.cart_error && (
                              <p className="text-xs text-[#AA2F0D] mt-1">
                                {item.cart_error}
                              </p>
                            )}
                          </div>

                          {/* Item Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(item.url, '_blank')}
                                title={t.openUrl}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                            {/* Only show Add to Cart when Amazon is enabled */}
                            {isAmazonEnabled && order.status !== 'purchased' && !item.added_to_cart && item.is_amazon_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddToCart(order.id, item.id)}
                                disabled={processingId === order.id}
                                title={t.addToCart}
                              >
                                {processingId === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ShoppingCart className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            {isAmazonEnabled && item.cart_error && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetryCart(order.id)}
                                disabled={processingId === order.id}
                                title={t.retryCart}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                            {item.added_to_cart && (
                              <CheckCircle className="h-5 w-5 text-[#5C2F0E]" />
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Admin Notes Section */}
                      <div className="mt-4 p-3 bg-white rounded-lg border border-[#ABC0B9]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#2D363F]">
                            <MessageSquare className="h-4 w-4 text-[#5C2F0E]" />
                            {t.adminNotes}
                          </div>
                          {editingNotesId !== order.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingNotes(order)}
                              className="h-7 px-2"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              {t.editNotes}
                            </Button>
                          )}
                        </div>

                        {editingNotesId === order.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={adminNotesInput[order.id] || ''}
                              onChange={(e) => setAdminNotesInput(prev => ({
                                ...prev,
                                [order.id]: e.target.value
                              }))}
                              placeholder={t.adminNotesPlaceholder}
                              rows={3}
                              className="w-full rounded-lg border border-[#ABC0B9] bg-white px-3 py-2 text-sm text-[#2D363F] placeholder:text-[#80959A] focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingNotesId(null)}
                              >
                                {t.cancel}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveAdminNotes(order.id)}
                                disabled={savingNotesId === order.id}
                                className="bg-[#5C2F0E] hover:bg-[#2D363F]"
                              >
                                {savingNotesId === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                {t.saveNotes}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-[#4E616F]">
                            {order.admin_notes ? getTranslatedText(order.admin_notes_translated, order.admin_notes, language) : t.adminNotesPlaceholder}
                          </p>
                        )}
                      </div>

                      {/* Purchase Info (visible when purchased) */}
                      {order.status === 'purchased' && (order.purchase_notes || order.order_number) && (
                        <div className="mt-3 p-3 bg-[#ABC0B9]/20 rounded-lg border border-[#ABC0B9]-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#2D363F] mb-2">
                            <FileText className="h-4 w-4" />
                            {t.orderInfo}
                          </div>
                          {order.order_number && (
                            <p className="text-sm text-[#5C2F0E]">
                              <span className="font-medium">Order #:</span> {order.order_number}
                            </p>
                          )}
                          {order.purchase_notes && (
                            <p className="text-sm text-[#5C2F0E] mt-1">{getTranslatedText(order.purchase_notes_translated, order.purchase_notes, language)}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Order Footer */}
                    <div className="px-4 md:px-6 py-4 bg-[#FAFBFA] border-t border-[#ABC0B9]">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Total and Progress */}
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-sm text-[#4E616F]">{t.total}</p>
                            <p className="text-xl font-bold text-[#5C2F0E]">
                              {order.currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          {order.status !== 'purchased' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <div>
                              <p className="text-sm text-[#4E616F]">{t.progress}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-[#ABC0B9] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#ABC0B9]/200 rounded-full transition-all"
                                    style={{ width: `${(progress.inCart / progress.total) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">
                                  {progress.inCart}/{progress.total}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {order.status !== 'purchased' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <>
                              {/* Only show Add All to Cart when Amazon is enabled */}
                              {isAmazonEnabled && items.some(i => i.is_amazon_url && !i.added_to_cart) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddToCart(order.id)}
                                  disabled={processingId === order.id}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  {t.addAllToCart}
                                </Button>
                              )}
                              {isAmazonEnabled && progress.inCart > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open('https://www.amazon.com.mx/gp/cart/view.html', '_blank')}
                                >
                                  <Link2 className="h-4 w-4 mr-2" />
                                  {t.goToCart}
                                </Button>
                              )}
                              <Button
                                className="bg-[#5C2F0E] hover:bg-[#2D363F] text-white"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowPurchaseModal(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t.markPurchased}
                              </Button>
                            </>
                          )}
                          {/* Status change buttons for purchased orders */}
                          {order.status === 'purchased' && (
                            <>
                              <Button
                                className="bg-[#5C2F0E] hover:bg-[#2D363F] text-white"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setStatusChangeNotes('');
                                  setShowDeliveredModal(true);
                                }}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                {t.markDelivered}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#AA2F0D]-300 text-[#AA2F0D] hover:bg-[#AA2F0D]/10"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setStatusChangeNotes('');
                                  setCancelNotesError('');
                                  setShowCancelModal(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {t.cancelOrder}
                              </Button>
                            </>
                          )}
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

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="p-6 border-b border-[#ABC0B9]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2D363F]">
                  {t.confirmPurchase}
                </h2>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedOrder(null);
                    setPurchaseNotes('');
                    setOrderNumber('');
                    setOrderNumberError('');
                  }}
                  className="text-[#80959A] hover:text-[#4E616F]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Summary */}
              <div className="bg-[#FAFBFA] rounded-lg p-4 border border-[#ABC0B9]">
                <p className="text-sm text-[#4E616F]">{getDisplayNumber(selectedOrder)}</p>
                <p className="font-medium text-[#2D363F]">{selectedOrder.requester?.name}</p>
                <div className="mt-2 space-y-1">
                  {getProductItems(selectedOrder).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="truncate">{getTranslatedText(item.product_title_translated, item.product_title, language)} (x{item.quantity})</span>
                      <span className="font-medium">
                        {item.currency}${((item.estimated_price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-[#ABC0B9] flex justify-between">
                  <span className="font-medium">{t.total}</span>
                  <span className="font-bold text-[#5C2F0E]">
                    {selectedOrder.currency}${calculateTotal(selectedOrder).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Order Number */}
              <div>
                <label className="block text-sm font-medium text-[#2D363F] mb-1">
                  {t.orderNumberPlaceholder} <span className="text-[#AA2F0D]">*</span>
                </label>
                <Input
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    if (e.target.value.trim()) setOrderNumberError('');
                  }}
                  placeholder="AMZ-123456789"
                  className={orderNumberError ? 'border-[#AA2F0D]-500' : ''}
                />
                {orderNumberError && (
                  <p className="mt-1 text-sm text-[#AA2F0D]">{orderNumberError}</p>
                )}
              </div>

              {/* Purchase Notes */}
              <div>
                <label className="block text-sm font-medium text-[#2D363F] mb-1">
                  {t.purchaseNotesPlaceholder}
                </label>
                <textarea
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder={t.purchaseNotesPlaceholder}
                  rows={3}
                  className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all placeholder:text-[#4E616F] focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                />
              </div>

              {/* Notify Checkbox */}
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-[#ABC0B9]" />
                <span className="text-sm text-[#4E616F]">{t.notifyRequester}</span>
              </label>
            </div>

            <div className="p-6 border-t border-[#ABC0B9] flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedOrder(null);
                  setPurchaseNotes('');
                  setOrderNumber('');
                  setOrderNumberError('');
                }}
              >
                {t.cancel}
              </Button>
              <Button
                className="bg-[#5C2F0E] hover:bg-[#2D363F] text-white"
                onClick={handleMarkPurchased}
                disabled={processingId !== null}
              >
                {processingId !== null ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {t.confirmPurchaseBtn}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Delivered Modal */}
      {showDeliveredModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="p-6 border-b border-[#ABC0B9]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2D363F]">
                  {t.confirmDelivery}
                </h2>
                <button
                  onClick={() => {
                    setShowDeliveredModal(false);
                    setSelectedOrder(null);
                    setStatusChangeNotes('');
                  }}
                  className="text-[#80959A] hover:text-[#4E616F]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Summary */}
              <div className="bg-[#FAFBFA] rounded-lg p-4 border border-[#ABC0B9]">
                <p className="text-sm text-[#4E616F]">{getDisplayNumber(selectedOrder)}</p>
                <p className="font-medium text-[#2D363F]">{selectedOrder.requester?.name}</p>
                {selectedOrder.order_number && (
                  <p className="text-sm text-[#4E616F] mt-1">
                    Order #: {selectedOrder.order_number}
                  </p>
                )}
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block text-sm font-medium text-[#2D363F] mb-1">
                  {t.deliveryNotes}
                </label>
                <textarea
                  value={statusChangeNotes}
                  onChange={(e) => setStatusChangeNotes(e.target.value)}
                  placeholder={t.deliveryNotes}
                  rows={3}
                  className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all placeholder:text-[#4E616F] focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#ABC0B9] flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeliveredModal(false);
                  setSelectedOrder(null);
                  setStatusChangeNotes('');
                }}
              >
                {t.cancel}
              </Button>
              <Button
                className="bg-[#5C2F0E] hover:bg-[#2D363F] text-white"
                onClick={handleMarkDelivered}
                disabled={processingId !== null}
              >
                {processingId !== null ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4 mr-2" />
                )}
                {t.markDelivered}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="p-6 border-b border-[#ABC0B9]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2D363F]">
                  {t.confirmCancellation}
                </h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedOrder(null);
                    setStatusChangeNotes('');
                    setCancelNotesError('');
                  }}
                  className="text-[#80959A] hover:text-[#4E616F]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Summary */}
              <div className="bg-[#FAFBFA] rounded-lg p-4 border border-[#ABC0B9]">
                <p className="text-sm text-[#4E616F]">{getDisplayNumber(selectedOrder)}</p>
                <p className="font-medium text-[#2D363F]">{selectedOrder.requester?.name}</p>
                {selectedOrder.order_number && (
                  <p className="text-sm text-[#4E616F] mt-1">
                    Order #: {selectedOrder.order_number}
                  </p>
                )}
              </div>

              {/* Cancellation Reason */}
              <div>
                <label className="block text-sm font-medium text-[#2D363F] mb-1">
                  {t.cancellationReason} <span className="text-[#AA2F0D]">*</span>
                </label>
                <textarea
                  value={statusChangeNotes}
                  onChange={(e) => {
                    setStatusChangeNotes(e.target.value);
                    if (e.target.value.trim()) setCancelNotesError('');
                  }}
                  placeholder={t.cancellationReason}
                  rows={3}
                  className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-[#2D363F] transition-all placeholder:text-[#4E616F] focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20 ${cancelNotesError ? 'border-[#AA2F0D]-500' : 'border-[#ABC0B9]'}`}
                />
                {cancelNotesError && (
                  <p className="mt-1 text-sm text-[#AA2F0D]">{cancelNotesError}</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-[#ABC0B9] flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrder(null);
                  setStatusChangeNotes('');
                  setCancelNotesError('');
                }}
              >
                {t.cancel}
              </Button>
              <Button
                className="bg-[#AA2F0D] hover:bg-[#AA2F0D] text-white"
                onClick={handleCancelOrder}
                disabled={processingId !== null}
              >
                {processingId !== null ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                {t.cancelOrder}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}