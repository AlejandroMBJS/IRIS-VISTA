'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Upload, X, AlertCircle, ImageIcon, ExternalLink, Download, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Format price to show all significant decimals (minimum 2)
const formatPrice = (price: number): string => {
  const priceStr = price.toString();
  const decimalIndex = priceStr.indexOf('.');
  if (decimalIndex === -1) {
    return price.toFixed(2);
  }
  const decimals = priceStr.length - decimalIndex - 1;
  return price.toFixed(Math.max(2, decimals));
};
import { useAuth } from '@/contexts/AuthContext';
import api, { productsApi } from '@/lib/api';
import { Product, ProductImage, ApiResponse } from '@/types';

interface ProductFormData {
  sku: string;
  name: string;
  name_zh: string;
  name_es: string;
  description: string;
  category: string;
  model: string;
  specification: string;
  spec_zh: string;
  spec_es: string;
  supplier: string;
  supplier_code: string;
  price: number;
  currency: string;
  stock: number;
  min_stock: number;
  max_stock: number;
  location: string;
  image_url: string;
  image_emoji: string;
  clickup_id: string;
  is_active: boolean;
  images: { url: string; sort_order: number; is_primary: boolean; caption: string }[];
  // E-commerce fields
  product_url: string;
  is_ecommerce: boolean;
  asin: string;
  brand: string;
}

interface UploadRequirements {
  max_file_size: string;
  allowed_types: string[];
  allowed_extensions: string[];
  max_files_per_upload: number;
}

const emptyFormData: ProductFormData = {
  sku: '',
  name: '',
  name_zh: '',
  name_es: '',
  description: '',
  category: '',
  model: '',
  specification: '',
  spec_zh: '',
  spec_es: '',
  supplier: '',
  supplier_code: '',
  price: 0,
  currency: 'USD',
  stock: 0,
  min_stock: 0,
  max_stock: 0,
  location: '',
  image_url: '',
  image_emoji: '',
  clickup_id: '',
  is_active: true,
  images: [],
  // E-commerce fields
  product_url: '',
  is_ecommerce: false,
  asin: '',
  brand: '',
};

export default function InventoryPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [uploadRequirements, setUploadRequirements] = useState<UploadRequirements | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    results: Array<{ row: number; sku: string; success: boolean; error?: string }>;
  } | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'purchase_admin' || user?.role === 'supply_chain_manager';

  const text = {
    en: {
      title: 'Inventory Management',
      subtitle: 'Manage products, stock levels, and pricing',
      search: 'Search products...',
      category: 'Category',
      all: 'All Categories',
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      sku: 'SKU',
      name: 'Name',
      nameEn: 'Name (English)',
      nameZh: 'Name (Chinese)',
      nameEs: 'Name (Spanish)',
      description: 'Description',
      model: 'Model',
      specification: 'Specification',
      specEn: 'Specification (English)',
      specZh: 'Specification (Chinese)',
      specEs: 'Specification (Spanish)',
      supplier: 'Supplier',
      supplierCode: 'Supplier Code',
      price: 'Price',
      currency: 'Currency',
      stock: 'Stock',
      minStock: 'Min Stock',
      maxStock: 'Max Stock',
      location: 'Location',
      imageUrl: 'Image URL',
      imageEmoji: 'Image Emoji',
      clickupId: 'ClickUp ID (Optional)',
      active: 'Active',
      images: 'Product Images',
      uploadImages: 'Upload Images',
      uploadRequirements: 'Max 5MB per file. Allowed: JPEG, PNG, GIF, WebP',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this product?',
      yes: 'Yes, Delete',
      no: 'No, Cancel',
      noProducts: 'No products found',
      loading: 'Loading...',
      inStock: 'In Stock',
      limited: 'Limited',
      outOfStock: 'Out of Stock',
      basicInfo: 'Basic Information',
      pricing: 'Pricing & Stock',
      localization: 'Localization',
      media: 'Media & Images',
      actions: 'Actions',
      ecommerce: 'E-commerce',
      productUrl: 'Product URL',
      isEcommerce: 'E-commerce Product',
      asin: 'Amazon ASIN',
      brand: 'Brand',
      ecommerceHint: 'Mark as e-commerce if this product is purchased from an online store',
      // Import translations
      importProducts: 'Import Products',
      importFromCSV: 'Import from CSV',
      downloadTemplate: 'Download Template',
      pasteCSV: 'Or paste CSV data here',
      csvFormat: 'CSV format: sku,name,category,model,specification,supplier,supplier_code,price,currency,stock,min_stock,max_stock,location,description,is_active,is_ecommerce,product_url,brand,asin',
      import: 'Import',
      importSuccess: 'Import completed',
      imported: 'imported',
      failed: 'failed',
      row: 'Row',
      close: 'Close',
    },
    zh: {
      title: '库存管理',
      subtitle: '管理产品、库存水平和定价',
      search: '搜索产品...',
      category: '类别',
      all: '所有类别',
      addProduct: '添加产品',
      editProduct: '编辑产品',
      sku: 'SKU',
      name: '名称',
      nameEn: '名称（英文）',
      nameZh: '名称（中文）',
      nameEs: '名称（西班牙语）',
      description: '描述',
      model: '型号',
      specification: '规格',
      specEn: '规格（英文）',
      specZh: '规格（中文）',
      specEs: '规格（西班牙语）',
      supplier: '供应商',
      supplierCode: '供应商编码',
      price: '价格',
      currency: '货币',
      stock: '库存',
      minStock: '最小库存',
      maxStock: '最大库存',
      location: '位置',
      imageUrl: '图片URL',
      imageEmoji: '图片表情',
      clickupId: 'ClickUp ID（可选）',
      active: '启用',
      images: '产品图片',
      uploadImages: '上传图片',
      uploadRequirements: '每个文件最大5MB。允许：JPEG、PNG、GIF、WebP',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      confirmDelete: '确定要删除此产品吗？',
      yes: '是的，删除',
      no: '不，取消',
      noProducts: '未找到产品',
      loading: '加载中...',
      inStock: '有货',
      limited: '库存紧张',
      outOfStock: '缺货',
      basicInfo: '基本信息',
      pricing: '定价与库存',
      localization: '本地化',
      media: '媒体与图片',
      actions: '操作',
      ecommerce: '电商',
      productUrl: '产品链接',
      isEcommerce: '电商产品',
      asin: 'Amazon ASIN',
      brand: '品牌',
      ecommerceHint: '如果此产品从在线商店购买，请标记为电商产品',
      // Import translations
      importProducts: '导入产品',
      importFromCSV: '从CSV导入',
      downloadTemplate: '下载模板',
      pasteCSV: '或在此粘贴CSV数据',
      csvFormat: 'CSV格式：sku,name,category,model,specification,supplier,supplier_code,price,currency,stock,min_stock,max_stock,location,description,is_active,is_ecommerce,product_url,brand,asin',
      import: '导入',
      importSuccess: '导入完成',
      imported: '已导入',
      failed: '失败',
      row: '行',
      close: '关闭',
    },
    es: {
      title: 'Gestión de Inventario',
      subtitle: 'Gestionar productos, niveles de stock y precios',
      search: 'Buscar productos...',
      category: 'Categoría',
      all: 'Todas las Categorías',
      addProduct: 'Añadir Producto',
      editProduct: 'Editar Producto',
      sku: 'SKU',
      name: 'Nombre',
      nameEn: 'Nombre (Inglés)',
      nameZh: 'Nombre (Chino)',
      nameEs: 'Nombre (Español)',
      description: 'Descripción',
      model: 'Modelo',
      specification: 'Especificación',
      specEn: 'Especificación (Inglés)',
      specZh: 'Especificación (Chino)',
      specEs: 'Especificación (Español)',
      supplier: 'Proveedor',
      supplierCode: 'Código de Proveedor',
      price: 'Precio',
      currency: 'Moneda',
      stock: 'Stock',
      minStock: 'Stock Mín',
      maxStock: 'Stock Máx',
      location: 'Ubicación',
      imageUrl: 'URL de Imagen',
      imageEmoji: 'Emoji de Imagen',
      clickupId: 'ClickUp ID (Opcional)',
      active: 'Activo',
      images: 'Imágenes del Producto',
      uploadImages: 'Subir Imágenes',
      uploadRequirements: 'Máx 5MB por archivo. Permitidos: JPEG, PNG, GIF, WebP',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      confirmDelete: '¿Está seguro de que desea eliminar este producto?',
      yes: 'Sí, Eliminar',
      no: 'No, Cancelar',
      noProducts: 'No se encontraron productos',
      loading: 'Cargando...',
      inStock: 'En Stock',
      limited: 'Limitado',
      outOfStock: 'Agotado',
      basicInfo: 'Información Básica',
      pricing: 'Precios y Stock',
      localization: 'Localización',
      media: 'Media e Imágenes',
      actions: 'Acciones',
      ecommerce: 'E-commerce',
      productUrl: 'URL del Producto',
      isEcommerce: 'Producto E-commerce',
      asin: 'Amazon ASIN',
      brand: 'Marca',
      ecommerceHint: 'Marcar como e-commerce si este producto se compra de una tienda en línea',
      // Import translations
      importProducts: 'Importar Productos',
      importFromCSV: 'Importar desde CSV',
      downloadTemplate: 'Descargar Plantilla',
      pasteCSV: 'O pegue datos CSV aquí',
      csvFormat: 'Formato CSV: sku,name,category,model,specification,supplier,supplier_code,price,currency,stock,min_stock,max_stock,location,description,is_active,is_ecommerce,product_url,brand,asin',
      import: 'Importar',
      importSuccess: 'Importación completada',
      imported: 'importados',
      failed: 'fallidos',
      row: 'Fila',
      close: 'Cerrar',
    },
  };

  const t = text[language];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await api.get<ApiResponse<Product[]>>(`/products?${params}`);
      if (response.data.success && response.data.data) {
        setProducts(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.total_pages);
          setTotal(response.data.meta.total);
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<string[]>>('/products/categories');
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchUploadRequirements = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<UploadRequirements>>('/upload/requirements');
      if (response.data.success && response.data.data) {
        setUploadRequirements(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch upload requirements:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
    fetchUploadRequirements();
  }, [fetchCategories, fetchUploadRequirements]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        name: product.name,
        name_zh: product.name_zh || '',
        name_es: product.name_es || '',
        description: product.description || '',
        category: product.category,
        model: product.model,
        specification: product.specification,
        spec_zh: product.spec_zh || '',
        spec_es: product.spec_es || '',
        supplier: product.supplier,
        supplier_code: product.supplier_code || '',
        price: product.price,
        currency: product.currency,
        stock: product.stock,
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 0,
        location: product.location || '',
        image_url: product.image_url || '',
        image_emoji: product.image_emoji || '',
        clickup_id: product.clickup_id || '',
        is_active: product.is_active,
        images: product.images?.map(img => ({
          url: img.url,
          sort_order: img.sort_order,
          is_primary: img.is_primary,
          caption: img.caption || '',
        })) || [],
        // E-commerce fields
        product_url: product.product_url || '',
        is_ecommerce: product.is_ecommerce || false,
        asin: product.asin || '',
        brand: product.brand || '',
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyFormData);
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(emptyFormData);
    setError('');
  };

  const handleSave = async () => {
    if (!formData.sku || !formData.name || !formData.category || formData.price < 0) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      handleCloseModal();
      fetchProducts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formDataUpload = new FormData();

    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('files', files[i]);
    }

    try {
      const response = await api.post('/upload/images', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success && response.data.data?.uploaded) {
        const newImages = response.data.data.uploaded.map((img: { url: string }, idx: number) => ({
          url: img.url,
          sort_order: formData.images.length + idx,
          is_primary: formData.images.length === 0 && idx === 0,
          caption: '',
        }));
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages],
        }));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const setImagePrimary = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      })),
    }));
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#ABC0B9]/30 text-[#2D363F]">{t.inStock}</span>;
      case 'limited':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#F38756]/30 text-[#5C2F0E]">{t.limited}</span>;
      case 'out_of_stock':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#AA2F0D]/20 text-[#AA2F0D]">{t.outOfStock}</span>;
      default:
        return null;
    }
  };

  // CSV Import functions
  const handleDownloadTemplate = () => {
    const headers = 'sku,name,category,model,specification,supplier,supplier_code,price,currency,stock,min_stock,max_stock,location,description,is_active,is_ecommerce,product_url,brand,asin';
    const example1 = 'SKU001,Wireless Mouse,Electronics,WM-100,2.4GHz wireless,Logitech,LOG-001,25.99,USD,100,10,500,Warehouse A,Ergonomic wireless mouse,true,true,https://amazon.com/dp/B123,Logitech,B0123456';
    const example2 = 'SKU002,USB Cable,Accessories,USB-C-1M,USB-C to USB-A 1m,Anker,ANK-002,12.50,USD,200,20,1000,Warehouse B,High speed charging cable,true,false,,,';
    const csvContent = `${headers}\n${example1}\n${example2}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        let content = event.target?.result as string || '';
        // Remove BOM if present
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
        }
        setCsvText(content);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Parse a single CSV line handling quoted fields, escaped quotes, and commas within quotes
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"') {
          // Check for escaped quote ("")
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i += 2;
            continue;
          } else {
            // End of quoted field
            inQuotes = false;
            i++;
            continue;
          }
        } else {
          current += char;
          i++;
        }
      } else {
        if (char === '"') {
          // Start of quoted field
          inQuotes = true;
          i++;
        } else if (char === ',') {
          values.push(current.trim());
          current = '';
          i++;
        } else {
          current += char;
          i++;
        }
      }
    }

    // Push the last field
    values.push(current.trim());
    return values;
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;

    setImporting(true);
    setImportResults(null);

    try {
      // Normalize line endings and remove BOM
      let content = csvText;
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV must have a header row and at least one data row');
        setImporting(false);
        return;
      }

      const products: Array<{
        sku: string;
        name: string;
        category: string;
        model: string;
        specification: string;
        supplier: string;
        supplier_code: string;
        price: number;
        currency: string;
        stock: number;
        min_stock: number;
        max_stock: number;
        location: string;
        description: string;
        is_active: boolean;
        is_ecommerce: boolean;
        product_url: string;
        brand: string;
        asin: string;
      }> = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line using robust parser
        const values = parseCSVLine(line);

        if (values.length >= 3 && values[0] && values[1]) {
          products.push({
            sku: values[0] || '',
            name: values[1] || '',
            category: values[2] || '',
            model: values[3] || '',
            specification: values[4] || '',
            supplier: values[5] || '',
            supplier_code: values[6] || '',
            price: parseFloat(values[7]) || 0,
            currency: values[8] || 'USD',
            stock: parseInt(values[9]) || 0,
            min_stock: parseInt(values[10]) || 0,
            max_stock: parseInt(values[11]) || 0,
            location: values[12] || '',
            description: values[13] || '',
            is_active: values[14]?.toLowerCase() !== 'false',
            is_ecommerce: values[15]?.toLowerCase() === 'true',
            product_url: values[16] || '',
            brand: values[17] || '',
            asin: values[18] || '',
          });
        }
      }

      if (products.length === 0) {
        setError('No valid products found in CSV');
        setImporting(false);
        return;
      }

      const response = await productsApi.bulkImport(products);
      setImportResults(response);

      if (response.success > 0) {
        fetchProducts();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to import products');
    } finally {
      setImporting(false);
    }
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setCsvText('');
    setImportResults(null);
    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFA] overflow-x-hidden">
      {/* Header */}
      <section className="border-b border-[#ABC0B9] bg-white px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="mb-2 text-2xl sm:text-3xl md:text-4xl text-[#2D363F]" style={{ fontWeight: 600 }}>
              {t.title}
            </h1>
            <p className="text-base text-[#4E616F]">{t.subtitle}</p>
          </div>
          {canEdit && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 rounded-xl border border-[#5C2F0E] px-6 py-3 text-[#5C2F0E] hover:bg-[#5C2F0E]/10 transition-all"
              >
                <FileSpreadsheet className="h-5 w-5" />
                {t.importProducts}
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] px-6 py-3 text-white shadow-md hover:opacity-90 transition-all"
              >
                <Plus className="h-5 w-5" />
                {t.addProduct}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 md:px-8 py-4 border-b border-[#ABC0B9] bg-white">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E616F]" />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
          >
            <option value="all">{t.all}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Products Table */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="text-center py-12 text-[#4E616F]">{t.loading}</div>
          ) : products.length === 0 ? (
            <div className="rounded-lg bg-white shadow-sm border border-[#ABC0B9] p-12 text-center">
              <Package className="h-16 w-16 text-[#ABC0B9] mx-auto mb-4" />
              <p className="text-xl text-[#4E616F]">{t.noProducts}</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-[#ABC0B9] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[#FAFBFA] border-b border-[#ABC0B9]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#4E616F]">{t.sku}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#4E616F]">{t.name}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#4E616F]">{t.category}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-[#4E616F]">{t.supplier}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-[#4E616F]">{t.price}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-[#4E616F]">{t.stock}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-[#4E616F]">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-[#ABC0B9] hover:bg-[#FAFBFA]">
                        <td className="px-4 py-3 text-sm text-[#2D363F]">{product.sku}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {product.image_emoji && <span className="text-xl">{product.image_emoji}</span>}
                            <span className="text-sm text-[#2D363F]">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4E616F]">{product.category}</td>
                        <td className="px-4 py-3 text-sm text-[#4E616F]">{product.supplier}</td>
                        <td className="px-4 py-3 text-sm text-right text-[#2D363F]">
                          {product.currency} {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-[#2D363F]">{product.stock}</span>
                            {getStockStatusBadge(product.stock_status)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {canEdit && (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleOpenModal(product)}
                                className="p-2 text-[#5C2F0E] hover:bg-[#FAFBFA] rounded-lg transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(product.id)}
                                className="p-2 text-[#AA2F0D] hover:bg-[#AA2F0D]/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-[#4E616F]">
                    {total} products total
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-[#ABC0B9] rounded-lg disabled:opacity-50 hover:bg-[#FAFBFA]"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-[#4E616F]">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-[#ABC0B9] rounded-lg disabled:opacity-50 hover:bg-[#FAFBFA]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#ABC0B9] px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#2D363F]">
                {editingProduct ? t.editProduct : t.addProduct}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-[#FAFBFA] rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-4 bg-[#AA2F0D]/10 border border-[#AA2F0D]-200 rounded-lg flex items-center gap-2 text-[#AA2F0D]">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-[#2D363F] mb-4">{t.basicInfo}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.sku} *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      disabled={!!editingProduct}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E] disabled:bg-[#ABC0B9]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.category} *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                      list="categories"
                    />
                    <datalist id="categories">
                      {categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.model}</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.supplier}</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.supplierCode}</label>
                    <input
                      type="text"
                      value={formData.supplier_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.clickupId}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.clickup_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, clickup_id: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                        placeholder="e.g., abc123"
                      />
                      {formData.clickup_id && (
                        <a
                          href={`https://app.clickup.com/t/${formData.clickup_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#5C2F0E] hover:bg-[#FAFBFA] rounded-lg"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Localization */}
              <div>
                <h3 className="text-lg font-medium text-[#2D363F] mb-4">{t.localization}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.nameEn} *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.nameZh}</label>
                    <input
                      type="text"
                      value={formData.name_zh}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_zh: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.nameEs}</label>
                    <input
                      type="text"
                      value={formData.name_es}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_es: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.specEn}</label>
                    <input
                      type="text"
                      value={formData.specification}
                      onChange={(e) => setFormData(prev => ({ ...prev, specification: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.specZh}</label>
                    <input
                      type="text"
                      value={formData.spec_zh}
                      onChange={(e) => setFormData(prev => ({ ...prev, spec_zh: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.specEs}</label>
                    <input
                      type="text"
                      value={formData.spec_es}
                      onChange={(e) => setFormData(prev => ({ ...prev, spec_es: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.description}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div>
                <h3 className="text-lg font-medium text-[#2D363F] mb-4">{t.pricing}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.price} *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.currency}</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    >
                      <option value="USD">USD</option>
                      <option value="MXN">MXN</option>
                      <option value="CNY">CNY</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.location}</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Warehouse A, Shelf B3"
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.stock}</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      min="0"
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.minStock}</label>
                    <input
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
                      min="0"
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.maxStock}</label>
                    <input
                      type="number"
                      value={formData.max_stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_stock: parseInt(e.target.value) || 0 }))}
                      min="0"
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                </div>
              </div>

              {/* Media & Images */}
              <div>
                <h3 className="text-lg font-medium text-[#2D363F] mb-4">{t.media}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.imageEmoji}</label>
                    <input
                      type="text"
                      value={formData.image_emoji}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_emoji: e.target.value }))}
                      placeholder="e.g., ⌨️"
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.imageUrl}</label>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4E616F] mb-2">{t.images}</label>
                  <p className="text-xs text-[#4E616F] mb-3">{t.uploadRequirements}</p>

                  <div className="flex flex-wrap gap-3 mb-3">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.url.startsWith('/uploads') ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${img.url}` : img.url}
                          alt={`Product ${index + 1}`}
                          className={`w-24 h-24 object-cover rounded-lg border-2 ${img.is_primary ? 'border-[#5C2F0E]' : 'border-[#ABC0B9]'}`}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setImagePrimary(index)}
                            className="p-1 bg-white rounded text-xs"
                            title="Set as primary"
                          >
                            Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1 bg-[#AA2F0D]/100 text-white rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {img.is_primary && (
                          <span className="absolute -top-2 -right-2 bg-[#5C2F0E] text-white text-xs px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-24 h-24 border-2 border-dashed border-[#ABC0B9] rounded-lg flex flex-col items-center justify-center text-[#4E616F] hover:border-[#5C2F0E] hover:text-[#5C2F0E] transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <span className="text-xs">Uploading...</span>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-xs">Upload</span>
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* E-commerce Section */}
              <div>
                <h3 className="text-lg font-medium text-[#2D363F] mb-4">{t.ecommerce}</h3>
                <p className="text-sm text-[#4E616F] mb-4">{t.ecommerceHint}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.productUrl}</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.product_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, product_url: e.target.value }))}
                        placeholder="https://www.amazon.com.mx/dp/..."
                        className="flex-1 px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                      />
                      {formData.product_url && (
                        <a
                          href={formData.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#5C2F0E] hover:bg-[#FAFBFA] rounded-lg"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.brand}</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.asin}</label>
                    <input
                      type="text"
                      value={formData.asin}
                      onChange={(e) => setFormData(prev => ({ ...prev, asin: e.target.value }))}
                      placeholder="B0BWK6PXZX"
                      className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="is_ecommerce"
                      checked={formData.is_ecommerce}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_ecommerce: e.target.checked }))}
                      className="h-4 w-4 rounded border-[#ABC0B9] text-[#5C2F0E] focus:ring-[#5C2F0E]"
                    />
                    <label htmlFor="is_ecommerce" className="text-sm text-[#4E616F]">{t.isEcommerce}</label>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-[#ABC0B9] text-[#5C2F0E] focus:ring-[#5C2F0E]"
                />
                <label htmlFor="is_active" className="text-sm text-[#4E616F]">{t.active}</label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[#ABC0B9] px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-[#ABC0B9] rounded-lg text-[#4E616F] hover:bg-[#FAFBFA] transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] text-white rounded-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? '...' : t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#2D363F] mb-4">{t.confirmDelete}</h3>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-[#ABC0B9] rounded-lg text-[#4E616F] hover:bg-[#FAFBFA]"
              >
                {t.no}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-[#AA2F0D] text-white rounded-lg hover:bg-[#AA2F0D]"
              >
                {t.yes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#ABC0B9] px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#2D363F]">{t.importFromCSV}</h2>
              <button onClick={handleCloseImportModal} className="p-2 hover:bg-[#FAFBFA] rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Download Template */}
              <div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 border border-[#5C2F0E] text-[#5C2F0E] rounded-lg hover:bg-[#5C2F0E]/10 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  {t.downloadTemplate}
                </button>
              </div>

              {/* CSV Format Info */}
              <p className="text-xs text-[#4E616F] bg-[#FAFBFA] p-3 rounded-lg break-all">{t.csvFormat}</p>

              {/* File Upload */}
              <div>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="block w-full text-sm text-[#4E616F] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#ABC0B9] file:text-sm file:font-medium file:bg-white file:text-[#5C2F0E] hover:file:bg-[#FAFBFA]"
                />
              </div>

              {/* CSV Textarea */}
              <div>
                <label className="block text-sm font-medium text-[#4E616F] mb-1">{t.pasteCSV}</label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-[#ABC0B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C2F0E] font-mono text-sm"
                  placeholder="sku,name,category,..."
                />
              </div>

              {/* Import Results */}
              {importResults && (
                <div className={`p-4 rounded-lg ${importResults.failed > 0 ? 'bg-[#F38756]/20 border border-[#E95F20]-200' : 'bg-[#ABC0B9]/20 border border-[#ABC0B9]-200'}`}>
                  <p className="font-medium text-[#2D363F] mb-2">
                    {t.importSuccess}: {importResults.success} {t.imported}, {importResults.failed} {t.failed}
                  </p>
                  {importResults.results.filter(r => !r.success).length > 0 && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {importResults.results.filter(r => !r.success).map((result, idx) => (
                        <p key={idx} className="text-sm text-[#AA2F0D]">
                          {t.row} {result.row}: {result.sku} - {result.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[#ABC0B9] px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseImportModal}
                className="px-6 py-2 border border-[#ABC0B9] rounded-lg text-[#4E616F] hover:bg-[#FAFBFA] transition-colors"
              >
                {importResults ? t.close : t.cancel}
              </button>
              {!importResults && (
                <button
                  onClick={handleImport}
                  disabled={importing || !csvText.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] text-white rounded-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {importing ? '...' : t.import}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
