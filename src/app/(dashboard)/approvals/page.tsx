'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CheckSquare,
  Clock,
  X,
  Check,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  ExternalLink,
  Package,
  ShoppingBag,
  MessageSquare,
  User,
  Building2,
  Calendar,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { approvalsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PurchaseRequest, PurchaseRequestItem } from '@/types';

type ViewMode = 'cards' | 'table';

export default function ApprovalsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState<PurchaseRequest | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Only general_manager can approve/reject - admin can only view
  const canApprove = user?.role === 'general_manager';

  const text = {
    en: {
      title: 'Pending Approvals',
      subtitle: 'Review and Approve Purchase Requests',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      infoRequested: 'Info Requested',
      prNumber: 'PR Number',
      requester: 'Requester',
      department: 'Department',
      amount: 'Amount',
      date: 'Date',
      status: 'Status',
      actions: 'Actions',
      review: 'Review',
      viewDetails: 'View Details',
      approvalWorkflow: 'Approval Workflow',
      approve: 'Approve',
      reject: 'Reject',
      requestInfo: 'Request More Info',
      addComment: 'Add Comment',
      commentPlaceholder: 'Add your review comments...',
      rejectReasonPlaceholder: 'Reason for rejection (required)...',
      infoRequestPlaceholder: 'What information do you need?',
      productDetails: 'Requested Products',
      products: 'Products',
      item: 'Item',
      specification: 'Specification',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      subtotal: 'Subtotal',
      total: 'Total',
      supplier: 'Supplier',
      urgent: 'URGENT',
      normal: 'Normal',
      noApprovals: 'No pending approvals',
      viewOnly: 'View Only',
      viewOnlyMessage: 'You can view pending approvals but only General Managers can approve or reject requests.',
      justification: 'Justification',
      requesterInfo: 'Requester Information',
      employeeNumber: 'Employee ID',
      email: 'Email',
      financialSummary: 'Financial Summary',
      catalogProducts: 'Catalog Products',
      externalProducts: 'External Products',
      totalEstimated: 'Total Estimated',
      origin: 'Origin',
      internalCatalog: 'Internal Catalog',
      external: 'External',
      viewProduct: 'View Product',
      search: 'Search requests...',
      refresh: 'Refresh',
      confirmApproval: 'Confirm Approval',
      confirmApprovalMessage: 'Are you sure you want to approve this request?',
      confirmRejection: 'Confirm Rejection',
      confirmRejectionMessage: 'Are you sure you want to reject this request?',
      cancel: 'Cancel',
      confirm: 'Confirm',
      ago: 'ago',
      statuses: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        info_requested: 'Info Requested',
        purchased: 'Purchased',
      },
    },
    zh: {
      title: '待审批',
      subtitle: '审核和批准采购请求',
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      infoRequested: '需要更多信息',
      prNumber: 'PR编号',
      requester: '请求人',
      department: '部门',
      amount: '金额',
      date: '日期',
      status: '状态',
      actions: '操作',
      review: '审核',
      viewDetails: '查看详情',
      approvalWorkflow: '审批工作流',
      approve: '批准',
      reject: '拒绝',
      requestInfo: '请求更多信息',
      addComment: '添加评论',
      commentPlaceholder: '添加您的审核意见...',
      rejectReasonPlaceholder: '拒绝原因（必填）...',
      infoRequestPlaceholder: '您需要什么信息？',
      productDetails: '请求的产品',
      products: '产品',
      item: '商品',
      specification: '规格',
      quantity: '数量',
      unitPrice: '单价',
      subtotal: '小计',
      total: '总计',
      supplier: '供应商',
      urgent: '紧急',
      normal: '普通',
      noApprovals: '没有待审批项目',
      viewOnly: '仅查看',
      viewOnlyMessage: '您可以查看待审批项目，但只有总经理可以批准或拒绝请求。',
      justification: '理由',
      requesterInfo: '申请人信息',
      employeeNumber: '员工编号',
      email: '邮箱',
      financialSummary: '财务摘要',
      catalogProducts: '目录产品',
      externalProducts: '外部产品',
      totalEstimated: '预估总计',
      origin: '来源',
      internalCatalog: '内部目录',
      external: '外部',
      viewProduct: '查看产品',
      search: '搜索请求...',
      refresh: '刷新',
      confirmApproval: '确认批准',
      confirmApprovalMessage: '您确定要批准此请求吗？',
      confirmRejection: '确认拒绝',
      confirmRejectionMessage: '您确定要拒绝此请求吗？',
      cancel: '取消',
      confirm: '确认',
      ago: '前',
      statuses: {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        info_requested: '需要信息',
        purchased: '已购买',
      },
    },
    es: {
      title: 'Aprobaciones Pendientes',
      subtitle: 'Revisar y Aprobar Solicitudes de Compra',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      infoRequested: 'Info Solicitada',
      prNumber: 'Número PR',
      requester: 'Solicitante',
      department: 'Departamento',
      amount: 'Monto',
      date: 'Fecha',
      status: 'Estado',
      actions: 'Acciones',
      review: 'Revisar',
      viewDetails: 'Ver Detalles',
      approvalWorkflow: 'Flujo de Aprobación',
      approve: 'Aprobar',
      reject: 'Rechazar',
      requestInfo: 'Solicitar Más Info',
      addComment: 'Agregar Comentario',
      commentPlaceholder: 'Agregar sus comentarios de revisión...',
      rejectReasonPlaceholder: 'Motivo del rechazo (obligatorio)...',
      infoRequestPlaceholder: '¿Qué información necesita?',
      productDetails: 'Productos Solicitados',
      products: 'Productos',
      item: 'Artículo',
      specification: 'Especificación',
      quantity: 'Cant',
      unitPrice: 'Precio Unit.',
      subtotal: 'Subtotal',
      total: 'Total',
      supplier: 'Proveedor',
      urgent: 'URGENTE',
      normal: 'Normal',
      noApprovals: 'No hay aprobaciones pendientes',
      viewOnly: 'Solo Lectura',
      viewOnlyMessage: 'Puede ver las aprobaciones pendientes pero solo los Gerentes Generales pueden aprobar o rechazar solicitudes.',
      justification: 'Justificación',
      requesterInfo: 'Información del Solicitante',
      employeeNumber: 'Número de Nómina',
      email: 'Correo',
      financialSummary: 'Resumen Financiero',
      catalogProducts: 'Productos del Catálogo',
      externalProducts: 'Productos Externos',
      totalEstimated: 'Total Estimado',
      origin: 'Origen',
      internalCatalog: 'Catálogo Interno',
      external: 'Externo',
      viewProduct: 'Ver Producto',
      search: 'Buscar solicitudes...',
      refresh: 'Actualizar',
      confirmApproval: 'Confirmar Aprobación',
      confirmApprovalMessage: '¿Está seguro de aprobar esta solicitud?',
      confirmRejection: 'Confirmar Rechazo',
      confirmRejectionMessage: '¿Está seguro de rechazar esta solicitud?',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      ago: 'hace',
      statuses: {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        info_requested: 'Info Solicitada',
        purchased: 'Comprado',
      },
    },
  };

  const t = text[language];

  useEffect(() => {
    fetchApprovals();
  }, [selectedTab]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await approvalsApi.listPending({ per_page: 50, status: selectedTab });
      setApprovals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string; icon: React.ReactNode } } = {
      pending: { bg: '#FEF3C7', text: '#D97706', icon: <Clock className="h-3 w-3" /> },
      approved: { bg: '#D1FAE5', text: '#059669', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { bg: '#FEE2E2', text: '#DC2626', icon: <X className="h-3 w-3" /> },
      info_requested: { bg: '#DBEAFE', text: '#2563EB', icon: <MessageSquare className="h-3 w-3" /> },
      purchased: { bg: '#D1FAE5', text: '#059669', icon: <CheckCircle className="h-3 w-3" /> },
    };
    const s = statusMap[status] || statusMap.pending;
    return (
      <Badge
        style={{ backgroundColor: s.bg, color: s.text }}
        className="font-medium flex items-center gap-1"
      >
        {s.icon}
        {t.statuses[status as keyof typeof t.statuses] || status}
      </Badge>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ${t.ago}`;
    if (diffHours < 24) return `${diffHours}h ${t.ago}`;
    return `${diffDays}d ${t.ago}`;
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    setIsSubmitting(true);
    try {
      await approvalsApi.approve(selectedApproval.id, comment);
      setSelectedApproval(null);
      setComment('');
      fetchApprovals();
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !comment) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsSubmitting(true);
    try {
      await approvalsApi.reject(selectedApproval.id, comment);
      setSelectedApproval(null);
      setComment('');
      fetchApprovals();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedApproval || !comment) {
      alert('Please specify what information you need');
      return;
    }
    setIsSubmitting(true);
    try {
      await approvalsApi.requestInfo(selectedApproval.id, comment);
      setSelectedApproval(null);
      setComment('');
      fetchApprovals();
    } catch (error) {
      console.error('Failed to request info:', error);
      alert('Failed to request info');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredApprovals = approvals.filter((approval) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        approval.request_number?.toLowerCase().includes(query) ||
        approval.requester?.name?.toLowerCase().includes(query) ||
        approval.product_title?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate totals for multi-product request
  const calculateTotals = (request: PurchaseRequest) => {
    if (request.items && request.items.length > 0) {
      let catalogTotal = 0;
      let externalTotal = 0;
      let catalogCount = 0;
      let externalCount = 0;

      request.items.forEach((item) => {
        const subtotal = (item.estimated_price || 0) * item.quantity;
        if (item.is_amazon_url || item.url) {
          externalTotal += subtotal;
          externalCount++;
        } else {
          catalogTotal += subtotal;
          catalogCount++;
        }
      });

      return { catalogTotal, externalTotal, catalogCount, externalCount, total: catalogTotal + externalTotal };
    }

    // Legacy single-product
    return {
      catalogTotal: 0,
      externalTotal: (request.estimated_price || 0) * request.quantity,
      catalogCount: 0,
      externalCount: 1,
      total: (request.estimated_price || 0) * request.quantity,
    };
  };

  // Get product items (handles both multi-product and legacy)
  const getProductItems = (request: PurchaseRequest): PurchaseRequestItem[] => {
    if (request.items && request.items.length > 0) {
      return request.items;
    }
    // Convert legacy single product to item format
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
    }];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#75534B]" />
      </div>
    );
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const urgentCount = approvals.filter(a => a.urgency === 'urgent' && a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <section className="border-b border-[#E4E1DD] bg-white px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-4xl text-[#2C2C2C] font-semibold">
                  {t.title}
                </h1>
                {pendingCount > 0 && (
                  <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                    {pendingCount}
                  </Badge>
                )}
              </div>
              <p className="text-sm md:text-base text-[#6E6B67] mt-1">{t.subtitle}</p>
            </div>
            <Button
              variant="outline"
              onClick={fetchApprovals}
              disabled={isLoading}
              className="self-start md:self-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          {/* Filters and Search */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {(['pending', 'approved', 'rejected', 'info_requested'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedTab === tab
                      ? 'bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white shadow-sm'
                      : 'bg-white text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#F9F8F6]'
                  }`}
                >
                  {t.statuses[tab]}
                  {tab === 'pending' && pendingCount > 0 && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 md:max-w-xs md:ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Approvals List */}
          {filteredApprovals.length === 0 ? (
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
              <CheckSquare className="h-12 w-12 text-[#E4E1DD] mx-auto mb-4" />
              <p className="text-[#6E6B67]">{t.noApprovals}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApprovals.map((approval) => {
                const items = getProductItems(approval);
                const totals = calculateTotals(approval);

                return (
                  <div
                    key={approval.id}
                    className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Card Header */}
                    <div className="p-4 md:p-6 border-b border-[#E4E1DD]">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-[#2C2C2C]">
                            {approval.request_number}
                          </span>
                          {approval.urgency === 'urgent' && (
                            <Badge className="bg-red-500 text-white animate-pulse">
                              {t.urgent}
                            </Badge>
                          )}
                          {getStatusBadge(approval.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#6E6B67]">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {approval.requester?.name || 'Unknown'}
                          </span>
                          {approval.requester?.department && (
                            <span className="hidden md:flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {approval.requester.department}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {getTimeAgo(approval.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products Preview */}
                    <div className="p-4 md:p-6">
                      <p className="text-sm font-medium text-[#6E6B67] mb-3">
                        {t.products} ({items.length}):
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {items.slice(0, 4).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-[#F9F8F6] rounded-lg p-3 border border-[#E4E1DD]"
                          >
                            {item.product_image_url ? (
                              <div className="w-12 h-12 rounded bg-white border border-[#E4E1DD] overflow-hidden flex-shrink-0">
                                <Image
                                  src={item.product_image_url}
                                  alt={item.product_title}
                                  width={48}
                                  height={48}
                                  className="object-contain w-full h-full"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded bg-[#E4E1DD] flex items-center justify-center flex-shrink-0">
                                <Package className="h-6 w-6 text-[#6E6B67]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#2C2C2C] truncate max-w-[150px]">
                                {item.product_title}
                              </p>
                              <p className="text-xs text-[#6E6B67]">
                                x{item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                        {items.length > 4 && (
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] text-sm font-medium text-[#6E6B67]">
                            +{items.length - 4}
                          </div>
                        )}
                      </div>

                      {/* Justification Preview */}
                      {approval.justification && (
                        <div className="mt-4 p-3 bg-[#F9F8F6] rounded-lg border border-[#E4E1DD]">
                          <p className="text-sm text-[#6E6B67] line-clamp-2">
                            {approval.justification}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="px-4 md:px-6 py-4 bg-[#F9F8F6] border-t border-[#E4E1DD] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="text-lg font-semibold text-[#75534B]">
                        {t.total}: {approval.currency}${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedApproval(approval)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t.viewDetails}
                        </Button>
                        {canApprove && approval.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setSelectedApproval(approval);
                                setComment('');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setSelectedApproval(approval);
                                setComment('');
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8 rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#75534B] to-[#5D423C] p-4 md:p-6 rounded-t-xl flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-2xl text-white font-semibold">
                    {selectedApproval.request_number}
                  </h2>
                  {selectedApproval.urgency === 'urgent' && (
                    <Badge className="bg-red-500 text-white">
                      {t.urgent}
                    </Badge>
                  )}
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {t.requester}: {selectedApproval.requester?.name || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setComment('');
                }}
                className="text-white hover:text-white/80 p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Requester Info */}
              <div className="rounded-lg bg-[#F9F8F6] p-4 border border-[#E4E1DD]">
                <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t.requesterInfo}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[#6E6B67]">{t.requester}</p>
                    <p className="font-medium text-[#2C2C2C]">{selectedApproval.requester?.name}</p>
                  </div>
                  <div>
                    <p className="text-[#6E6B67]">{t.employeeNumber}</p>
                    <p className="font-medium text-[#2C2C2C]">{selectedApproval.requester?.employee_number}</p>
                  </div>
                  <div>
                    <p className="text-[#6E6B67]">{t.department}</p>
                    <p className="font-medium text-[#2C2C2C]">{selectedApproval.requester?.department || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#6E6B67]">{t.date}</p>
                    <p className="font-medium text-[#2C2C2C]">
                      {new Date(selectedApproval.created_at).toLocaleDateString()} ({getTimeAgo(selectedApproval.created_at)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {t.productDetails} ({getProductItems(selectedApproval).length})
                </h3>
                <div className="space-y-4">
                  {getProductItems(selectedApproval).map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#E4E1DD] bg-white overflow-hidden"
                    >
                      <div className="p-4 flex gap-4">
                        {/* Product Image */}
                        {item.product_image_url ? (
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] overflow-hidden flex-shrink-0">
                            <Image
                              src={item.product_image_url}
                              alt={item.product_title}
                              width={128}
                              height={128}
                              className="object-contain w-full h-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] flex items-center justify-center flex-shrink-0">
                            <Package className="h-10 w-10 text-[#6E6B67]" />
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-[#2C2C2C] line-clamp-2">
                              {idx + 1}. {item.product_title}
                            </h4>
                            <Badge
                              variant="outline"
                              className={item.is_amazon_url || item.url ? 'border-orange-200 text-orange-700 bg-orange-50' : 'border-green-200 text-green-700 bg-green-50'}
                            >
                              {item.is_amazon_url || item.url ? t.external : t.internalCatalog}
                            </Badge>
                          </div>

                          {item.product_description && (
                            <p className="text-sm text-[#6E6B67] mt-1 line-clamp-2">
                              {item.product_description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-[#6E6B67]">{t.unitPrice}: </span>
                              <span className="font-semibold text-[#2C2C2C]">
                                {item.currency}${(item.estimated_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#6E6B67]">{t.quantity}: </span>
                              <span className="font-semibold text-[#2C2C2C]">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-[#6E6B67]">{t.subtotal}: </span>
                              <span className="font-semibold text-[#75534B]">
                                {item.currency}${((item.estimated_price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {t.viewProduct}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="rounded-lg bg-[#F9F8F6] p-4 border border-[#E4E1DD]">
                <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">
                  {t.financialSummary}
                </h3>
                {(() => {
                  const totals = calculateTotals(selectedApproval);
                  return (
                    <div className="space-y-2 text-sm">
                      {totals.catalogCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#6E6B67]">
                            {t.catalogProducts} ({totals.catalogCount})
                          </span>
                          <span className="font-medium">{selectedApproval.currency}${totals.catalogTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {totals.externalCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#6E6B67]">
                            {t.externalProducts} ({totals.externalCount})
                          </span>
                          <span className="font-medium">{selectedApproval.currency}${totals.externalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="border-t border-[#E4E1DD] pt-2 flex justify-between">
                        <span className="font-semibold text-[#2C2C2C]">{t.totalEstimated}</span>
                        <span className="font-bold text-lg text-[#75534B]">
                          {selectedApproval.currency}${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Justification */}
              {selectedApproval.justification && (
                <div className="rounded-lg bg-[#F9F8F6] p-4 border border-[#E4E1DD]">
                  <h3 className="text-sm font-semibold text-[#2C2C2C] mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t.justification}
                  </h3>
                  <p className="text-sm text-[#2C2C2C] whitespace-pre-wrap">
                    {selectedApproval.justification}
                  </p>
                </div>
              )}

              {/* Admin/Internal Notes - visible to GM, admin, purchase_admin */}
              {selectedApproval.admin_notes && (
                <div className="rounded-lg bg-[#75534B]/5 p-4 border border-[#75534B]/20">
                  <h3 className="text-sm font-semibold text-[#75534B] mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Internal Notes
                  </h3>
                  <p className="text-sm text-[#6E6B67] whitespace-pre-wrap">
                    {selectedApproval.admin_notes}
                  </p>
                </div>
              )}

              {/* Workflow History */}
              {selectedApproval.history && selectedApproval.history.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">
                    {t.approvalWorkflow}
                  </h3>
                  <div className="relative">
                    {selectedApproval.history.map((step, idx) => (
                      <div key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                        {idx < selectedApproval.history!.length - 1 && (
                          <div className="absolute left-4 top-8 w-0.5 h-full -translate-x-1/2 bg-[#E4E1DD]" />
                        )}
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 z-10 ${
                            step.new_status === 'approved'
                              ? 'bg-green-500'
                              : step.new_status === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-[#E4E1DD]'
                          }`}
                        >
                          {step.new_status === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : step.new_status === 'rejected' ? (
                            <X className="h-4 w-4 text-white" />
                          ) : (
                            <Clock className="h-4 w-4 text-[#6E6B67]" />
                          )}
                        </div>
                        <div className="flex-1 bg-[#F9F8F6] rounded-lg p-3 border border-[#E4E1DD]">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-[#2C2C2C]">{step.action}</p>
                            <p className="text-xs text-[#6E6B67]">
                              {new Date(step.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs text-[#6E6B67]">{step.user?.name || 'System'}</p>
                          {step.comment && (
                            <p className="text-sm text-[#2C2C2C] mt-2 bg-white p-2 rounded border border-[#E4E1DD]">
                              {step.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Section */}
              {selectedApproval.status === 'pending' && canApprove && (
                <div className="rounded-lg bg-[#F9F8F6] p-4 md:p-6 border border-[#E4E1DD]">
                  <h3 className="text-lg text-[#2C2C2C] mb-4 font-semibold">{t.addComment}</h3>

                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.commentPlaceholder}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#10B981] px-5 py-3 text-white font-medium shadow-sm transition-all hover:bg-[#059669] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                      {t.approve}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting || !comment}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-5 py-3 text-white font-medium shadow-sm transition-all hover:bg-[#DC2626] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                      {t.reject}
                    </button>
                    <button
                      onClick={handleRequestInfo}
                      disabled={isSubmitting || !comment}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-5 py-3 text-white font-medium shadow-sm transition-all hover:bg-[#2563EB] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <MessageSquare className="h-5 w-5" />
                      )}
                      {t.requestInfo}
                    </button>
                  </div>
                </div>
              )}

              {/* View Only Message */}
              {selectedApproval.status === 'pending' && !canApprove && (
                <div className="rounded-lg bg-[#F0F9FF] p-4 md:p-6 border border-[#93C5FD]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B82F6]/10">
                      <Eye className="h-5 w-5 text-[#3B82F6]" />
                    </div>
                    <div>
                      <h3 className="text-lg text-[#1E40AF] font-semibold">{t.viewOnly}</h3>
                      <p className="text-sm text-[#3B82F6]">{t.viewOnlyMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
