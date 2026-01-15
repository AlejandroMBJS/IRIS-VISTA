'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ShoppingCart,
  Package,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
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
  ArrowRight,
  CircleDot,
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

  // Item purchase confirmation modals
  const [showItemPurchaseModal, setShowItemPurchaseModal] = useState(false);
  const [showAllItemsPurchaseModal, setShowAllItemsPurchaseModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItemInfo, setSelectedItemInfo] = useState<{ title: string; quantity: number } | null>(null);

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<PurchaseRequest | null>(null);

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
      purchaseProgress: 'Purchase Progress',
      addAllToCart: 'Add All to Cart',
      goToCart: 'Go to Cart',
      markItemPurchased: 'Mark Purchased',
      markAllPurchased: 'Mark All Purchased',
      itemPurchased: 'Purchased',
      itemPending: 'Pending',
      confirmItemPurchase: 'Confirm Item Purchase',
      confirmAllItemsPurchase: 'Confirm All Items Purchase',
      confirmItemPurchaseMsg: 'Are you sure you want to mark this item as purchased?',
      confirmAllItemsPurchaseMsg: 'Are you sure you want to mark all items as purchased?',
      confirm: 'Confirm',
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
      // Action indicators
      actionRequired: 'Action Required',
      readyToPurchase: 'Ready to Purchase',
      awaitingDelivery: 'Awaiting Delivery',
      orderComplete: 'Complete',
      orderCancelled: 'Cancelled',
      nextStep: 'Next Step',
      purchaseItems: 'Purchase these items and mark as purchased',
      confirmDeliveryAction: 'Confirm delivery when items arrive',
      noActionNeeded: 'No action needed',
      approvedOn: 'Approved',
      purchasedOn: 'Purchased',
      deliveredOn: 'Delivered',
      cancelledOn: 'Cancelled',
      close: 'Close',
      justification: 'Justification',
      history: 'History',
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
      purchaseProgress: '采购进度',
      addAllToCart: '全部加入购物车',
      goToCart: '前往购物车',
      markItemPurchased: '标记已购',
      markAllPurchased: '全部标记已购',
      itemPurchased: '已购买',
      itemPending: '待购买',
      confirmItemPurchase: '确认购买商品',
      confirmAllItemsPurchase: '确认购买所有商品',
      confirmItemPurchaseMsg: '确定要将此商品标记为已购买吗？',
      confirmAllItemsPurchaseMsg: '确定要将所有商品标记为已购买吗？',
      confirm: '确认',
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
      // Action indicators
      actionRequired: '需要操作',
      readyToPurchase: '待购买',
      awaitingDelivery: '待交付',
      orderComplete: '已完成',
      orderCancelled: '已取消',
      nextStep: '下一步',
      purchaseItems: '购买这些商品并标记为已购买',
      confirmDeliveryAction: '商品到达后确认交付',
      noActionNeeded: '无需操作',
      approvedOn: '批准于',
      purchasedOn: '购买于',
      deliveredOn: '交付于',
      cancelledOn: '取消于',
      close: '关闭',
      justification: '理由',
      history: '历史',
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
      purchaseProgress: 'Progreso de Compra',
      addAllToCart: 'Agregar Todo al Carrito',
      goToCart: 'Ir al Carrito',
      markItemPurchased: 'Marcar Comprado',
      markAllPurchased: 'Marcar Todo Comprado',
      itemPurchased: 'Comprado',
      itemPending: 'Pendiente',
      confirmItemPurchase: 'Confirmar Compra de Producto',
      confirmAllItemsPurchase: 'Confirmar Compra de Todos',
      confirmItemPurchaseMsg: '¿Está seguro que desea marcar este producto como comprado?',
      confirmAllItemsPurchaseMsg: '¿Está seguro que desea marcar todos los productos como comprados?',
      confirm: 'Confirmar',
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
      // Action indicators
      actionRequired: 'Acción Requerida',
      readyToPurchase: 'Listo para Comprar',
      awaitingDelivery: 'Esperando Entrega',
      orderComplete: 'Completado',
      orderCancelled: 'Cancelado',
      nextStep: 'Siguiente Paso',
      purchaseItems: 'Comprar estos artículos y marcar como comprado',
      confirmDeliveryAction: 'Confirmar entrega cuando lleguen los artículos',
      noActionNeeded: 'Sin acción necesaria',
      approvedOn: 'Aprobado',
      purchasedOn: 'Comprado',
      deliveredOn: 'Entregado',
      cancelledOn: 'Cancelado',
      close: 'Cerrar',
      justification: 'Justificación',
      history: 'Historial',
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

  // Open confirmation modal for marking item as purchased
  const openItemPurchaseModal = (order: PurchaseRequest, itemId: number, itemTitle: string, itemQty: number) => {
    setSelectedOrder(order);
    setSelectedItemId(itemId);
    setSelectedItemInfo({ title: itemTitle, quantity: itemQty });
    setShowItemPurchaseModal(true);
  };

  // Open confirmation modal for marking all items as purchased
  const openAllItemsPurchaseModal = (order: PurchaseRequest) => {
    setSelectedOrder(order);
    setShowAllItemsPurchaseModal(true);
  };

  // Mark individual item as purchased (after confirmation)
  const handleConfirmItemPurchased = async () => {
    if (!selectedOrder || selectedItemId === null) return;
    setProcessingId(selectedOrder.id);
    try {
      await adminApi.markItemPurchased(selectedOrder.id, selectedItemId);
      setShowItemPurchaseModal(false);
      setSelectedOrder(null);
      setSelectedItemId(null);
      setSelectedItemInfo(null);
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark item as purchased:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // Mark all items as purchased (after confirmation)
  const handleConfirmAllItemsPurchased = async () => {
    if (!selectedOrder) return;
    setProcessingId(selectedOrder.id);
    try {
      await adminApi.markAllItemsPurchased(selectedOrder.id);
      setShowAllItemsPurchaseModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark all items as purchased:', error);
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
      is_purchased: request.status === 'purchased' || request.status === 'delivered',
      purchased_at: request.purchased_at,
    }];
  };

  // Calculate cart progress
  const getCartProgress = (items: PurchaseRequestItem[]) => {
    const inCart = items.filter(item => item.added_to_cart).length;
    return { inCart, total: items.length };
  };

  // Calculate purchase progress (items marked as purchased)
  const getPurchaseProgress = (items: PurchaseRequestItem[]) => {
    const purchased = items.filter(item => item.is_purchased).length;
    return { purchased, total: items.length };
  };

  // Calculate total
  const calculateTotal = (request: PurchaseRequest) => {
    const items = getProductItems(request);
    return items.reduce((sum, item) => sum + (item.estimated_price || 0) * item.quantity, 0);
  };

  const getItemStatusBadge = (item: PurchaseRequestItem) => {
    if (item.is_purchased) {
      return (
        <Badge className="bg-[#5C2F0E] text-white text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.itemPurchased}
        </Badge>
      );
    }
    if (item.added_to_cart) {
      return (
        <Badge className="bg-[#4E616F] text-white text-xs">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {t.inCart}
        </Badge>
      );
    }
    if (item.cart_error) {
      return (
        <Badge className="bg-[#AA2F0D] text-white text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#E95F20] text-white text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {t.itemPending}
      </Badge>
    );
  };

  const getOrderStatusBadge = (order: PurchaseRequest) => {
    if (order.status === 'delivered') {
      return (
        <Badge className="bg-[#5C2F0E] text-white">
          <Truck className="h-3 w-3 mr-1" />
          {t.delivered}
        </Badge>
      );
    }
    if (order.status === 'cancelled') {
      return (
        <Badge className="bg-[#AA2F0D] text-white">
          <XCircle className="h-3 w-3 mr-1" />
          {t.cancelled}
        </Badge>
      );
    }
    if (order.status === 'purchased') {
      return (
        <Badge className="bg-[#4E616F] text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.purchased}
        </Badge>
      );
    }
    const items = getProductItems(order);
    const progress = getCartProgress(items);
    if (progress.inCart === progress.total && progress.total > 0) {
      return (
        <Badge className="bg-[#4E616F] text-white">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {t.inCart}
        </Badge>
      );
    }
    if (progress.inCart > 0) {
      return (
        <Badge className="bg-[#F38756] text-white">
          <Clock className="h-3 w-3 mr-1" />
          {progress.inCart}/{progress.total} {t.itemsInCart}
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#E95F20] text-white">
        <Package className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  // Get action info for order - shows what action is needed
  const getActionInfo = (order: PurchaseRequest): {
    actionNeeded: boolean;
    actionLabel: string;
    actionDescription: string;
    actionColor: string;
    icon: React.ElementType;
  } => {
    if (order.status === 'delivered') {
      return {
        actionNeeded: false,
        actionLabel: t.orderComplete,
        actionDescription: t.noActionNeeded,
        actionColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircle,
      };
    }
    if (order.status === 'cancelled') {
      return {
        actionNeeded: false,
        actionLabel: t.orderCancelled,
        actionDescription: t.noActionNeeded,
        actionColor: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: XCircle,
      };
    }
    if (order.status === 'purchased') {
      return {
        actionNeeded: true,
        actionLabel: t.awaitingDelivery,
        actionDescription: t.confirmDeliveryAction,
        actionColor: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Truck,
      };
    }
    // Status is approved - needs to be purchased
    return {
      actionNeeded: true,
      actionLabel: t.readyToPurchase,
      actionDescription: t.purchaseItems,
      actionColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: ShoppingCart,
    };
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                <Filter className="h-5 w-5 text-[#4E616F]" />
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
              <CardContent className="py-12 text-center text-[#4E616F]">
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
                const actionInfo = getActionInfo(order);
                const ActionIcon = actionInfo.icon;

                // Handle card click to show details
                const handleCardClick = () => {
                  setDetailsOrder(order);
                  setShowDetailsModal(true);
                };

                return (
                  <Card
                    key={order.id}
                    className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${actionInfo.actionNeeded ? (order.status === 'purchased' ? 'ring-2 ring-blue-200' : 'ring-2 ring-amber-200') : ''}`}
                    onClick={handleCardClick}
                  >
                    {/* Action Required Banner */}
                    {actionInfo.actionNeeded && (
                      <div className={`px-4 py-2 ${order.status === 'purchased' ? 'bg-blue-50' : 'bg-amber-50'} border-b ${order.status === 'purchased' ? 'border-blue-100' : 'border-amber-100'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${order.status === 'purchased' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                            <ActionIcon className={`h-4 w-4 ${order.status === 'purchased' ? 'text-blue-600' : 'text-amber-600'}`} />
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-semibold ${order.status === 'purchased' ? 'text-blue-800' : 'text-amber-800'}`}>
                              {actionInfo.actionLabel}
                            </span>
                            <span className={`hidden sm:inline text-sm ${order.status === 'purchased' ? 'text-blue-600' : 'text-amber-600'} ml-2`}>
                              — {actionInfo.actionDescription}
                            </span>
                          </div>
                          <ArrowRight className={`h-4 w-4 ${order.status === 'purchased' ? 'text-blue-400' : 'text-amber-400'}`} />
                        </div>
                      </div>
                    )}

                    {/* Order Header */}
                    <div className="p-4 md:p-6 border-b border-[#ABC0B9] bg-white">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-[#2D363F]">
                            {getDisplayNumber(order)}
                          </span>
                          {getOrderStatusBadge(order)}
                          {!actionInfo.actionNeeded && (
                            <Badge className={`${actionInfo.actionColor} border`}>
                              <ActionIcon className="h-3 w-3 mr-1" />
                              {actionInfo.actionLabel}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#4E616F]">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {order.requester?.name}
                          </span>
                          <span className="flex items-center gap-1" title={t.approvedOn}>
                            <Check className="h-4 w-4 text-[#5C2F0E]" />
                            {order.approved_by?.name}
                            {order.approved_at && (
                              <span className="text-xs text-[#80959A] ml-1">
                                {formatDate(order.approved_at)}
                              </span>
                            )}
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
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {item.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(item.url, '_blank');
                                }}
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
                            {/* Mark individual item as purchased */}
                            {order.status !== 'purchased' && order.status !== 'delivered' && order.status !== 'cancelled' && !item.is_purchased && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openItemPurchaseModal(order, item.id, getTranslatedText(item.product_title_translated, item.product_title, language) || 'Product', item.quantity);
                                }}
                                disabled={processingId === order.id}
                                className="border-[#5C2F0E] text-[#5C2F0E] hover:bg-[#5C2F0E]/10"
                                title={t.markItemPurchased}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                            {item.is_purchased && (
                              <CheckCircle className="h-5 w-5 text-[#5C2F0E]" />
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Admin Notes Section */}
                      <div className="mt-4 p-3 bg-white rounded-lg border border-[#ABC0B9]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#2D363F]">
                            <MessageSquare className="h-4 w-4 text-[#5C2F0E]" />
                            {t.adminNotes}
                          </div>
                          {editingNotesId !== order.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingNotes(order);
                              }}
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

                      {/* Order Timeline - shows progress through stages */}
                      {(order.status === 'purchased' || order.status === 'delivered' || order.status === 'cancelled') && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#2D363F] mb-3">
                            <Clock className="h-4 w-4" />
                            {t.orderInfo}
                          </div>

                          {/* Timeline */}
                          <div className="space-y-3">
                            {/* Approved */}
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-emerald-600" />
                                </div>
                                {(order.status !== 'cancelled' || order.purchased_at) && (
                                  <div className="w-0.5 h-6 bg-emerald-200" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pb-1">
                                <p className="text-sm font-medium text-emerald-800">{t.approvedOn}</p>
                                <p className="text-xs text-slate-500">{formatDate(order.approved_at)}</p>
                                <p className="text-xs text-slate-400">{order.approved_by?.name}</p>
                              </div>
                            </div>

                            {/* Purchased */}
                            {order.purchased_at && (
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full ${order.status === 'cancelled' ? 'bg-gray-100' : 'bg-blue-100'} flex items-center justify-center`}>
                                    <ShoppingCart className={`h-3 w-3 ${order.status === 'cancelled' ? 'text-gray-500' : 'text-blue-600'}`} />
                                  </div>
                                  {order.status !== 'purchased' && (
                                    <div className={`w-0.5 h-6 ${order.status === 'cancelled' ? 'bg-gray-200' : 'bg-blue-200'}`} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 pb-1">
                                  <p className={`text-sm font-medium ${order.status === 'cancelled' ? 'text-gray-600' : 'text-blue-800'}`}>{t.purchasedOn}</p>
                                  <p className="text-xs text-slate-500">{formatDate(order.purchased_at)}</p>
                                  {order.purchased_by && (
                                    <p className="text-xs text-slate-400">{order.purchased_by.name}</p>
                                  )}
                                  {order.order_number && (
                                    <p className="text-xs font-medium text-slate-600 mt-0.5">Order #: {order.order_number}</p>
                                  )}
                                  {order.purchase_notes && (
                                    <p className="text-xs text-slate-400 mt-0.5">{getTranslatedText(order.purchase_notes_translated, order.purchase_notes, language)}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Delivered */}
                            {order.status === 'delivered' && order.delivered_at && (
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Truck className="h-3 w-3 text-emerald-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-emerald-800">{t.deliveredOn}</p>
                                  <p className="text-xs text-slate-500">{formatDate(order.delivered_at)}</p>
                                  {order.delivered_by && (
                                    <p className="text-xs text-slate-400">{order.delivered_by.name}</p>
                                  )}
                                  {order.delivery_notes && (
                                    <p className="text-xs text-emerald-600 mt-0.5">{getTranslatedText(order.delivery_notes_translated, order.delivery_notes, language)}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Cancelled */}
                            {order.status === 'cancelled' && order.cancelled_at && (
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                    <XCircle className="h-3 w-3 text-red-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-red-800">{t.cancelledOn}</p>
                                  <p className="text-xs text-slate-500">{formatDate(order.cancelled_at)}</p>
                                  {order.cancelled_by && (
                                    <p className="text-xs text-slate-400">{order.cancelled_by.name}</p>
                                  )}
                                  {order.cancellation_notes && (
                                    <p className="text-xs text-red-600 mt-0.5">{getTranslatedText(order.cancellation_notes_translated, order.cancellation_notes, language)}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
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
                          {/* Purchase Progress Bar */}
                          {order.status !== 'purchased' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <div>
                              <p className="text-sm text-[#4E616F]">{t.purchaseProgress}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-3 bg-[#ABC0B9]/30 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#5C2F0E] rounded-full transition-all"
                                    style={{ width: `${(getPurchaseProgress(items).purchased / getPurchaseProgress(items).total) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-[#5C2F0E]">
                                  {getPurchaseProgress(items).purchased}/{getPurchaseProgress(items).total}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          {order.status !== 'purchased' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <>
                              {/* Only show Add All to Cart when Amazon is enabled */}
                              {isAmazonEnabled && items.some(i => i.is_amazon_url && !i.added_to_cart) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(order.id);
                                  }}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open('https://www.amazon.com.mx/gp/cart/view.html', '_blank');
                                  }}
                                >
                                  <Link2 className="h-4 w-4 mr-2" />
                                  {t.goToCart}
                                </Button>
                              )}
                              {/* Mark All Items Purchased */}
                              {items.some(i => !i.is_purchased) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAllItemsPurchaseModal(order);
                                  }}
                                  disabled={processingId === order.id}
                                  className="border-[#5C2F0E] text-[#5C2F0E] hover:bg-[#5C2F0E]/10"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {t.markAllPurchased}
                                </Button>
                              )}
                              <Button
                                className="bg-[#5C2F0E] hover:bg-[#2D363F] text-white"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                onClick={(e) => {
                                  e.stopPropagation();
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
                  className="text-[#4E616F] hover:text-[#2D363F]"
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
                  className="text-[#4E616F] hover:text-[#2D363F]"
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
                  className="text-[#4E616F] hover:text-[#2D363F]"
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

      {/* Order Details Modal */}
      {showDetailsModal && detailsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] p-6 rounded-t-xl flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-2xl text-white font-semibold mb-1">
                  {getDisplayNumber(detailsOrder)}
                </h2>
                <div className="flex items-center gap-2">
                  {getOrderStatusBadge(detailsOrder)}
                  <span className="text-white/80 text-sm">
                    {formatDate(detailsOrder.approved_at || detailsOrder.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsOrder(null);
                }}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Requester and Approver */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#4E616F]" />
                  <span className="text-[#4E616F]">{t.requester}:</span>
                  <span className="font-medium text-[#2D363F]">{detailsOrder.requester?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#5C2F0E]" />
                  <span className="text-[#4E616F]">{t.approvedBy}:</span>
                  <span className="font-medium text-[#2D363F]">{detailsOrder.approved_by?.name}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="text-sm font-semibold text-[#2D363F] mb-3">
                  {t.products} ({getProductItems(detailsOrder).length})
                </p>
                <div className="space-y-3">
                  {getProductItems(detailsOrder).map((item, idx) => (
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
                              {item.currency || 'MXN'} ${(item.estimated_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {item.is_amazon_url && (
                            <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                              Amazon
                            </Badge>
                          )}
                          {getItemStatusBadge(item)}
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#5C2F0E] hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t.openUrl}
                          </a>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {item.estimated_price && (
                          <p className="font-bold text-[#2D363F]">
                            ${(item.estimated_price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  {detailsOrder.currency} ${calculateTotal(detailsOrder).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Admin Notes */}
              {detailsOrder.admin_notes && (
                <div className="p-3 bg-[#5C2F0E]/5 border border-[#5C2F0E]/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-[#5C2F0E]" />
                    <p className="text-sm font-medium text-[#5C2F0E]">{t.adminNotes}:</p>
                  </div>
                  <p className="text-sm text-[#4E616F]">{getTranslatedText(detailsOrder.admin_notes_translated, detailsOrder.admin_notes, language)}</p>
                </div>
              )}

              {/* Order Timeline */}
              {(detailsOrder.status === 'purchased' || detailsOrder.status === 'delivered' || detailsOrder.status === 'cancelled') && (
                <div className="p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#2D363F] mb-3">
                    <Clock className="h-4 w-4" />
                    {t.history}
                  </div>
                  <div className="space-y-3">
                    {/* Approved */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <div className="w-0.5 h-6 bg-emerald-200" />
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm font-medium text-emerald-800">{t.approvedOn}</p>
                        <p className="text-xs text-slate-500">{formatDate(detailsOrder.approved_at)}</p>
                        <p className="text-xs text-slate-400">{detailsOrder.approved_by?.name}</p>
                      </div>
                    </div>

                    {/* Purchased */}
                    {detailsOrder.purchased_at && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <ShoppingCart className="h-3 w-3 text-blue-600" />
                          </div>
                          {detailsOrder.status !== 'purchased' && (
                            <div className="w-0.5 h-6 bg-blue-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-sm font-medium text-blue-800">{t.purchasedOn}</p>
                          <p className="text-xs text-slate-500">{formatDate(detailsOrder.purchased_at)}</p>
                          {detailsOrder.purchased_by && (
                            <p className="text-xs text-slate-400">{detailsOrder.purchased_by.name}</p>
                          )}
                          {detailsOrder.order_number && (
                            <p className="text-xs font-medium text-slate-600 mt-0.5">Order #: {detailsOrder.order_number}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delivered */}
                    {detailsOrder.status === 'delivered' && detailsOrder.delivered_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Truck className="h-3 w-3 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-emerald-800">{t.deliveredOn}</p>
                          <p className="text-xs text-slate-500">{formatDate(detailsOrder.delivered_at)}</p>
                        </div>
                      </div>
                    )}

                    {/* Cancelled */}
                    {detailsOrder.status === 'cancelled' && detailsOrder.cancelled_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="h-3 w-3 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-800">{t.cancelledOn}</p>
                          <p className="text-xs text-slate-500">{formatDate(detailsOrder.cancelled_at)}</p>
                          {detailsOrder.cancellation_notes && (
                            <p className="text-xs text-red-600 mt-0.5">{getTranslatedText(detailsOrder.cancellation_notes_translated, detailsOrder.cancellation_notes, language)}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#ABC0B9] flex justify-end flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsOrder(null);
                }}
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