'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Link2,
  Loader2,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Package,
  Zap,
  Plus,
  Trash2,
  X,
  Search,
  Grid3X3,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { purchaseRequestsApi, productsApi, type ProductMetadata, type CreatePurchaseRequestItemInput } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

// Generate UUID compatible with all browsers
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Source type for products
type ProductSource = 'catalog' | 'external';

// Product item type for the form
interface ProductItem {
  id: string;
  source: ProductSource;
  // For catalog products
  catalogProduct?: Product;
  // For external products
  url: string;
  metadata: ProductMetadata | null;
  isLoadingMetadata: boolean;
  // Common fields
  quantity: number;
  error: string | null;
}

// Create a new empty external product item
const createEmptyExternalProduct = (): ProductItem => ({
  id: generateUUID(),
  source: 'external',
  url: '',
  quantity: 1,
  metadata: null,
  isLoadingMetadata: false,
  error: null,
});

// Create a catalog product item
const createCatalogProduct = (product: Product): ProductItem => ({
  id: generateUUID(),
  source: 'catalog',
  catalogProduct: product,
  url: '',
  quantity: 1,
  metadata: null,
  isLoadingMetadata: false,
  error: null,
});

export default function NewPurchaseRequestPage() {
  const { language } = useLanguage();
  const router = useRouter();

  // View state: 'selection' | 'form'
  const [view, setView] = useState<'selection' | 'form'>('selection');

  // Multi-product state
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');

  // Catalog modal state
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const text = {
    en: {
      title: 'New Purchase Request',
      subtitle: 'Submit products for approval',
      // Selection screen
      selectSourceTitle: 'What type of products do you want to request?',
      catalogOption: 'From Internal Catalog',
      catalogOptionDesc: 'Select products from the company catalog with verified prices and stock',
      externalOption: 'External Products (URL)',
      externalOptionDesc: 'Enter URLs from any online store (Amazon, MercadoLibre, etc.)',
      combineTip: 'You can also combine catalog products with external products in the same request.',
      goToCatalog: 'Browse Catalog',
      addExternalUrl: 'Add URL',
      // Form
      product: 'Product',
      urlLabel: 'Product URL',
      urlPlaceholder: 'Paste the product URL (Amazon, MercadoLibre, or any site)',
      urlHint: 'We\'ll automatically extract product details from the link',
      fetchDetails: 'Extract',
      quantity: 'Qty',
      justification: 'Justification',
      justificationPlaceholder: 'Why do you need these products?',
      urgency: 'Urgency',
      normal: 'Normal',
      urgent: 'Urgent',
      addProduct: 'Add another URL',
      addFromCatalog: 'Add from Catalog',
      removeProduct: 'Remove',
      submit: 'Review & Submit',
      submitting: 'Submitting...',
      success: 'Request submitted successfully!',
      successMessage: 'Your request has been sent for approval.',
      viewRequests: 'View My Requests',
      createAnother: 'Create Another',
      error: 'Error',
      amazonBadge: 'Amazon - Auto Cart',
      amazonHint: 'This product will be automatically added to the Amazon cart when approved',
      manualBadge: 'Manual Purchase',
      catalogBadge: 'From Catalog',
      price: 'Estimated Price',
      noImage: 'No image',
      fetchError: 'Could not fetch details. You can fill them manually.',
      summary: 'Summary',
      totalProducts: 'products',
      totalEstimated: 'Total Estimated',
      priceNotAvailable: 'Price not available for some products',
      confirmTitle: 'Confirm Purchase Request',
      confirmSubtitle: 'Please review the details before submitting',
      productsToRequest: 'Products to Request',
      subtotal: 'Subtotal',
      total: 'Total Estimated',
      backToEdit: 'Back to Edit',
      confirmSubmit: 'Confirm & Submit',
      approvalNote: 'Once submitted, your request will be sent to the General Manager for approval.',
      minOneProduct: 'At least one product is required',
      justificationRequired: 'Justification is required',
      urlRequired: 'Product URL is required',
      backToSelection: 'Back',
      // Catalog modal
      catalogTitle: 'Select from Catalog',
      searchPlaceholder: 'Search products...',
      allCategories: 'All Categories',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      addToRequest: 'Add to Request',
      noProductsFound: 'No products found',
      close: 'Close',
      stock: 'Stock',
    },
    zh: {
      title: '新建采购请求',
      subtitle: '提交产品以待批准',
      selectSourceTitle: '您想请求什么类型的产品？',
      catalogOption: '从内部目录',
      catalogOptionDesc: '从公司目录中选择具有验证价格和库存的产品',
      externalOption: '外部产品（URL）',
      externalOptionDesc: '输入任何在线商店的URL（Amazon、MercadoLibre等）',
      combineTip: '您也可以在同一请求中组合目录产品和外部产品。',
      goToCatalog: '浏览目录',
      addExternalUrl: '添加URL',
      product: '产品',
      urlLabel: '产品链接',
      urlPlaceholder: '粘贴产品链接（Amazon、MercadoLibre或任何网站）',
      urlHint: '我们将自动从链接中提取产品详情',
      fetchDetails: '提取',
      quantity: '数量',
      justification: '申请理由',
      justificationPlaceholder: '您为什么需要这些产品？',
      urgency: '紧急程度',
      normal: '普通',
      urgent: '紧急',
      addProduct: '添加另一个URL',
      addFromCatalog: '从目录添加',
      removeProduct: '删除',
      submit: '审核并提交',
      submitting: '提交中...',
      success: '请求提交成功！',
      successMessage: '您的请求已发送等待批准。',
      viewRequests: '查看我的请求',
      createAnother: '再创建一个',
      error: '错误',
      amazonBadge: 'Amazon - 自动加购',
      amazonHint: '批准后，此产品将自动添加到Amazon购物车',
      manualBadge: '手动采购',
      catalogBadge: '来自目录',
      price: '预估价格',
      noImage: '无图片',
      fetchError: '无法获取详情。您可以手动填写。',
      summary: '摘要',
      totalProducts: '个产品',
      totalEstimated: '预估总额',
      priceNotAvailable: '部分产品价格不可用',
      confirmTitle: '确认采购请求',
      confirmSubtitle: '请在提交前查看详情',
      productsToRequest: '要请求的产品',
      subtotal: '小计',
      total: '预估总额',
      backToEdit: '返回编辑',
      confirmSubmit: '确认并提交',
      approvalNote: '提交后，您的请求将发送给总经理审批。',
      minOneProduct: '至少需要一个产品',
      justificationRequired: '申请理由是必需的',
      urlRequired: '产品链接是必需的',
      backToSelection: '返回',
      catalogTitle: '从目录选择',
      searchPlaceholder: '搜索产品...',
      allCategories: '所有类别',
      inStock: '有库存',
      outOfStock: '缺货',
      addToRequest: '添加到请求',
      noProductsFound: '未找到产品',
      close: '关闭',
      stock: '库存',
    },
    es: {
      title: 'Nueva Solicitud de Compra',
      subtitle: 'Enviar productos para aprobacion',
      selectSourceTitle: 'Que tipo de productos deseas solicitar?',
      catalogOption: 'Del Catalogo Interno',
      catalogOptionDesc: 'Selecciona productos del catalogo de la empresa con precios y stock verificados',
      externalOption: 'Productos Externos (URL)',
      externalOptionDesc: 'Ingresa URLs de cualquier tienda en linea (Amazon, MercadoLibre, etc.)',
      combineTip: 'Tambien puedes combinar productos del catalogo con productos externos en la misma solicitud.',
      goToCatalog: 'Ver Catalogo',
      addExternalUrl: 'Agregar URL',
      product: 'Producto',
      urlLabel: 'URL del Producto',
      urlPlaceholder: 'Pega la URL del producto (Amazon, MercadoLibre, o cualquier sitio)',
      urlHint: 'Extraeremos automaticamente los detalles del producto',
      fetchDetails: 'Extraer',
      quantity: 'Cant',
      justification: 'Justificacion',
      justificationPlaceholder: 'Por que necesitas estos productos?',
      urgency: 'Urgencia',
      normal: 'Normal',
      urgent: 'Urgente',
      addProduct: 'Agregar otra URL',
      addFromCatalog: 'Agregar del Catalogo',
      removeProduct: 'Eliminar',
      submit: 'Revisar y Enviar',
      submitting: 'Enviando...',
      success: 'Solicitud enviada exitosamente!',
      successMessage: 'Tu solicitud ha sido enviada para aprobacion.',
      viewRequests: 'Ver Mis Solicitudes',
      createAnother: 'Crear Otra',
      error: 'Error',
      amazonBadge: 'Amazon - Carrito Auto',
      amazonHint: 'Este producto se agregara automaticamente al carrito de Amazon al aprobarse',
      manualBadge: 'Compra Manual',
      catalogBadge: 'Del Catalogo',
      price: 'Precio Estimado',
      noImage: 'Sin imagen',
      fetchError: 'No se pudieron obtener los detalles. Puedes llenarlos manualmente.',
      summary: 'Resumen',
      totalProducts: 'productos',
      totalEstimated: 'Total Estimado',
      priceNotAvailable: 'Precio no disponible para algunos productos',
      confirmTitle: 'Confirmar Solicitud de Compra',
      confirmSubtitle: 'Por favor revisa los detalles antes de enviar',
      productsToRequest: 'Productos a Solicitar',
      subtotal: 'Subtotal',
      total: 'Total Estimado',
      backToEdit: 'Volver a Editar',
      confirmSubmit: 'Confirmar y Enviar',
      approvalNote: 'Una vez enviada, la solicitud sera enviada al Gerente General para aprobacion.',
      minOneProduct: 'Se requiere al menos un producto',
      justificationRequired: 'La justificacion es requerida',
      urlRequired: 'La URL del producto es requerida',
      backToSelection: 'Volver',
      catalogTitle: 'Seleccionar del Catalogo',
      searchPlaceholder: 'Buscar productos...',
      allCategories: 'Todas las Categorias',
      inStock: 'En Stock',
      outOfStock: 'Agotado',
      addToRequest: 'Agregar a Solicitud',
      noProductsFound: 'No se encontraron productos',
      close: 'Cerrar',
      stock: 'Stock',
    },
  };

  const t = text[language];

  // Load catalog products and categories
  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsApi.list({ per_page: 100 }),
        productsApi.getCategories(),
      ]);
      setCatalogProducts(productsResponse.data || []);
      setCategories(categoriesResponse || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Filter catalog products
  const filteredCatalogProducts = catalogProducts.filter(product => {
    const matchesSearch = !catalogSearch ||
      product.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCategory = !catalogCategory || product.category === catalogCategory;
    return matchesSearch && matchesCategory && product.is_active;
  });

  // Fetch metadata for a specific product
  const fetchMetadata = async (productId: string) => {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const product = products[productIndex];
    if (!product.url.trim() || product.source === 'catalog') return;

    // Update loading state
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, isLoadingMetadata: true, error: null } : p
    ));

    try {
      const data = await purchaseRequestsApi.extractMetadata(product.url);
      setProducts(prev => prev.map(p =>
        p.id === productId ? {
          ...p,
          metadata: data,
          isLoadingMetadata: false,
          error: data.error ? t.fetchError : null
        } : p
      ));
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
      setProducts(prev => prev.map(p =>
        p.id === productId ? {
          ...p,
          metadata: {
            url: product.url,
            title: '',
            description: '',
            image_url: '',
            price: null,
            currency: 'MXN',
            site_name: '',
            is_amazon: product.url.toLowerCase().includes('amazon'),
            amazon_asin: '',
            error: 'Failed to fetch',
          },
          isLoadingMetadata: false,
          error: t.fetchError
        } : p
      ));
    }
  };

  // Update product field
  const updateProduct = (productId: string, field: keyof ProductItem, value: unknown) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  // Add new external product
  const addExternalProduct = () => {
    setProducts(prev => [...prev, createEmptyExternalProduct()]);
    setView('form');
  };

  // Add catalog product
  const addCatalogProductToRequest = (product: Product) => {
    // Check if product is already in the list
    const exists = products.some(p => p.source === 'catalog' && p.catalogProduct?.id === product.id);
    if (exists) {
      // Just increase quantity
      setProducts(prev => prev.map(p =>
        p.source === 'catalog' && p.catalogProduct?.id === product.id
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setProducts(prev => [...prev, createCatalogProduct(product)]);
    }
  };

  // Remove product
  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Calculate totals
  const calculateTotals = () => {
    let total = 0;
    let allHavePrices = true;

    products.forEach(product => {
      if (product.source === 'catalog' && product.catalogProduct) {
        total += product.catalogProduct.price * product.quantity;
      } else if (product.metadata?.price) {
        total += product.metadata.price * product.quantity;
      } else {
        allHavePrices = false;
      }
    });

    return { total, allHavePrices };
  };

  // Validate form
  const validateForm = (): string | null => {
    if (products.length === 0) return t.minOneProduct;

    for (const product of products) {
      if (product.source === 'external' && !product.url.trim()) return t.urlRequired;
    }

    if (!justification.trim()) return t.justificationRequired;

    return null;
  };

  // Handle review click - show confirmation modal
  const handleReview = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setShowConfirmModal(true);
  };

  // Handle actual submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const items: CreatePurchaseRequestItemInput[] = products.map(product => {
        if (product.source === 'catalog' && product.catalogProduct) {
          return {
            url: product.catalogProduct.image_url || '',
            quantity: product.quantity,
            product_title: product.catalogProduct.name,
            product_image_url: product.catalogProduct.image_url,
            product_description: product.catalogProduct.description,
            estimated_price: product.catalogProduct.price,
            currency: product.catalogProduct.currency || 'MXN',
          };
        } else {
          return {
            url: product.url,
            quantity: product.quantity,
            product_title: product.metadata?.title,
            product_image_url: product.metadata?.image_url,
            product_description: product.metadata?.description,
            estimated_price: product.metadata?.price || undefined,
            currency: product.metadata?.currency || 'MXN',
          };
        }
      });

      await purchaseRequestsApi.create({
        items,
        justification,
        urgency,
      });

      setSuccess(true);
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Failed to submit request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProducts([]);
    setJustification('');
    setUrgency('normal');
    setError(null);
    setSuccess(false);
    setShowConfirmModal(false);
    setView('selection');
  };

  const openCatalogModal = () => {
    loadCatalog();
    setShowCatalogModal(true);
  };

  const { total, allHavePrices } = calculateTotals();

  // Get product display info
  const getProductDisplayInfo = (product: ProductItem) => {
    if (product.source === 'catalog' && product.catalogProduct) {
      return {
        name: product.catalogProduct.name,
        image: product.catalogProduct.image_url,
        price: product.catalogProduct.price,
        currency: product.catalogProduct.currency || 'MXN',
        description: product.catalogProduct.description,
      };
    }
    return {
      name: product.metadata?.title || product.url,
      image: product.metadata?.image_url,
      price: product.metadata?.price,
      currency: product.metadata?.currency || 'MXN',
      description: product.metadata?.description,
    };
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
              onClick={resetForm}
              className="flex-1 rounded-lg border border-[#E4E1DD] px-4 py-3 text-[#2C2C2C] font-medium hover:bg-[#F9F8F6]"
            >
              {t.createAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Selection screen
  if (view === 'selection' && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        {/* Header */}
        <section className="border-b border-[#E4E1DD] bg-white px-4 sm:px-8 py-6 sm:py-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
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

        {/* Selection Options */}
        <section className="px-4 sm:px-8 py-8 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-lg sm:text-xl font-semibold text-[#2C2C2C] text-center mb-6 sm:mb-8">
              {t.selectSourceTitle}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Catalog Option */}
              <button
                onClick={openCatalogModal}
                className="bg-white rounded-xl border-2 border-[#E4E1DD] p-6 sm:p-8 text-left hover:border-[#75534B] hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#75534B]/10 flex items-center justify-center mb-4 group-hover:bg-[#75534B]/20 transition-colors">
                  <Package className="h-7 w-7 sm:h-8 sm:w-8 text-[#75534B]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#2C2C2C] mb-2">
                  {t.catalogOption}
                </h3>
                <p className="text-sm text-[#6E6B67] mb-4">
                  {t.catalogOptionDesc}
                </p>
                <span className="inline-flex items-center gap-2 text-[#75534B] font-medium text-sm">
                  <Grid3X3 className="h-4 w-4" />
                  {t.goToCatalog}
                </span>
              </button>

              {/* External Option */}
              <button
                onClick={addExternalProduct}
                className="bg-white rounded-xl border-2 border-[#E4E1DD] p-6 sm:p-8 text-left hover:border-[#75534B] hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#75534B]/10 flex items-center justify-center mb-4 group-hover:bg-[#75534B]/20 transition-colors">
                  <Link2 className="h-7 w-7 sm:h-8 sm:w-8 text-[#75534B]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#2C2C2C] mb-2">
                  {t.externalOption}
                </h3>
                <p className="text-sm text-[#6E6B67] mb-4">
                  {t.externalOptionDesc}
                </p>
                <span className="inline-flex items-center gap-2 text-[#75534B] font-medium text-sm">
                  <Plus className="h-4 w-4" />
                  {t.addExternalUrl}
                </span>
              </button>
            </div>

            {/* Tip */}
            <div className="bg-[#75534B]/5 border border-[#75534B]/20 rounded-lg p-4 text-center">
              <p className="text-sm text-[#75534B]">
                {t.combineTip}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <section className="border-b border-[#E4E1DD] bg-white px-4 sm:px-8 py-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            {products.length > 0 && (
              <button
                onClick={() => {
                  if (products.length === 0) {
                    setView('selection');
                  } else {
                    // Go back to form with products
                  }
                }}
                className="p-2 hover:bg-[#F9F8F6] rounded-lg transition-colors -ml-2"
              >
                <ArrowLeft className="h-5 w-5 text-[#6E6B67]" />
              </button>
            )}
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

      {/* Form */}
      <section className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4 sm:space-y-6">
            {/* Products */}
            {products.map((product, index) => (
              <div key={product.id} className="bg-white rounded-xl border border-[#E4E1DD] p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#2C2C2C]">
                      {t.product} {index + 1}
                    </h3>
                    <Badge className={product.source === 'catalog'
                      ? 'bg-[#75534B]/10 text-[#75534B] border-[#75534B]/30'
                      : 'bg-[#6E6B67]/10 text-[#6E6B67] border-[#6E6B67]/30'
                    }>
                      {product.source === 'catalog' ? t.catalogBadge : t.manualBadge}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.removeProduct}</span>
                  </button>
                </div>

                {/* Catalog Product Preview */}
                {product.source === 'catalog' && product.catalogProduct && (
                  <div className="bg-[#F9F8F6] rounded-lg p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-white border border-[#E4E1DD] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.catalogProduct.image_url ? (
                          <img
                            src={product.catalogProduct.image_url}
                            alt={product.catalogProduct.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : product.catalogProduct.image_emoji ? (
                          <span className="text-3xl">{product.catalogProduct.image_emoji}</span>
                        ) : (
                          <Package className="h-8 w-8 text-[#9B9792]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#2C2C2C] line-clamp-2 mb-1 text-sm">
                          {product.catalogProduct.name}
                        </h4>
                        {product.catalogProduct.sku && (
                          <p className="text-xs text-[#9B9792] mb-1">SKU: {product.catalogProduct.sku}</p>
                        )}
                        <p className="text-base font-bold text-[#75534B]">
                          {product.catalogProduct.currency || 'MXN'} ${product.catalogProduct.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-[#6E6B67] mb-1">
                          {t.quantity}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(product.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 sm:w-20 rounded-lg border border-[#E4E1DD] bg-white py-2 px-2 sm:px-3 text-sm text-[#2C2C2C] text-center focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* External Product */}
                {product.source === 'external' && (
                  <>
                    {/* URL Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[#6E6B67] mb-2">
                        {t.urlLabel} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="flex-1 relative">
                          <Link2 className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E6B67]" />
                          <input
                            type="url"
                            value={product.url}
                            onChange={(e) => updateProduct(product.id, 'url', e.target.value)}
                            placeholder={t.urlPlaceholder}
                            className="w-full rounded-lg border border-[#E4E1DD] bg-white py-3 pl-10 sm:pl-12 pr-4 text-sm text-[#2C2C2C] transition-all placeholder:text-[#9B9792] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => fetchMetadata(product.id)}
                          disabled={!product.url.trim() || product.isLoadingMetadata}
                          className="flex items-center justify-center gap-2 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] px-4 py-3 text-[#2C2C2C] font-medium hover:bg-[#E4E1DD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {product.isLoadingMetadata ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                          {t.fetchDetails}
                        </button>
                      </div>
                    </div>

                    {/* Product Preview / Manual Entry */}
                    {product.metadata && (
                      <div className="bg-[#F9F8F6] rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          {product.metadata.is_amazon ? (
                            <Badge className="bg-[#E08A4B]/10 text-[#E08A4B] border-[#E08A4B]/30">
                              <Zap className="h-3 w-3 mr-1" />
                              {t.amazonBadge}
                            </Badge>
                          ) : (
                            <Badge className="bg-[#6E6B67]/10 text-[#6E6B67] border-[#6E6B67]/30">
                              {t.manualBadge}
                            </Badge>
                          )}
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-[#75534B] hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-white border border-[#E4E1DD] flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {product.metadata.image_url ? (
                                <img
                                  src={product.metadata.image_url}
                                  alt={product.metadata.title}
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <span className="text-[#9B9792] text-xs text-center px-2">{t.noImage}</span>
                              )}
                            </div>
                            {/* Image URL input */}
                            <input
                              type="text"
                              value={product.metadata.image_url || ''}
                              onChange={(e) => {
                                const newMetadata = { ...product.metadata!, image_url: e.target.value };
                                updateProduct(product.id, 'metadata', newMetadata);
                              }}
                              placeholder="URL imagen"
                              className="w-20 sm:w-24 text-[10px] text-[#6E6B67] bg-transparent border-b border-[#E4E1DD] focus:border-[#75534B] focus:outline-none text-center truncate"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Editable Title */}
                            <input
                              type="text"
                              value={product.metadata.title || ''}
                              onChange={(e) => {
                                const newMetadata = { ...product.metadata!, title: e.target.value };
                                updateProduct(product.id, 'metadata', newMetadata);
                              }}
                              placeholder={language === 'es' ? 'Nombre del producto' : language === 'zh' ? '产品名称' : 'Product name'}
                              className="w-full font-semibold text-[#2C2C2C] text-sm bg-transparent border-b border-transparent hover:border-[#E4E1DD] focus:border-[#75534B] focus:outline-none mb-1"
                            />
                            {product.metadata.description && (
                              <p className="text-xs text-[#6E6B67] line-clamp-2 mb-2 hidden sm:block">
                                {product.metadata.description}
                              </p>
                            )}
                            {/* Editable Price */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#6E6B67]">{product.metadata.currency || 'MXN'} $</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={product.metadata.price || ''}
                                onChange={(e) => {
                                  const newMetadata = { ...product.metadata!, price: parseFloat(e.target.value) || null };
                                  updateProduct(product.id, 'metadata', newMetadata);
                                }}
                                placeholder="0.00"
                                className="w-24 text-base font-bold text-[#75534B] bg-transparent border-b border-[#E4E1DD] hover:border-[#75534B] focus:border-[#75534B] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <label className="block text-xs font-medium text-[#6E6B67] mb-1">
                              {t.quantity}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateProduct(product.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 sm:w-20 rounded-lg border border-[#E4E1DD] bg-white py-2 px-2 sm:px-3 text-sm text-[#2C2C2C] text-center focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Product Error */}
                    {product.error && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        <p className="text-xs text-yellow-700">{product.error}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Add Product Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={addExternalProduct}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E4E1DD] py-4 text-[#6E6B67] hover:border-[#75534B] hover:text-[#75534B] transition-colors"
              >
                <Link2 className="h-5 w-5" />
                {t.addProduct}
              </button>
              <button
                type="button"
                onClick={openCatalogModal}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E4E1DD] py-4 text-[#6E6B67] hover:border-[#75534B] hover:text-[#75534B] transition-colors"
              >
                <Package className="h-5 w-5" />
                {t.addFromCatalog}
              </button>
            </div>

            {/* Justification */}
            <div className="bg-white rounded-xl border border-[#E4E1DD] p-4 sm:p-6">
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
                {t.justification} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder={t.justificationPlaceholder}
                rows={4}
                className="w-full rounded-lg border border-[#E4E1DD] bg-white py-3 px-4 text-sm text-[#2C2C2C] placeholder:text-[#9B9792] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 resize-none"
              />
            </div>

            {/* Urgency */}
            <div className="bg-white rounded-xl border border-[#E4E1DD] p-4 sm:p-6">
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-3">
                {t.urgency}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUrgency('normal')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    urgency === 'normal'
                      ? 'bg-[#75534B] text-white'
                      : 'bg-[#F9F8F6] text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#E4E1DD]'
                  }`}
                >
                  {t.normal}
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('urgent')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                    urgency === 'urgent'
                      ? 'bg-[#D1625B] text-white'
                      : 'bg-[#F9F8F6] text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#E4E1DD]'
                  }`}
                >
                  {t.urgent}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-[#E4E1DD] p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-[#2C2C2C] mb-4">{t.summary}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6E6B67]">{products.length} {t.totalProducts}</span>
                <div className="text-right">
                  {total > 0 ? (
                    <span className="text-lg font-bold text-[#75534B]">
                      MXN ${total.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#9B9792]">{t.priceNotAvailable}</span>
                  )}
                  {!allHavePrices && total > 0 && (
                    <p className="text-xs text-[#9B9792] mt-1">+ {t.priceNotAvailable}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleReview}
              disabled={isSubmitting || products.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-6 py-4 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-5 w-5" />
              {t.submit}
            </button>
          </div>
        </div>
      </section>

      {/* Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E4E1DD] flex-shrink-0">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-[#75534B]" />
                <h2 className="text-lg sm:text-xl font-semibold text-[#2C2C2C]">{t.catalogTitle}</h2>
              </div>
              <button
                onClick={() => {
                  setShowCatalogModal(false);
                  if (products.length > 0) {
                    setView('form');
                  }
                }}
                className="p-2 hover:bg-[#F9F8F6] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#6E6B67]" />
              </button>
            </div>

            {/* Filters */}
            <div className="px-4 sm:px-6 py-4 border-b border-[#E4E1DD] flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6E6B67]" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white py-2 pl-10 pr-4 text-sm text-[#2C2C2C] placeholder:text-[#9B9792] focus:border-[#75534B] focus:outline-none"
                  />
                </div>
                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="rounded-lg border border-[#E4E1DD] bg-white py-2 px-3 text-sm text-[#2C2C2C] focus:border-[#75534B] focus:outline-none"
                >
                  <option value="">{t.allCategories}</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {catalogLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#75534B]" />
                </div>
              ) : filteredCatalogProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-[#9B9792] mx-auto mb-4" />
                  <p className="text-[#6E6B67]">{t.noProductsFound}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCatalogProducts.map(product => {
                    const isAdded = products.some(p => p.source === 'catalog' && p.catalogProduct?.id === product.id);
                    const isOutOfStock = product.stock <= 0;

                    return (
                      <div
                        key={product.id}
                        className={`bg-[#F9F8F6] rounded-lg p-4 border ${isAdded ? 'border-[#75534B]' : 'border-transparent'}`}
                      >
                        <div className="w-full h-24 rounded-lg bg-white border border-[#E4E1DD] flex items-center justify-center mb-3 overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : product.image_emoji ? (
                            <span className="text-4xl">{product.image_emoji}</span>
                          ) : (
                            <Package className="h-8 w-8 text-[#9B9792]" />
                          )}
                        </div>
                        <h4 className="font-medium text-[#2C2C2C] text-sm line-clamp-2 mb-1">
                          {product.name}
                        </h4>
                        <p className="text-xs text-[#9B9792] mb-2">
                          {product.sku && `SKU: ${product.sku} · `}
                          {t.stock}: {product.stock}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#75534B]">
                            ${product.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => addCatalogProductToRequest(product)}
                            disabled={isOutOfStock}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                              isAdded
                                ? 'bg-[#75534B] text-white'
                                : isOutOfStock
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#75534B]/10 text-[#75534B] hover:bg-[#75534B]/20'
                            }`}
                          >
                            {isAdded ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : isOutOfStock ? (
                              t.outOfStock
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-[#E4E1DD] bg-[#F9F8F6] flex-shrink-0">
              <p className="text-sm text-[#6E6B67]">
                {products.filter(p => p.source === 'catalog').length} {t.totalProducts} {t.catalogBadge.toLowerCase()}
              </p>
              <button
                onClick={() => {
                  setShowCatalogModal(false);
                  if (products.length > 0) {
                    setView('form');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#75534B] text-white font-medium hover:bg-[#5D423C] transition-colors"
              >
                {products.length > 0 ? t.close : t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E4E1DD]">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-[#2C2C2C]">{t.confirmTitle}</h2>
                <p className="text-sm text-[#6E6B67]">{t.confirmSubtitle}</p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 hover:bg-[#F9F8F6] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#6E6B67]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-4 sm:px-6 py-4 overflow-y-auto max-h-[60vh]">
              {/* Products Table */}
              <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">
                {t.productsToRequest}
              </h3>
              <div className="space-y-3 mb-6">
                {products.map((product) => {
                  const info = getProductDisplayInfo(product);
                  return (
                    <div key={product.id} className="flex items-center gap-3 sm:gap-4 p-3 bg-[#F9F8F6] rounded-lg">
                      {/* Image */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-white border border-[#E4E1DD] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {info.image ? (
                          <img
                            src={info.image}
                            alt={info.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : product.source === 'catalog' && product.catalogProduct?.image_emoji ? (
                          <span className="text-2xl">{product.catalogProduct.image_emoji}</span>
                        ) : (
                          <Package className="h-6 w-6 text-[#9B9792]" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#2C2C2C] text-sm line-clamp-1">
                          {info.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={product.source === 'catalog'
                            ? 'bg-[#75534B]/10 text-[#75534B] border-[#75534B]/30 text-xs'
                            : 'bg-[#6E6B67]/10 text-[#6E6B67] border-[#6E6B67]/30 text-xs'
                          }>
                            {product.source === 'catalog' ? t.catalogBadge : t.manualBadge}
                          </Badge>
                          <span className="text-xs text-[#6E6B67]">
                            {t.quantity}: {product.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right flex-shrink-0">
                        {info.price ? (
                          <p className="font-bold text-[#75534B]">
                            ${(info.price * product.quantity).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs text-[#9B9792]">-</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Justification */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#2C2C2C] mb-2">{t.justification}</h4>
                <p className="text-sm text-[#6E6B67] bg-[#F9F8F6] rounded-lg p-3">
                  {justification}
                </p>
              </div>

              {/* Urgency */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#2C2C2C] mb-2">{t.urgency}</h4>
                <Badge className={urgency === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                  {urgency === 'urgent' ? t.urgent : t.normal}
                </Badge>
              </div>

              {/* Total */}
              <div className="border-t border-[#E4E1DD] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#2C2C2C]">{t.total}</span>
                  {total > 0 ? (
                    <span className="text-xl font-bold text-[#75534B]">
                      MXN ${total.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#9B9792]">{t.priceNotAvailable}</span>
                  )}
                </div>
                {!allHavePrices && total > 0 && (
                  <p className="text-xs text-[#9B9792] text-right mt-1">+ {t.priceNotAvailable}</p>
                )}
              </div>

              {/* Approval Note */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <AlertCircle className="h-4 w-4 inline-block mr-1" />
                  {t.approvalNote}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-[#E4E1DD] bg-[#F9F8F6]">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[#E4E1DD] bg-white text-[#2C2C2C] font-medium hover:bg-[#F9F8F6] transition-colors disabled:opacity-50"
              >
                {t.backToEdit}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {t.confirmSubmit}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
