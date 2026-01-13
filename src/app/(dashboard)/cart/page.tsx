'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  Package,
  ExternalLink,
  Zap,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { purchaseRequestsApi, type CreatePurchaseRequestItemInput } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

// Format price with decimals
const formatPrice = (price: number): string => {
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function CartPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const { items, itemCount, total, currency, updateItem, removeItem, clearCart, isLoading } = useCart();

  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const text = {
    en: {
      title: 'Shopping Cart',
      subtitle: 'Review your items before submitting',
      emptyCart: 'Your cart is empty',
      emptyCartDesc: 'Add products from the catalog or e-commerce links',
      startShopping: 'Start Shopping',
      product: 'Product',
      quantity: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal',
      remove: 'Remove',
      clearCart: 'Clear Cart',
      justification: 'Justification',
      justificationPlaceholder: 'Why do you need these products?',
      justificationRequired: 'Please provide a justification',
      urgency: 'Urgency',
      normal: 'Normal',
      urgent: 'Urgent',
      summary: 'Order Summary',
      items: 'items',
      totalEstimated: 'Total Estimated',
      submitRequest: 'Submit Purchase Request',
      submitting: 'Submitting...',
      success: 'Request Submitted!',
      successMessage: 'Your purchase request has been sent for approval.',
      viewRequests: 'View My Requests',
      createAnother: 'Create Another',
      approvalNote: 'Once submitted, your request will be sent to the General Manager for approval.',
      amazonBadge: 'Amazon - Auto Cart',
      catalogBadge: 'From Catalog',
      ecommerceBadge: 'E-commerce',
      back: 'Continue Shopping',
    },
    zh: {
      title: '购物车',
      subtitle: '提交前检查您的商品',
      emptyCart: '购物车是空的',
      emptyCartDesc: '从目录或电商链接添加产品',
      startShopping: '开始购物',
      product: '产品',
      quantity: '数量',
      price: '价格',
      subtotal: '小计',
      remove: '删除',
      clearCart: '清空购物车',
      justification: '申请理由',
      justificationPlaceholder: '为什么需要这些产品？',
      justificationRequired: '请提供申请理由',
      urgency: '紧急程度',
      normal: '普通',
      urgent: '紧急',
      summary: '订单摘要',
      items: '个商品',
      totalEstimated: '预估总额',
      submitRequest: '提交采购请求',
      submitting: '提交中...',
      success: '请求已提交！',
      successMessage: '您的采购请求已发送等待审批。',
      viewRequests: '查看我的请求',
      createAnother: '再创建一个',
      approvalNote: '提交后，您的请求将发送给总经理审批。',
      amazonBadge: 'Amazon - 自动加购',
      catalogBadge: '来自目录',
      ecommerceBadge: '电商',
      back: '继续购物',
    },
    es: {
      title: 'Carrito de Compras',
      subtitle: 'Revisa tus productos antes de enviar',
      emptyCart: 'Tu carrito esta vacio',
      emptyCartDesc: 'Agrega productos del catalogo o enlaces de e-commerce',
      startShopping: 'Comenzar a Comprar',
      product: 'Producto',
      quantity: 'Cant',
      price: 'Precio',
      subtotal: 'Subtotal',
      remove: 'Eliminar',
      clearCart: 'Vaciar Carrito',
      justification: 'Justificacion',
      justificationPlaceholder: 'Por que necesitas estos productos?',
      justificationRequired: 'Por favor proporciona una justificacion',
      urgency: 'Urgencia',
      normal: 'Normal',
      urgent: 'Urgente',
      summary: 'Resumen del Pedido',
      items: 'productos',
      totalEstimated: 'Total Estimado',
      submitRequest: 'Enviar Solicitud de Compra',
      submitting: 'Enviando...',
      success: 'Solicitud Enviada!',
      successMessage: 'Tu solicitud de compra ha sido enviada para aprobacion.',
      viewRequests: 'Ver Mis Solicitudes',
      createAnother: 'Crear Otra',
      approvalNote: 'Una vez enviada, la solicitud sera enviada al Gerente General para aprobacion.',
      amazonBadge: 'Amazon - Carrito Auto',
      catalogBadge: 'Del Catalogo',
      ecommerceBadge: 'E-commerce',
      back: 'Seguir Comprando',
    },
  };

  const t = text[language];

  const handleQuantityChange = async (id: number, delta: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
      await removeItem(id);
    } else {
      await updateItem(id, { quantity: newQuantity });
    }
  };

  const handleSubmit = async () => {
    if (!justification.trim()) {
      setError(t.justificationRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert cart items to purchase request items
      const requestItems: CreatePurchaseRequestItemInput[] = items.map(item => ({
        url: item.url,
        quantity: item.quantity,
        product_title: item.product_title,
        product_image_url: item.product_image_url,
        product_description: item.product_description,
        estimated_price: item.estimated_price,
        currency: item.currency,
      }));

      await purchaseRequestsApi.create({
        items: requestItems,
        justification,
        urgency,
      });

      // Clear cart after successful submission
      await clearCart();
      setSuccess(true);
    } catch (err) {
      console.error('Failed to submit request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-[#2C2C2C] mb-2">{t.success}</h2>
          <p className="text-[#6E6B67] mb-6">{t.successMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/requests')}
              className="flex-1 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 py-3 text-white font-medium"
            >
              {t.viewRequests}
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setJustification('');
                setUrgency('normal');
                router.push('/purchase/new');
              }}
              className="flex-1 rounded-lg border border-[#E4E1DD] px-4 py-3 text-[#2C2C2C] font-medium hover:bg-[#F9F8F6]"
            >
              {t.createAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (!isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        {/* Header */}
        <section className="border-b border-[#E4E1DD] bg-white px-4 sm:px-8 py-6 sm:py-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#75534B] to-[#5D423C] flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
                  {t.title}
                </h1>
                <p className="text-sm sm:text-base text-[#6E6B67]">{t.subtitle}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 bg-[#E4E1DD] rounded-full flex items-center justify-center mb-6">
            <ShoppingCart className="h-10 w-10 text-[#9B9792]" />
          </div>
          <h2 className="text-xl font-semibold text-[#2C2C2C] mb-2">{t.emptyCart}</h2>
          <p className="text-[#6E6B67] mb-6 text-center">{t.emptyCartDesc}</p>
          <Link
            href="/purchase/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-6 py-3 text-white font-medium hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            {t.startShopping}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <section className="border-b border-[#E4E1DD] bg-white px-4 sm:px-8 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/purchase/new"
              className="p-2 hover:bg-[#F9F8F6] rounded-lg transition-colors -ml-2"
            >
              <ArrowLeft className="h-5 w-5 text-[#6E6B67]" />
            </Link>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#75534B] to-[#5D423C] flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
                {t.title}
              </h1>
              <p className="text-sm sm:text-base text-[#6E6B67]">{t.subtitle}</p>
            </div>
            <button
              onClick={() => clearCart()}
              className="text-sm text-[#D1625B] hover:text-[#B04840] font-medium hidden sm:block"
            >
              {t.clearCart}
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-[#E4E1DD] p-4 sm:p-6"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_title}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-[#9B9792]" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#2C2C2C] text-sm sm:text-base line-clamp-2">
                            {item.product_title || item.url}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {item.is_amazon_url ? (
                              <Badge className="bg-[#E08A4B]/10 text-[#E08A4B] border-[#E08A4B]/30 text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                {t.amazonBadge}
                              </Badge>
                            ) : item.source === 'catalog' ? (
                              <Badge className="bg-[#75534B]/10 text-[#75534B] border-[#75534B]/30 text-xs">
                                {t.catalogBadge}
                              </Badge>
                            ) : (
                              <Badge className="bg-[#6E6B67]/10 text-[#6E6B67] border-[#6E6B67]/30 text-xs">
                                {t.ecommerceBadge}
                              </Badge>
                            )}
                            {item.url && !item.url.startsWith('catalog://') && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#75534B] hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-[#D1625B] hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E4E1DD] text-[#6E6B67] hover:bg-[#F9F8F6] transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium text-[#2C2C2C]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E4E1DD] text-[#6E6B67] hover:bg-[#F9F8F6] transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          {item.estimated_price > 0 ? (
                            <>
                              <p className="text-sm text-[#6E6B67]">
                                {item.currency} ${formatPrice(item.estimated_price)} x {item.quantity}
                              </p>
                              <p className="font-bold text-[#75534B]">
                                {item.currency} ${formatPrice(item.subtotal)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-[#9B9792]">-</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile clear cart */}
              <button
                onClick={() => clearCart()}
                className="w-full text-center text-sm text-[#D1625B] hover:text-[#B04840] font-medium py-2 sm:hidden"
              >
                {t.clearCart}
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#E4E1DD] p-4 sm:p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{t.summary}</h2>

                {/* Items count */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-[#6E6B67]">{itemCount} {t.items}</span>
                  <span className="font-bold text-[#75534B]">
                    {currency} ${formatPrice(total)}
                  </span>
                </div>

                <hr className="border-[#E4E1DD] my-4" />

                {/* Justification */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t.justification} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder={t.justificationPlaceholder}
                    rows={3}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white py-2 px-3 text-sm text-[#2C2C2C] placeholder:text-[#9B9792] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 resize-none"
                  />
                </div>

                {/* Urgency */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    {t.urgency}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUrgency('normal')}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        urgency === 'normal'
                          ? 'bg-[#75534B] text-white'
                          : 'bg-[#F9F8F6] text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#E4E1DD]'
                      }`}
                    >
                      {t.normal}
                    </button>
                    <button
                      onClick={() => setUrgency('urgent')}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        urgency === 'urgent'
                          ? 'bg-[#D1625B] text-white'
                          : 'bg-[#F9F8F6] text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#E4E1DD]'
                      }`}
                    >
                      {t.urgent}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {/* Approval note */}
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    <AlertCircle className="h-3.5 w-3.5 inline-block mr-1" />
                    {t.approvalNote}
                  </p>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t.submitting}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      {t.submitRequest}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
