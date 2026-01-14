'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import React from 'react';
import {
  CheckSquare,
  Clock,
  X,
  Check,
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
  Sparkles,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { approvalsApi, aiApi } from '@/lib/api';
import { getTranslatedText } from '@/lib/translations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import type { PurchaseRequest, PurchaseRequestItem } from '@/types';

type ViewMode = 'cards' | 'table';

// Simple markdown renderer for AI summary
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const processInline = (line: string): React.ReactNode => {
    // Process bold, italic, and inline code
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text** or __text__
      const boldMatch = remaining.match(/^(.*?)(\*\*|__)(.+?)\2(.*)$/);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(boldMatch[1]);
        parts.push(<strong key={key++} className="font-semibold text-purple-900">{processInline(boldMatch[3])}</strong>);
        remaining = boldMatch[4];
        continue;
      }

      // Italic *text* or _text_
      const italicMatch = remaining.match(/^(.*?)(\*|_)(.+?)\2(.*)$/);
      if (italicMatch) {
        if (italicMatch[1]) parts.push(italicMatch[1]);
        parts.push(<em key={key++} className="italic">{processInline(italicMatch[3])}</em>);
        remaining = italicMatch[4];
        continue;
      }

      // Inline code `code`
      const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)$/);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(codeMatch[1]);
        parts.push(<code key={key++} className="bg-purple-100 px-1 py-0.5 rounded text-purple-800 font-mono text-xs">{codeMatch[2]}</code>);
        remaining = codeMatch[3];
        continue;
      }

      parts.push(remaining);
      break;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      elements.push(
        <ListTag key={elements.length} className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} ml-4 my-2 space-y-1`}>
          {listItems.map((item, i) => (
            <li key={i} className="text-[#2D363F]">{processInline(item)}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={idx} className="text-sm font-bold text-purple-900 mt-3 mb-1">{processInline(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={idx} className="text-base font-bold text-purple-900 mt-3 mb-1">{processInline(line.slice(3))}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={idx} className="text-lg font-bold text-purple-900 mt-3 mb-2">{processInline(line.slice(2))}</h2>);
      return;
    }

    // Horizontal rule
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/) || line.match(/^___+$/)) {
      flushList();
      elements.push(<hr key={idx} className="my-3 border-purple-200" />);
      return;
    }

    // Unordered list items
    const ulMatch = line.match(/^[\-\*]\s+(.+)$/);
    if (ulMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(ulMatch[1]);
      return;
    }

    // Ordered list items
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(olMatch[1]);
      return;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(<p key={idx} className="text-sm text-[#2D363F] leading-relaxed">{processInline(line)}</p>);
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
};

// Get display number - PO number if approved/purchased/delivered, otherwise request number
const getDisplayNumber = (request: PurchaseRequest): string => {
  if ((request.status === 'approved' || request.status === 'purchased' || request.status === 'delivered') && request.po_number) {
    return request.po_number;
  }
  return request.request_number;
};

export default function ApprovalsPage() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // GM, Admin, and Purchase Admin see all requests by default
  const canViewAll = user?.role === 'general_manager' || user?.role === 'admin' || user?.role === 'purchase_admin';
  const [selectedTab, setSelectedTab] = useState(canViewAll ? 'all' : 'pending');
  const [selectedApproval, setSelectedApproval] = useState<PurchaseRequest | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showMyActions, setShowMyActions] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showModalLangMenu, setShowModalLangMenu] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Only general_manager can approve/reject - admin can only view
  const canApprove = user?.role === 'general_manager';

  const text = {
    en: {
      title: 'Approvals',
      subtitle: 'Review and Manage Purchase Requests',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      infoRequested: 'Info Requested',
      all: 'All',
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
      rejectHint: 'A comment is required when rejecting. Please explain why this request is being rejected.',
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
      myApprovals: 'My Approvals',
      myApprovalsHint: 'Show only requests I approved/rejected',
      confirmApproval: 'Confirm Approval',
      confirmApprovalMessage: 'Are you sure you want to approve this request?',
      confirmRejection: 'Confirm Rejection',
      confirmRejectionMessage: 'Are you sure you want to reject this request?',
      cancel: 'Cancel',
      confirm: 'Confirm',
      ago: 'ago',
      generateSummary: 'Generate AI Summary',
      generatingSummary: 'Generating...',
      aiSummary: 'AI Assistant',
      aiSummaryError: 'Failed to generate summary. Make sure Ollama is running.',
      aiQuestionPlaceholder: 'Ask a question about this request...',
      aiAsk: 'Ask',
      webSearch: 'Search Web',
      quickQuestions: {
        isPriceNormal: 'Is this price normal?',
        alternatives: 'Are there cheaper alternatives?',
        isUrgent: 'Is the urgency justified?',
        recommendation: 'Should I approve this?',
      },
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
      statuses: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        info_requested: 'Info Requested',
        purchased: 'Purchased',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        all: 'All',
      },
    },
    zh: {
      title: '审批管理',
      subtitle: '审核和管理采购请求',
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      infoRequested: '需要更多信息',
      all: '全部',
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
      rejectHint: '拒绝时需要填写评论。请说明拒绝此请求的原因。',
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
      myApprovals: '我的审批',
      myApprovalsHint: '仅显示我批准/拒绝的请求',
      confirmApproval: '确认批准',
      confirmApprovalMessage: '您确定要批准此请求吗？',
      confirmRejection: '确认拒绝',
      confirmRejectionMessage: '您确定要拒绝此请求吗？',
      cancel: '取消',
      confirm: '确认',
      ago: '前',
      generateSummary: '生成AI摘要',
      generatingSummary: '生成中...',
      aiSummary: 'AI助手',
      aiSummaryError: '生成摘要失败。请确保Ollama正在运行。',
      aiQuestionPlaceholder: '询问有关此请求的问题...',
      aiAsk: '提问',
      webSearch: '网络搜索',
      quickQuestions: {
        isPriceNormal: '这个价格正常吗？',
        alternatives: '有更便宜的替代品吗？',
        isUrgent: '紧急程度合理吗？',
        recommendation: '我应该批准吗？',
      },
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
      statuses: {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        info_requested: '需要信息',
        purchased: '已购买',
        delivered: '已交付',
        cancelled: '已取消',
        all: '全部',
      },
    },
    es: {
      title: 'Aprobaciones',
      subtitle: 'Revisar y Gestionar Solicitudes de Compra',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      infoRequested: 'Info Solicitada',
      all: 'Todas',
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
      rejectHint: 'Se requiere un comentario al rechazar. Por favor explica por que se rechaza esta solicitud.',
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
      myApprovals: 'Mis Aprobaciones',
      myApprovalsHint: 'Mostrar solo solicitudes que aprobé/rechacé',
      confirmApproval: 'Confirmar Aprobación',
      confirmApprovalMessage: '¿Está seguro de aprobar esta solicitud?',
      confirmRejection: 'Confirmar Rechazo',
      confirmRejectionMessage: '¿Está seguro de rechazar esta solicitud?',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      ago: 'hace',
      generateSummary: 'Generar Resumen IA',
      generatingSummary: 'Generando...',
      aiSummary: 'Asistente IA',
      aiSummaryError: 'Error al generar resumen. Asegúrate de que Ollama esté corriendo.',
      aiQuestionPlaceholder: 'Haz una pregunta sobre esta solicitud...',
      aiAsk: 'Preguntar',
      webSearch: 'Buscar en Web',
      quickQuestions: {
        isPriceNormal: '¿Es normal este precio?',
        alternatives: '¿Hay alternativas más baratas?',
        isUrgent: '¿Está justificada la urgencia?',
        recommendation: '¿Debería aprobar esto?',
      },
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
      statuses: {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        info_requested: 'Info Solicitada',
        purchased: 'Comprado',
        delivered: 'Entregado',
        cancelled: 'Cancelado',
        all: 'Todas',
      },
    },
  };

  const t = text[language];

  useEffect(() => {
    fetchApprovals();
  }, [selectedTab, showMyActions, dateRange]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await approvalsApi.listPending({
        per_page: 50,
        status: selectedTab,
        my_actions: showMyActions || undefined
      });
      setApprovals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string; icon: React.ReactNode } } = {
      pending: { bg: '#E95F20', text: '#FFFFFF', icon: <Clock className="h-3 w-3" /> },
      approved: { bg: '#5C2F0E', text: '#FFFFFF', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { bg: '#AA2F0D', text: '#FFFFFF', icon: <X className="h-3 w-3" /> },
      info_requested: { bg: '#F38756', text: '#FFFFFF', icon: <MessageSquare className="h-3 w-3" /> },
      purchased: { bg: '#4E616F', text: '#FFFFFF', icon: <CheckCircle className="h-3 w-3" /> },
      delivered: { bg: '#5C2F0E', text: '#FFFFFF', icon: <Package className="h-3 w-3" /> },
      cancelled: { bg: '#ABC0B9', text: '#FFFFFF', icon: <X className="h-3 w-3" /> },
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

  const handleGenerateSummary = async (question?: string) => {
    if (!selectedApproval) return;

    setIsGeneratingSummary(true);
    setIsStreaming(true);
    setIsThinking(true);
    setStreamingText('');

    try {
      const items = getProductItems(selectedApproval).map(item => ({
        title: getTranslatedText(item.product_title_translated, item.product_title, language),
        description: getTranslatedText(item.product_description_translated, item.product_description || '', language),
        price: item.estimated_price || 0,
        currency: item.currency || selectedApproval.currency || 'MXN',
        quantity: item.quantity,
      }));

      const requestBody = {
        items,
        justification: getTranslatedText(selectedApproval.justification_translated, selectedApproval.justification || '', language),
        language,
        question: question || undefined,
        previousSummary: aiSummary || undefined,
        stream: true,
      };

      // Use streaming API
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              if (data === '[THINKING]') {
                setIsThinking(true);
                continue;
              }
              if (data === '[RESPONDING]') {
                setIsThinking(false);
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullText += parsed.content;
                  setStreamingText(fullText);
                }
              } catch {
                // Not JSON, might be raw text
                fullText += data;
                setStreamingText(fullText);
              }
            }
          }
        }
      }

      // Finalize the response
      setAiSummary(prev => {
        if (question && prev) {
          return `${prev}\n\n---\n\n**Q: ${question}**\n${fullText}`;
        }
        return fullText;
      });
      setAiQuestion('');
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // Fallback to non-streaming API
      try {
        const items = getProductItems(selectedApproval).map(item => ({
          title: getTranslatedText(item.product_title_translated, item.product_title, language),
          description: getTranslatedText(item.product_description_translated, item.product_description || '', language),
          price: item.estimated_price || 0,
          currency: item.currency || selectedApproval.currency || 'MXN',
          quantity: item.quantity,
        }));

        const response = await aiApi.generateSummary({
          items,
          justification: getTranslatedText(selectedApproval.justification_translated, selectedApproval.justification || '', language),
          language,
          question: question || undefined,
          previousSummary: aiSummary || undefined,
        });

        setAiSummary(prev => {
          if (question && prev) {
            return `${prev}\n\n---\n\n**Q: ${question}**\n${response.summary}`;
          }
          return response.summary;
        });
        setAiQuestion('');
      } catch {
        alert(t.aiSummaryError);
      }
    } finally {
      setIsGeneratingSummary(false);
      setIsStreaming(false);
      setIsThinking(false);
      setStreamingText('');
    }
  };

  // Handle web search for product prices
  const handleWebSearch = (productTitle: string) => {
    const searchQuery = encodeURIComponent(`${productTitle} price comparison`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  const filteredApprovals = approvals.filter((approval) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        approval.request_number?.toLowerCase().includes(query) ||
        approval.po_number?.toLowerCase().includes(query) ||
        approval.requester?.name?.toLowerCase().includes(query) ||
        approval.product_title?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Filter by date range
    if (dateRange?.from) {
      const createdAt = new Date(approval.created_at);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C2F0E]" />
      </div>
    );
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const urgentCount = approvals.filter(a => a.urgency === 'urgent' && a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#FAFBFA] overflow-x-hidden">
      {/* Header */}
      <section className="border-b border-[#ABC0B9] bg-white px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-4xl text-[#2D363F] font-semibold">
                  {t.title}
                </h1>
                {pendingCount > 0 && (
                  <Badge className="bg-[#AA2F0D]/100 text-white text-lg px-3 py-1">
                    {pendingCount}
                  </Badge>
                )}
              </div>
              <p className="text-sm md:text-base text-[#4E616F] mt-1">{t.subtitle}</p>
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
              {(['all', 'pending', 'approved', 'purchased', 'delivered', 'rejected', 'cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedTab === tab
                      ? 'bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] text-white shadow-sm'
                      : 'bg-white text-[#4E616F] border border-[#ABC0B9] hover:bg-[#FAFBFA]'
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

            {/* Date Filter + My Approvals Toggle + Search */}
            <div className="flex flex-1 gap-3 items-center md:ml-auto flex-wrap">
              {/* Date Range Filter */}
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                language={language}
                className="w-full sm:w-auto"
              />

              {/* My Approvals Toggle */}
              {canApprove && (
                <button
                  onClick={() => setShowMyActions(!showMyActions)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${
                    showMyActions
                      ? 'bg-[#5C2F0E] text-white'
                      : 'bg-white text-[#4E616F] border border-[#ABC0B9] hover:bg-[#FAFBFA]'
                  }`}
                  title={t.myApprovalsHint}
                >
                  <User className="h-4 w-4" />
                  {t.myApprovals}
                </button>
              )}

              {/* Search */}
              <div className="w-full sm:flex-1 sm:min-w-[150px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#80959A]" />
                  <Input
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Approvals List */}
          {filteredApprovals.length === 0 ? (
            <div className="rounded-lg bg-white shadow-sm border border-[#ABC0B9] p-12 text-center">
              <CheckSquare className="h-12 w-12 text-[#ABC0B9] mx-auto mb-4" />
              <p className="text-[#4E616F]">{t.noApprovals}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApprovals.map((approval) => {
                const items = getProductItems(approval);
                const totals = calculateTotals(approval);

                return (
                  <div
                    key={approval.id}
                    className="rounded-lg bg-white shadow-sm border border-[#ABC0B9] overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Card Header */}
                    <div className="p-4 md:p-6 border-b border-[#ABC0B9]">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-[#2D363F]">
                            {getDisplayNumber(approval)}
                          </span>
                          {approval.urgency === 'urgent' && (
                            <Badge className="bg-[#AA2F0D]/100 text-white animate-pulse">
                              {t.urgent}
                            </Badge>
                          )}
                          {getStatusBadge(approval.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#4E616F]">
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
                      <p className="text-sm font-medium text-[#4E616F] mb-3">
                        {t.products} ({items.length}):
                      </p>
                      <div className="space-y-3">
                        {items.slice(0, 3).map((item, idx) => (
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
                              <p className="font-medium text-[#2D363F] truncate">
                                {getTranslatedText(item.product_title_translated, item.product_title, language)}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[#4E616F]">
                                <span>{t.quantity}: {item.quantity}</span>
                                {item.estimated_price && (
                                  <span className="font-medium text-[#5C2F0E]">
                                    {item.currency || approval.currency || 'MXN'} ${((item.estimated_price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                {(item.is_amazon_url || item.url) && (
                                  <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                                    {item.is_amazon_url ? 'Amazon' : t.external}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="flex items-center justify-center py-2 rounded-lg bg-[#FAFBFA] border border-[#ABC0B9] text-sm font-medium text-[#4E616F]">
                            +{items.length - 3} {t.products.toLowerCase()}
                          </div>
                        )}
                      </div>

                      {/* Justification Preview */}
                      {approval.justification && (
                        <div className="mt-4 p-3 bg-[#FAFBFA] rounded-lg border border-[#ABC0B9]">
                          <p className="text-sm text-[#4E616F] line-clamp-2">
                            {getTranslatedText(approval.justification_translated, approval.justification, language)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="px-4 md:px-6 py-4 bg-[#FAFBFA] border-t border-[#ABC0B9] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="text-lg font-semibold text-[#5C2F0E]">
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
                              className="text-[#AA2F0D] border-[#AA2F0D]-200 hover:bg-[#AA2F0D]/10"
                              onClick={() => {
                                setSelectedApproval(approval);
                                setComment('');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              className="bg-[#5C2F0E] hover:bg-[#2D363F] text-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4">
          <div className="w-full max-w-7xl h-[95vh] rounded-xl bg-white shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] p-4 md:p-6 rounded-t-xl flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-2xl text-white font-semibold">
                    {getDisplayNumber(selectedApproval)}
                  </h2>
                  {selectedApproval.urgency === 'urgent' && (
                    <Badge className="bg-[#AA2F0D]/100 text-white">
                      {t.urgent}
                    </Badge>
                  )}
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {t.requester}: {selectedApproval.requester?.name || 'Unknown'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Language Selector in Modal */}
                <div className="relative">
                  <button
                    onClick={() => setShowModalLangMenu(!showModalLangMenu)}
                    className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-sm text-white transition-all"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline font-medium">{t.languages[language as keyof typeof t.languages]}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showModalLangMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showModalLangMenu && (
                    <div className="absolute right-0 top-12 w-36 rounded-lg bg-white shadow-xl border border-gray-200 overflow-hidden z-50">
                      {Object.entries(t.languages).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setLanguage(key as Language);
                            setShowModalLangMenu(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                            language === key
                              ? 'bg-purple-50 text-purple-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedApproval(null);
                    setComment('');
                    setAiSummary('');
                    setAiQuestion('');
                    setShowModalLangMenu(false);
                  }}
                  className="text-white hover:text-white/80 p-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Requester Info */}
              <div className="rounded-lg bg-[#FAFBFA] p-4 border border-[#ABC0B9]">
                <h3 className="text-sm font-semibold text-[#2D363F] mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t.requesterInfo}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[#4E616F]">{t.requester}</p>
                    <p className="font-medium text-[#2D363F]">{selectedApproval.requester?.name}</p>
                  </div>
                  <div>
                    <p className="text-[#4E616F]">{t.employeeNumber}</p>
                    <p className="font-medium text-[#2D363F]">{selectedApproval.requester?.employee_number}</p>
                  </div>
                  <div>
                    <p className="text-[#4E616F]">{t.department}</p>
                    <p className="font-medium text-[#2D363F]">{selectedApproval.requester?.department || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[#4E616F]">{t.date}</p>
                    <p className="font-medium text-[#2D363F]">
                      {new Date(selectedApproval.created_at).toLocaleDateString()} ({getTimeAgo(selectedApproval.created_at)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-lg font-semibold text-[#2D363F] mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {t.productDetails} ({getProductItems(selectedApproval).length})
                </h3>
                <div className="space-y-4">
                  {getProductItems(selectedApproval).map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#ABC0B9] bg-white overflow-hidden"
                    >
                      <div className="p-4 flex gap-4">
                        {/* Product Image */}
                        {item.product_image_url ? (
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-[#FAFBFA] border border-[#ABC0B9] overflow-hidden flex-shrink-0">
                            <Image
                              src={item.product_image_url}
                              alt={getTranslatedText(item.product_title_translated, item.product_title, language)}
                              width={128}
                              height={128}
                              className="object-contain w-full h-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-[#FAFBFA] border border-[#ABC0B9] flex items-center justify-center flex-shrink-0">
                            <Package className="h-10 w-10 text-[#4E616F]" />
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-[#2D363F] line-clamp-2">
                              {idx + 1}. {getTranslatedText(item.product_title_translated, item.product_title, language)}
                            </h4>
                            <Badge
                              variant="outline"
                              className={item.is_amazon_url || item.url ? 'border-orange-200 text-orange-700 bg-orange-50' : 'border-[#ABC0B9]-200 text-[#5C2F0E] bg-[#ABC0B9]/20'}
                            >
                              {item.is_amazon_url || item.url ? t.external : t.internalCatalog}
                            </Badge>
                          </div>

                          {item.product_description && (
                            <p className="text-sm text-[#4E616F] mt-1 line-clamp-2">
                              {getTranslatedText(item.product_description_translated, item.product_description, language)}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-[#4E616F]">{t.unitPrice}: </span>
                              <span className="font-semibold text-[#2D363F]">
                                {item.currency}${(item.estimated_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#4E616F]">{t.quantity}: </span>
                              <span className="font-semibold text-[#2D363F]">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-[#4E616F]">{t.subtotal}: </span>
                              <span className="font-semibold text-[#5C2F0E]">
                                {item.currency}${((item.estimated_price || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-3 text-sm text-[#4E616F] hover:underline"
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
              <div className="rounded-lg bg-[#FAFBFA] p-4 border border-[#ABC0B9]">
                <h3 className="text-sm font-semibold text-[#2D363F] mb-3">
                  {t.financialSummary}
                </h3>
                {(() => {
                  const totals = calculateTotals(selectedApproval);
                  return (
                    <div className="space-y-2 text-sm">
                      {totals.catalogCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#4E616F]">
                            {t.catalogProducts} ({totals.catalogCount})
                          </span>
                          <span className="font-medium">{selectedApproval.currency}${totals.catalogTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {totals.externalCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#4E616F]">
                            {t.externalProducts} ({totals.externalCount})
                          </span>
                          <span className="font-medium">{selectedApproval.currency}${totals.externalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="border-t border-[#ABC0B9] pt-2 flex justify-between">
                        <span className="font-semibold text-[#2D363F]">{t.totalEstimated}</span>
                        <span className="font-bold text-lg text-[#5C2F0E]">
                          {selectedApproval.currency}${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Justification */}
              {selectedApproval.justification && (
                <div className="rounded-lg bg-[#FAFBFA] p-4 border border-[#ABC0B9]">
                  <h3 className="text-sm font-semibold text-[#2D363F] mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t.justification}
                  </h3>
                  <p className="text-sm text-[#2D363F] whitespace-pre-wrap">
                    {getTranslatedText(selectedApproval.justification_translated, selectedApproval.justification, language)}
                  </p>
                </div>
              )}

              {/* AI Summary Section */}
              {canApprove && (
                <div className="rounded-xl bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 p-5 border border-purple-200 shadow-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-purple-800 flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      {t.aiSummary}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* Web Search Button */}
                      {selectedApproval && getProductItems(selectedApproval).length > 0 && (
                        <button
                          onClick={() => {
                            const firstProduct = getProductItems(selectedApproval)[0];
                            const title = getTranslatedText(firstProduct.product_title_translated, firstProduct.product_title, language);
                            handleWebSearch(title);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-white border border-purple-200 px-3 py-1.5 text-purple-700 text-xs font-medium shadow-sm transition-all hover:bg-purple-50 hover:border-purple-300 active:scale-95"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t.webSearch}
                        </button>
                      )}
                      <button
                        onClick={() => handleGenerateSummary()}
                        disabled={isGeneratingSummary}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white text-sm font-medium shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg active:scale-95 disabled:opacity-70"
                      >
                        {isGeneratingSummary ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {isGeneratingSummary ? t.generatingSummary : t.generateSummary}
                      </button>
                    </div>
                  </div>

                  {/* AI Response Area */}
                  {(aiSummary || isStreaming) ? (
                    <div className="bg-white rounded-xl p-4 border border-purple-100 mb-4 max-h-80 overflow-y-auto shadow-inner">
                      {/* Thinking Indicator */}
                      {isThinking && (
                        <div className="flex items-center gap-2 mb-3 text-purple-600">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm font-medium animate-pulse">
                            {language === 'es' ? 'Pensando...' : language === 'zh' ? '思考中...' : 'Thinking...'}
                          </span>
                        </div>
                      )}
                      {/* Streaming or Final Content */}
                      {isStreaming && streamingText ? (
                        <div className="prose prose-sm prose-purple max-w-none">
                          {renderMarkdown(streamingText)}
                          <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-0.5" />
                        </div>
                      ) : aiSummary ? (
                        <div className="prose prose-sm prose-purple max-w-none">
                          {renderMarkdown(aiSummary)}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="bg-white/60 rounded-xl p-6 border border-purple-100 mb-4 text-center">
                      <Sparkles className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                      <p className="text-sm text-purple-600/70">
                        {language === 'es' ? 'Haz clic en el botón para generar un resumen con IA' :
                         language === 'zh' ? '点击按钮生成AI摘要' :
                         'Click the button to generate an AI summary'}
                      </p>
                    </div>
                  )}

                  {/* Quick Questions */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-purple-700 mb-2">
                      {language === 'es' ? 'Preguntas rápidas:' : language === 'zh' ? '快速提问：' : 'Quick questions:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(t.quickQuestions).map(([key, question]) => (
                        <button
                          key={key}
                          onClick={() => handleGenerateSummary(question)}
                          disabled={isGeneratingSummary}
                          className="rounded-full bg-white border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm transition-all hover:bg-purple-50 hover:border-purple-300 hover:shadow active:scale-95 disabled:opacity-50"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Question Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && aiQuestion.trim() && !isGeneratingSummary) {
                          handleGenerateSummary(aiQuestion.trim());
                        }
                      }}
                      placeholder={t.aiQuestionPlaceholder}
                      className="flex-1 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm text-[#2D363F] placeholder:text-purple-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 shadow-sm"
                    />
                    <button
                      onClick={() => aiQuestion.trim() && handleGenerateSummary(aiQuestion.trim())}
                      disabled={isGeneratingSummary || !aiQuestion.trim()}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-white text-sm font-medium shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {isGeneratingSummary ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      {t.aiAsk}
                    </button>
                  </div>
                </div>
              )}

              {/* Admin/Internal Notes - visible to GM, admin, purchase_admin */}
              {selectedApproval.admin_notes && (
                <div className="rounded-lg bg-[#5C2F0E]/5 p-4 border border-[#5C2F0E]/20">
                  <h3 className="text-sm font-semibold text-[#5C2F0E] mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Internal Notes
                  </h3>
                  <p className="text-sm text-[#4E616F] whitespace-pre-wrap">
                    {getTranslatedText(selectedApproval.admin_notes_translated, selectedApproval.admin_notes, language)}
                  </p>
                </div>
              )}

              {/* Workflow History */}
              {selectedApproval.history && selectedApproval.history.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#2D363F] mb-3">
                    {t.approvalWorkflow}
                  </h3>
                  <div className="relative">
                    {selectedApproval.history.map((step, idx) => (
                      <div key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                        {idx < selectedApproval.history!.length - 1 && (
                          <div className="absolute left-4 top-8 w-0.5 h-full -translate-x-1/2 bg-[#ABC0B9]" />
                        )}
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 z-10 ${
                            step.new_status === 'approved'
                              ? 'bg-[#ABC0B9]/200'
                              : step.new_status === 'rejected'
                              ? 'bg-[#AA2F0D]/100'
                              : 'bg-[#ABC0B9]'
                          }`}
                        >
                          {step.new_status === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : step.new_status === 'rejected' ? (
                            <X className="h-4 w-4 text-white" />
                          ) : (
                            <Clock className="h-4 w-4 text-[#4E616F]" />
                          )}
                        </div>
                        <div className="flex-1 bg-[#FAFBFA] rounded-lg p-3 border border-[#ABC0B9]">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-[#2D363F]">{step.action}</p>
                            <p className="text-xs text-[#4E616F]">
                              {new Date(step.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs text-[#4E616F]">{step.user?.name || 'System'}</p>
                          {step.comment && (
                            <p className="text-sm text-[#2D363F] mt-2 bg-white p-2 rounded border border-[#ABC0B9]">
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
                <div className="rounded-lg bg-[#FAFBFA] p-4 md:p-6 border border-[#ABC0B9]">
                  <h3 className="text-lg text-[#2D363F] mb-4 font-semibold">{t.addComment}</h3>

                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.commentPlaceholder}
                    className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all placeholder:text-[#4E616F] focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                  />
                  <p className="mt-2 text-xs text-[#4E616F] flex items-center gap-1">
                    <span className="text-[#AA2F0D]">*</span>
                    {t.rejectHint}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#5C2F0E] px-5 py-3 text-white font-medium shadow-sm transition-all hover:bg-[#5C2F0E] active:scale-95 disabled:opacity-50"
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
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#AA2F0D] px-5 py-3 text-white font-medium shadow-sm transition-all hover:bg-[#AA2F0D] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                      {t.reject}
                    </button>
                  </div>
                </div>
              )}

              {/* View Only Message */}
              {selectedApproval.status === 'pending' && !canApprove && (
                <div className="rounded-lg bg-[#ABC0B9] p-4 md:p-6 border border-[#ABC0B9]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4E616F]/10">
                      <Eye className="h-5 w-5 text-[#4E616F]" />
                    </div>
                    <div>
                      <h3 className="text-lg text-[#2D363F] font-semibold">{t.viewOnly}</h3>
                      <p className="text-sm text-[#4E616F]">{t.viewOnlyMessage}</p>
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
