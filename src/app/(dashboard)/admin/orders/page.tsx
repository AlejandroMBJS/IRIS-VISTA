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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import type { PurchaseRequest, PurchaseRequestItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

type FilterType = 'all' | 'amazon_cart' | 'pending_manual' | 'purchased';

export default function ApprovedOrdersPage() {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('pending_manual');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseRequest | null>(null);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Admin notes state
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState<Record<number, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<number | null>(null);

  const text = {
    en: {
      title: 'Approved Orders',
      subtitle: 'Manage approved purchase requests',
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
      orderNumberPlaceholder: 'Order/PO Number (optional)',
      purchaseNotesPlaceholder: 'Purchase notes (tracking, delivery date, etc.)',
      notifyRequester: 'Notify requester',
      cancel: 'Cancel',
      confirmPurchaseBtn: 'Confirm Purchase',
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
    },
    zh: {
      title: '已批准订单',
      subtitle: '管理已批准的采购请求',
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
      orderNumberPlaceholder: '订单/PO号（可选）',
      purchaseNotesPlaceholder: '购买备注（追踪号、交货日期等）',
      notifyRequester: '通知申请人',
      cancel: '取消',
      confirmPurchaseBtn: '确认购买',
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
    },
    es: {
      title: 'Pedidos Aprobados',
      subtitle: 'Gestionar solicitudes de compra aprobadas',
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
      orderNumberPlaceholder: 'Número de Orden/PO (opcional)',
      purchaseNotesPlaceholder: 'Notas de compra (tracking, fecha de entrega, etc.)',
      notifyRequester: 'Notificar al solicitante',
      cancel: 'Cancelar',
      confirmPurchaseBtn: 'Confirmar Compra',
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

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleMarkPurchased = async () => {
    if (!selectedOrder) return;
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
      product_image_url: request.product_image_url || '',
      product_description: request.product_description,
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
        <Badge className="bg-blue-100 text-blue-800 text-xs">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {t.inCart}
        </Badge>
      );
    }
    if (item.cart_error) {
      return (
        <Badge className="bg-red-100 text-red-800 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  const getOrderStatusBadge = (order: PurchaseRequest) => {
    if (order.status === 'purchased') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.purchased}
        </Badge>
      );
    }
    const items = getProductItems(order);
    const progress = getCartProgress(items);
    if (progress.inCart === progress.total && progress.total > 0) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {t.inCart}
        </Badge>
      );
    }
    if (progress.inCart > 0) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          {progress.inCart}/{progress.total} {t.itemsInCart}
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800">
        <Package className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: 'pending_manual', label: t.pendingPurchase },
    { key: 'amazon_cart', label: t.inCart },
    { key: 'purchased', label: t.purchased },
    { key: 'all', label: t.all },
  ];

  // Count orders by status
  const pendingCount = orders.filter(o => o.status === 'approved' && !o.added_to_cart).length;
  const inCartCount = orders.filter(o => o.status === 'approved' && o.added_to_cart).length;
  const purchasedCount = orders.filter(o => o.status === 'purchased').length;

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <section className="border-b border-[#E4E1DD] bg-white px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl text-[#2C2C2C] font-semibold">
                {t.title}
              </h1>
              <p className="text-sm md:text-base text-[#6E6B67] mt-1">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                {t.amazonConnected}
              </Badge>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                  <p className="text-sm text-gray-600">{t.pendingPurchase}</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{inCartCount}</p>
                  <p className="text-sm text-gray-600">{t.inCart}</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{purchasedCount}</p>
                  <p className="text-sm text-gray-600">{t.purchased}</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-[#75534B]">{orders.length}</p>
                  <p className="text-sm text-gray-600">{t.all}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-gray-500 mt-2" />
              {filters.map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f.key)}
                  className={filter === f.key ? 'bg-[#75534B] hover:bg-[#5D423C]' : ''}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#75534B]" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.noOrders}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const items = getProductItems(order);
                const progress = getCartProgress(items);
                const total = calculateTotal(order);

                return (
                  <Card key={order.id} className="overflow-hidden">
                    {/* Order Header */}
                    <div className="p-4 md:p-6 border-b border-[#E4E1DD] bg-white">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-[#2C2C2C]">
                            {order.request_number}
                          </span>
                          {getOrderStatusBadge(order)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#6E6B67]">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {order.requester?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-600" />
                            {order.approved_by?.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products List */}
                    <div className="p-4 md:p-6 space-y-3">
                      <p className="text-sm font-medium text-[#6E6B67]">
                        {t.products} ({items.length}):
                      </p>

                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-3 bg-[#F9F8F6] rounded-lg border border-[#E4E1DD]"
                        >
                          {/* Product Image */}
                          {item.product_image_url ? (
                            <div className="w-16 h-16 rounded bg-white border border-[#E4E1DD] overflow-hidden flex-shrink-0">
                              <Image
                                src={item.product_image_url}
                                alt={item.product_title}
                                width={64}
                                height={64}
                                className="object-contain w-full h-full"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded bg-[#E4E1DD] flex items-center justify-center flex-shrink-0">
                              <Package className="h-6 w-6 text-[#6E6B67]" />
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <p className="font-medium text-[#2C2C2C] truncate">
                                {item.product_title}
                              </p>
                              {getItemStatusBadge(item)}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[#6E6B67]">
                              <span>{t.quantity}: {item.quantity}</span>
                              <span className="font-medium text-[#75534B]">
                                {item.currency}${((item.estimated_price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              {item.is_amazon_url && (
                                <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                                  Amazon
                                </Badge>
                              )}
                            </div>
                            {item.cart_error && (
                              <p className="text-xs text-red-600 mt-1">
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
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                            {order.status !== 'purchased' && !item.added_to_cart && item.is_amazon_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddToCart(order.id, item.id)}
                                disabled={processingId === order.id}
                              >
                                {processingId === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ShoppingCart className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            {item.cart_error && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetryCart(order.id)}
                                disabled={processingId === order.id}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                            {item.added_to_cart && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Admin Notes Section */}
                      <div className="mt-4 p-3 bg-white rounded-lg border border-[#E4E1DD]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#2C2C2C]">
                            <MessageSquare className="h-4 w-4 text-[#75534B]" />
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
                              className="w-full rounded-lg border border-[#E4E1DD] bg-white px-3 py-2 text-sm text-[#2C2C2C] placeholder:text-[#9B9792] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
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
                                className="bg-[#75534B] hover:bg-[#5D423C]"
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
                          <p className="text-sm text-[#6E6B67]">
                            {order.admin_notes || t.adminNotesPlaceholder}
                          </p>
                        )}
                      </div>

                      {/* Purchase Info (visible when purchased) */}
                      {order.status === 'purchased' && (order.purchase_notes || order.order_number) && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
                            <FileText className="h-4 w-4" />
                            {t.orderInfo}
                          </div>
                          {order.order_number && (
                            <p className="text-sm text-green-700">
                              <span className="font-medium">Order #:</span> {order.order_number}
                            </p>
                          )}
                          {order.purchase_notes && (
                            <p className="text-sm text-green-700 mt-1">{order.purchase_notes}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Order Footer */}
                    <div className="px-4 md:px-6 py-4 bg-[#F9F8F6] border-t border-[#E4E1DD]">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Total and Progress */}
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-sm text-[#6E6B67]">{t.total}</p>
                            <p className="text-xl font-bold text-[#75534B]">
                              {order.currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          {order.status !== 'purchased' && (
                            <div>
                              <p className="text-sm text-[#6E6B67]">{t.progress}</p>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-[#E4E1DD] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
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
                          {order.status !== 'purchased' && (
                            <>
                              {items.some(i => i.is_amazon_url && !i.added_to_cart) && (
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
                              {progress.inCart > 0 && (
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
                                className="bg-green-600 hover:bg-green-700 text-white"
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
            <div className="p-6 border-b border-[#E4E1DD]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2C2C2C]">
                  {t.confirmPurchase}
                </h2>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedOrder(null);
                    setPurchaseNotes('');
                    setOrderNumber('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Summary */}
              <div className="bg-[#F9F8F6] rounded-lg p-4 border border-[#E4E1DD]">
                <p className="text-sm text-[#6E6B67]">{selectedOrder.request_number}</p>
                <p className="font-medium text-[#2C2C2C]">{selectedOrder.requester?.name}</p>
                <div className="mt-2 space-y-1">
                  {getProductItems(selectedOrder).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="truncate">{item.product_title} (x{item.quantity})</span>
                      <span className="font-medium">
                        {item.currency}${((item.estimated_price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-[#E4E1DD] flex justify-between">
                  <span className="font-medium">{t.total}</span>
                  <span className="font-bold text-[#75534B]">
                    {selectedOrder.currency}${calculateTotal(selectedOrder).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Order Number */}
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                  {t.orderNumberPlaceholder}
                </label>
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="AMZ-123456789"
                />
              </div>

              {/* Purchase Notes */}
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                  {t.purchaseNotesPlaceholder}
                </label>
                <textarea
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder={t.purchaseNotesPlaceholder}
                  rows={3}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                />
              </div>

              {/* Notify Checkbox */}
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                <span className="text-sm text-[#6E6B67]">{t.notifyRequester}</span>
              </label>
            </div>

            <div className="p-6 border-t border-[#E4E1DD] flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPurchaseModal(false);
                  setSelectedOrder(null);
                  setPurchaseNotes('');
                  setOrderNumber('');
                }}
              >
                {t.cancel}
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
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
    </div>
  );
}
