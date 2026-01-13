'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckSquare,
  Users,
  Settings,
  TrendingUp,
  Clock,
  Loader2,
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Package,
  ArrowRight,
  Plus,
  BarChart3,
  UserCheck,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi, approvalsApi, requestsApi } from '@/lib/api';
import type { DashboardStats, ApprovalStats, PurchaseRequest } from '@/types';

export default function HomePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [myRequests, setMyRequests] = useState<PurchaseRequest[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const text = {
    en: {
      welcome: 'Welcome back',
      // Admin
      adminSubtitle: 'System overview and management',
      systemOverview: 'System Overview',
      totalUsers: 'Total Users',
      pendingUsers: 'Pending Users',
      totalRequests: 'Total Requests',
      pendingApprovals: 'Pending Approvals',
      quickActions: 'Quick Actions',
      manageUsers: 'Manage Users',
      systemSettings: 'System Settings',
      viewAnalytics: 'View Analytics',
      purchaseConfig: 'Purchase Config',
      recentActivity: 'Recent Activity',
      // Purchase Admin / Supply Chain
      purchaseSubtitle: 'Orders and procurement management',
      ordersOverview: 'Orders Overview',
      pendingOrders: 'Pending Orders',
      inCart: 'In Cart',
      purchased: 'Purchased',
      thisMonth: 'This Month',
      processOrders: 'Process Orders',
      newPurchase: 'New Purchase',
      viewCatalog: 'View Catalog',
      ordersToProcess: 'Orders to Process',
      noOrdersPending: 'No orders pending',
      viewAllOrders: 'View All Orders',
      // GM
      gmSubtitle: 'Approvals and oversight',
      approvalsOverview: 'Approvals Overview',
      awaitingReview: 'Awaiting Review',
      approvedThisMonth: 'Approved',
      rejectedThisMonth: 'Rejected',
      totalValue: 'Total Value',
      reviewApprovals: 'Review Approvals',
      pendingReview: 'Pending Review',
      noPendingApprovals: 'No pending approvals',
      viewAllApprovals: 'View All Approvals',
      // Employee
      employeeSubtitle: 'Your purchase requests',
      myRequestsOverview: 'My Requests',
      activeRequests: 'Active',
      approved: 'Approved',
      rejected: 'Rejected',
      pending: 'Pending',
      createRequest: 'Create Request',
      viewMyRequests: 'View My Requests',
      recentRequests: 'Recent Requests',
      noRequests: 'No requests yet',
      viewAll: 'View All',
      // Common
      status: 'Status',
      amount: 'Amount',
      date: 'Date',
      requester: 'Requester',
      viewDetails: 'View Details',
      // Employee Dashboard badges/labels
      totalBadge: 'Total',
      waitingBadge: 'Waiting',
      readyBadge: 'Ready',
      rejectedBadge: 'Rejected',
      noRequestsTitle: 'No requests',
      products: 'products',
      requestFromStore: 'Request products from any online store',
      viewFullHistory: 'View full history',
      needHelp: 'Need help?',
      helpText: 'You can request products from Amazon, MercadoLibre or any online store. Just paste the product link.',
    },
    zh: {
      welcome: '欢迎回来',
      adminSubtitle: '系统概览与管理',
      systemOverview: '系统概览',
      totalUsers: '总用户数',
      pendingUsers: '待审核用户',
      totalRequests: '总请求数',
      pendingApprovals: '待审批',
      quickActions: '快速操作',
      manageUsers: '管理用户',
      systemSettings: '系统设置',
      viewAnalytics: '查看分析',
      purchaseConfig: '采购配置',
      recentActivity: '最近活动',
      purchaseSubtitle: '订单与采购管理',
      ordersOverview: '订单概览',
      pendingOrders: '待处理订单',
      inCart: '已加入购物车',
      purchased: '已购买',
      thisMonth: '本月',
      processOrders: '处理订单',
      newPurchase: '新采购',
      viewCatalog: '查看目录',
      ordersToProcess: '待处理订单',
      noOrdersPending: '无待处理订单',
      viewAllOrders: '查看所有订单',
      gmSubtitle: '审批与监督',
      approvalsOverview: '审批概览',
      awaitingReview: '待审核',
      approvedThisMonth: '已批准',
      rejectedThisMonth: '已拒绝',
      totalValue: '总价值',
      reviewApprovals: '审核审批',
      pendingReview: '待审核',
      noPendingApprovals: '无待审批项目',
      viewAllApprovals: '查看所有审批',
      employeeSubtitle: '您的采购请求',
      myRequestsOverview: '我的请求',
      activeRequests: '进行中',
      approved: '已批准',
      rejected: '已拒绝',
      pending: '待处理',
      createRequest: '创建请求',
      viewMyRequests: '查看我的请求',
      recentRequests: '最近请求',
      noRequests: '暂无请求',
      viewAll: '查看全部',
      status: '状态',
      amount: '金额',
      date: '日期',
      requester: '申请人',
      viewDetails: '查看详情',
      totalBadge: '总计',
      waitingBadge: '等待中',
      readyBadge: '已完成',
      rejectedBadge: '已拒绝',
      noRequestsTitle: '暂无请求',
      products: '个产品',
      requestFromStore: '从任何在线商店请求产品',
      viewFullHistory: '查看完整历史',
      needHelp: '需要帮助？',
      helpText: '您可以从亚马逊、MercadoLibre或任何在线商店请求产品。只需粘贴产品链接即可。',
    },
    es: {
      welcome: 'Bienvenido',
      adminSubtitle: 'Vista general y gestión del sistema',
      systemOverview: 'Vista del Sistema',
      totalUsers: 'Total Usuarios',
      pendingUsers: 'Usuarios Pendientes',
      totalRequests: 'Total Solicitudes',
      pendingApprovals: 'Pendientes de Aprobación',
      quickActions: 'Acciones Rápidas',
      manageUsers: 'Gestionar Usuarios',
      systemSettings: 'Configuración',
      viewAnalytics: 'Ver Analítica',
      purchaseConfig: 'Config. Compras',
      recentActivity: 'Actividad Reciente',
      purchaseSubtitle: 'Gestión de órdenes y compras',
      ordersOverview: 'Resumen de Órdenes',
      pendingOrders: 'Órdenes Pendientes',
      inCart: 'En Carrito',
      purchased: 'Comprados',
      thisMonth: 'Este Mes',
      processOrders: 'Procesar Órdenes',
      newPurchase: 'Nueva Compra',
      viewCatalog: 'Ver Catálogo',
      ordersToProcess: 'Órdenes por Procesar',
      noOrdersPending: 'Sin órdenes pendientes',
      viewAllOrders: 'Ver Todas las Órdenes',
      gmSubtitle: 'Aprobaciones y supervisión',
      approvalsOverview: 'Resumen de Aprobaciones',
      awaitingReview: 'Por Revisar',
      approvedThisMonth: 'Aprobadas',
      rejectedThisMonth: 'Rechazadas',
      totalValue: 'Valor Total',
      reviewApprovals: 'Revisar Aprobaciones',
      pendingReview: 'Pendientes de Revisión',
      noPendingApprovals: 'Sin aprobaciones pendientes',
      viewAllApprovals: 'Ver Todas las Aprobaciones',
      employeeSubtitle: 'Tus solicitudes de compra',
      myRequestsOverview: 'Mis Solicitudes',
      activeRequests: 'Activas',
      approved: 'Aprobadas',
      rejected: 'Rechazadas',
      pending: 'Pendientes',
      createRequest: 'Crear Solicitud',
      viewMyRequests: 'Ver Mis Solicitudes',
      recentRequests: 'Solicitudes Recientes',
      noRequests: 'Sin solicitudes',
      viewAll: 'Ver Todo',
      status: 'Estado',
      amount: 'Monto',
      date: 'Fecha',
      requester: 'Solicitante',
      viewDetails: 'Ver Detalles',
      totalBadge: 'Total',
      waitingBadge: 'En espera',
      readyBadge: 'Listo',
      rejectedBadge: 'Rechazado',
      noRequestsTitle: 'Sin solicitudes',
      products: 'productos',
      requestFromStore: 'Solicita productos de cualquier tienda en línea',
      viewFullHistory: 'Ver historial completo',
      needHelp: '¿Necesitas ayuda?',
      helpText: 'Puedes solicitar productos de Amazon, MercadoLibre o cualquier tienda en línea. Solo pega el enlace del producto.',
    },
  };

  const t = text[language];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Admin: fetch system stats
        if (user?.role === 'admin') {
          const stats = await adminApi.getDashboardStats();
          setDashboardStats(stats);
          const approvals = await approvalsApi.getStats();
          setApprovalStats(approvals);
        }

        // Purchase Admin / Supply Chain: fetch orders
        if (user?.role === 'purchase_admin' || user?.role === 'supply_chain_manager') {
          try {
            const ordersResponse = await adminApi.getApprovedOrders({ filter: 'pending_manual', per_page: 5 });
            setPendingOrders(ordersResponse.data || []);
          } catch (e) {
            console.error('Failed to fetch orders:', e);
          }
        }

        // GM: fetch approval stats
        if (user?.role === 'general_manager') {
          const stats = await approvalsApi.getStats();
          setApprovalStats(stats);
        }

        // Employee: fetch my requests
        if (user?.role === 'employee' || !user?.role) {
          try {
            const response = await requestsApi.getMyRequests({ per_page: 5 });
            setMyRequests(response.data || []);
          } catch (e) {
            console.error('Failed to fetch requests:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="h-3 w-3" /> },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="h-3 w-3" /> },
      purchased: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <ShoppingCart className="h-3 w-3" /> },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#75534B]" />
      </div>
    );
  }

  // ============ ADMIN DASHBOARD ============
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        {/* Header */}
        <section className="bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 md:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl md:text-3xl text-white font-semibold">
              {t.welcome}, {user.name}
            </h1>
            <p className="text-white/80 mt-1">{t.adminSubtitle}</p>
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 md:px-8 py-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{t.systemOverview}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">{dashboardStats?.total_users || 0}</p>
                <p className="text-sm text-[#6E6B67]">{t.totalUsers}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">{dashboardStats?.pending_users || 0}</p>
                <p className="text-sm text-[#6E6B67]">{t.pendingUsers}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">{dashboardStats?.total_requests || 0}</p>
                <p className="text-sm text-[#6E6B67]">{t.totalRequests}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">{approvalStats?.pending || dashboardStats?.pending_approvals || 0}</p>
                <p className="text-sm text-[#6E6B67]">{t.pendingApprovals}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 md:px-8 py-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{t.quickActions}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#75534B] transition-all group"
              >
                <Users className="h-6 w-6 text-[#75534B] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.manageUsers}</p>
              </Link>

              <Link
                href="/admin"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#75534B] transition-all group"
              >
                <Settings className="h-6 w-6 text-[#75534B] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.systemSettings}</p>
              </Link>

              <Link
                href="/analytics"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#75534B] transition-all group"
              >
                <BarChart3 className="h-6 w-6 text-[#75534B] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.viewAnalytics}</p>
              </Link>

              <Link
                href="/admin/purchase-config"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#75534B] transition-all group"
              >
                <ShoppingCart className="h-6 w-6 text-[#75534B] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.purchaseConfig}</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ============ PURCHASE ADMIN / SUPPLY CHAIN DASHBOARD ============
  if (user?.role === 'purchase_admin' || user?.role === 'supply_chain_manager') {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        {/* Header */}
        <section className="bg-gradient-to-r from-[#3A6EA5] to-[#2D5A8A] px-4 md:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl md:text-3xl text-white font-semibold">
              {t.welcome}, {user.name}
            </h1>
            <p className="text-white/80 mt-1">{t.purchaseSubtitle}</p>
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 md:px-8 py-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{t.ordersOverview}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">{pendingOrders.length}</p>
                <p className="text-sm text-[#6E6B67]">{t.pendingOrders}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">0</p>
                <p className="text-sm text-[#6E6B67]">{t.inCart}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">0</p>
                <p className="text-sm text-[#6E6B67]">{t.purchased}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">$0</p>
                <p className="text-sm text-[#6E6B67]">{t.thisMonth}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 md:px-8 py-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{t.quickActions}</h2>
            <div className="grid grid-cols-3 gap-4">
              <Link
                href="/admin/orders"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#3A6EA5] transition-all group"
              >
                <DollarSign className="h-6 w-6 text-[#3A6EA5] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.processOrders}</p>
              </Link>

              <Link
                href="/purchase/new"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#3A6EA5] transition-all group"
              >
                <Plus className="h-6 w-6 text-[#3A6EA5] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.newPurchase}</p>
              </Link>

              <Link
                href="/catalog"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#3A6EA5] transition-all group"
              >
                <Package className="h-6 w-6 text-[#3A6EA5] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.viewCatalog}</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Pending Orders */}
        <section className="px-4 md:px-8 py-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#2C2C2C]">{t.ordersToProcess}</h2>
              <Link href="/admin/orders" className="text-sm text-[#3A6EA5] hover:underline flex items-center gap-1">
                {t.viewAllOrders} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-[#E4E1DD] text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-[#6E6B67]">{t.noOrdersPending}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E4E1DD] overflow-hidden">
                {pendingOrders.map((order, idx) => (
                  <div key={order.id} className={`p-4 flex items-center justify-between ${idx !== pendingOrders.length - 1 ? 'border-b border-[#E4E1DD]' : ''}`}>
                    <div className="flex-1">
                      <p className="font-medium text-[#2C2C2C]">{order.request_number}</p>
                      <p className="text-sm text-[#6E6B67]">{order.requester?.name} • {order.product_title || `${order.product_count} items`}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#2C2C2C]">${((order.estimated_price || 0) * order.quantity).toLocaleString()}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ============ GENERAL MANAGER DASHBOARD ============
  if (user?.role === 'general_manager') {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        {/* Header */}
        <section className="bg-gradient-to-r from-[#4BAF7E] to-[#3A9068] px-4 md:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl md:text-3xl text-white font-semibold">
              {t.welcome}, {user.name}
            </h1>
            <p className="text-white/80 mt-1">{t.gmSubtitle}</p>
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 md:px-8 py-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{t.approvalsOverview}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">{approvalStats?.pending || 0}</p>
                <p className="text-sm text-[#6E6B67]">{t.awaitingReview}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">{approvalStats?.approved || 0}</p>
                <p className="text-sm text-[#6E6B67]">{t.approvedThisMonth}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">{approvalStats?.rejected || 0}</p>
                <p className="text-sm text-[#6E6B67]">{t.rejectedThisMonth}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#2C2C2C]">${(approvalStats?.total || 0) * 250}</p>
                <p className="text-sm text-[#6E6B67]">{t.totalValue}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Action */}
        <section className="px-4 md:px-8 py-6">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/approvals"
              className="block bg-gradient-to-r from-[#4BAF7E] to-[#3A9068] rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{t.reviewApprovals}</p>
                    <p className="text-white/80">{approvalStats?.pending || 0} {t.pendingReview.toLowerCase()}</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6" />
              </div>
            </Link>
          </div>
        </section>

        {/* Analytics Link */}
        <section className="px-4 md:px-8 py-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{t.quickActions}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/approvals"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#4BAF7E] transition-all group"
              >
                <CheckSquare className="h-6 w-6 text-[#4BAF7E] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.viewAllApprovals}</p>
              </Link>

              <Link
                href="/analytics"
                className="bg-white rounded-xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#4BAF7E] transition-all group"
              >
                <BarChart3 className="h-6 w-6 text-[#4BAF7E] mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-medium text-[#2C2C2C]">{t.viewAnalytics}</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ============ EMPLOYEE DASHBOARD (default) ============
  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#75534B] via-[#8A6056] to-[#5D423C] px-4 md:px-8 pt-8 pb-16 md:pt-10 md:pb-20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">{t.employeeSubtitle}</p>
              <h1 className="text-3xl md:text-4xl text-white font-bold">
                {t.welcome}, {user?.name?.split(' ')[0] || 'User'}
              </h1>
            </div>

            {/* Quick Create Button in Header */}
            <Link
              href="/purchase/new"
              className="inline-flex items-center gap-3 bg-white text-[#75534B] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#75534B]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              {t.createRequest}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="px-4 md:px-8 -mt-10 md:-mt-12 relative z-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#E4E1DD] shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{t.totalBadge}</span>
              </div>
              <p className="text-3xl font-bold text-[#2C2C2C]">{myRequests.length}</p>
              <p className="text-sm text-[#6E6B67] mt-1">{t.activeRequests}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#E4E1DD] shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{t.waitingBadge}</span>
              </div>
              <p className="text-3xl font-bold text-[#2C2C2C]">{myRequests.filter(r => r.status === 'pending').length}</p>
              <p className="text-sm text-[#6E6B67] mt-1">{t.pending}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#E4E1DD] shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{t.readyBadge}</span>
              </div>
              <p className="text-3xl font-bold text-[#2C2C2C]">{myRequests.filter(r => r.status === 'approved' || r.status === 'purchased').length}</p>
              <p className="text-sm text-[#6E6B67] mt-1">{t.approved}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#E4E1DD] shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-sm">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">{t.rejectedBadge}</span>
              </div>
              <p className="text-3xl font-bold text-[#2C2C2C]">{myRequests.filter(r => r.status === 'rejected').length}</p>
              <p className="text-sm text-[#6E6B67] mt-1">{t.rejected}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="px-4 md:px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Requests - Takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2C2C2C]">{t.recentRequests}</h2>
                <Link href="/requests" className="text-sm text-[#75534B] hover:text-[#5D423C] font-medium flex items-center gap-1 transition-colors">
                  {t.viewAll} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {myRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-[#E4E1DD] text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-[#F9F8F6] flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-[#9B9792]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">{t.noRequestsTitle}</h3>
                  <p className="text-[#6E6B67] mb-6 max-w-sm mx-auto">{t.noRequests}</p>
                  <Link
                    href="/purchase/new"
                    className="inline-flex items-center gap-2 bg-[#75534B] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#5D423C] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {t.createRequest}
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E4E1DD] overflow-hidden shadow-sm">
                  {myRequests.slice(0, 5).map((request, idx) => (
                    <Link
                      key={request.id}
                      href="/requests"
                      className={`block p-4 hover:bg-[#F9F8F6] transition-colors ${idx !== Math.min(myRequests.length, 5) - 1 ? 'border-b border-[#E4E1DD]' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Product Image/Icon */}
                        <div className="w-12 h-12 rounded-xl bg-[#F9F8F6] border border-[#E4E1DD] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {request.product_image_url ? (
                            <img src={request.product_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-[#9B9792]" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-[#2C2C2C] text-sm">{request.request_number}</p>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-[#6E6B67] truncate">{request.product_title || `${request.product_count} ${t.products}`}</p>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-[#2C2C2C]">
                            ${((request.estimated_price || 0) * request.quantity).toLocaleString()}
                          </p>
                          <p className="text-xs text-[#9B9792]">{request.currency || 'MXN'}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#2C2C2C]">{t.quickActions}</h2>

              {/* Main CTA */}
              <Link
                href="/purchase/new"
                className="block bg-gradient-to-br from-[#75534B] to-[#5D423C] rounded-2xl p-6 text-white hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{t.createRequest}</h3>
                  <p className="text-white/70 text-sm">{t.requestFromStore}</p>
                </div>
              </Link>

              {/* Secondary Action */}
              <Link
                href="/requests"
                className="block bg-white rounded-2xl p-5 border border-[#E4E1DD] shadow-sm hover:shadow-md hover:border-[#75534B] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#75534B]/10 flex items-center justify-center group-hover:bg-[#75534B]/20 transition-colors">
                    <ClipboardList className="h-5 w-5 text-[#75534B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C2C2C]">{t.viewMyRequests}</h3>
                    <p className="text-sm text-[#6E6B67]">{t.viewFullHistory}</p>
                  </div>
                </div>
              </Link>

              {/* Help Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm mb-1">{t.needHelp}</h3>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {t.helpText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
