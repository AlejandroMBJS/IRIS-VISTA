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
import { decodeText } from '@/lib/translations';
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
      pending: { bg: 'bg-[#E95F20]', text: 'text-white', icon: <Clock className="h-3 w-3" /> },
      approved: { bg: 'bg-[#5C2F0E]', text: 'text-white', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { bg: 'bg-[#AA2F0D]', text: 'text-white', icon: <XCircle className="h-3 w-3" /> },
      purchased: { bg: 'bg-[#4E616F]', text: 'text-white', icon: <ShoppingCart className="h-3 w-3" /> },
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
        <Loader2 className="h-8 w-8 animate-spin text-[#5C2F0E]" />
      </div>
    );
  }

  // ============ ADMIN DASHBOARD ============
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#FAFBFA] overflow-x-hidden">
        {/* Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#5C2F0E] via-[#4E616F] to-[#2D363F] px-4 md:px-8 pt-8 pb-16 md:pt-10 md:pb-20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">{t.adminSubtitle}</p>
                <h1 className="text-3xl md:text-4xl text-white font-bold">
                  {t.welcome}, {user?.name?.split(' ')[0] || 'Admin'}
                </h1>
              </div>

              {/* Quick CTA Button */}
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-3 bg-white text-[#5C2F0E] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#5C2F0E]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                {t.manageUsers}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Cards - Overlapping Header */}
        <section className="px-4 md:px-8 -mt-10 md:-mt-12 relative z-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4">
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-[#4E616F] bg-[#ABC0B9]/20 px-2 py-1 rounded-full">Users</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{dashboardStats?.total_users || 0}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.totalUsers}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white bg-[#E95F20] px-2 py-1 rounded-full">Pending</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{dashboardStats?.pending_users || 0}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.pendingUsers}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Requests</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{dashboardStats?.total_requests || 0}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.totalRequests}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pending</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{approvalStats?.pending || dashboardStats?.pending_approvals || 0}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.pendingApprovals}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="px-4 md:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions - Takes 2 columns */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-[#2D363F] mb-4">{t.quickActions}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/admin/users"
                    className="bg-white rounded-2xl p-6 border border-[#ABC0B9] shadow-sm hover:shadow-lg hover:border-[#5C2F0E] transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5C2F0E]/10 to-[#5C2F0E]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-[#5C2F0E]" />
                    </div>
                    <h3 className="font-semibold text-[#2D363F] mb-1">{t.manageUsers}</h3>
                    <p className="text-sm text-[#4E616F]">View and manage all users</p>
                  </Link>

                  <Link
                    href="/admin"
                    className="bg-white rounded-2xl p-6 border border-[#ABC0B9] shadow-sm hover:shadow-lg hover:border-[#5C2F0E] transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5C2F0E]/10 to-[#5C2F0E]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Settings className="h-6 w-6 text-[#5C2F0E]" />
                    </div>
                    <h3 className="font-semibold text-[#2D363F] mb-1">{t.systemSettings}</h3>
                    <p className="text-sm text-[#4E616F]">Configure system settings</p>
                  </Link>

                  <Link
                    href="/analytics"
                    className="bg-white rounded-2xl p-6 border border-[#ABC0B9] shadow-sm hover:shadow-lg hover:border-[#5C2F0E] transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5C2F0E]/10 to-[#5C2F0E]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-6 w-6 text-[#5C2F0E]" />
                    </div>
                    <h3 className="font-semibold text-[#2D363F] mb-1">{t.viewAnalytics}</h3>
                    <p className="text-sm text-[#4E616F]">View reports and analytics</p>
                  </Link>

                  <Link
                    href="/admin/purchase-config"
                    className="bg-white rounded-2xl p-6 border border-[#ABC0B9] shadow-sm hover:shadow-lg hover:border-[#5C2F0E] transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5C2F0E]/10 to-[#5C2F0E]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="h-6 w-6 text-[#5C2F0E]" />
                    </div>
                    <h3 className="font-semibold text-[#2D363F] mb-1">{t.purchaseConfig}</h3>
                    <p className="text-sm text-[#4E616F]">Configure purchase settings</p>
                  </Link>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#2D363F]">{t.systemOverview}</h2>

                {/* System Health Card */}
                <div className="bg-gradient-to-br from-[#5C2F0E] to-[#2D363F] rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">System Status</h3>
                    <p className="text-white/70 text-sm mb-4">All systems operational</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#5C2F0E] animate-pulse" />
                      <span className="text-sm text-white/90">Online</span>
                    </div>
                  </div>
                </div>

                {/* Quick Link */}
                <Link
                  href="/admin/orders"
                  className="block bg-white rounded-2xl p-5 border border-[#ABC0B9] shadow-sm hover:shadow-md hover:border-[#5C2F0E] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#5C2F0E]/10 flex items-center justify-center group-hover:bg-[#5C2F0E]/20 transition-colors">
                      <ClipboardList className="h-5 w-5 text-[#5C2F0E]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2D363F]">View Orders</h3>
                      <p className="text-sm text-[#4E616F]">Manage all orders</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ============ PURCHASE ADMIN / SUPPLY CHAIN DASHBOARD ============
  if (user?.role === 'purchase_admin' || user?.role === 'supply_chain_manager') {
    return (
      <div className="min-h-screen bg-[#FAFBFA] overflow-x-hidden">
        {/* Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#5C2F0E] via-[#4E616F] to-[#2D363F] px-4 md:px-8 pt-8 pb-16 md:pt-10 md:pb-20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-white/70 text-sm font-medium mb-1">{t.purchaseSubtitle}</p>
                <h1 className="text-3xl md:text-4xl text-white font-bold">
                  {t.welcome}, {user?.name?.split(' ')[0] || 'User'}
                </h1>
              </div>

              {/* Quick CTA Button */}
              <Link
                href="/admin/orders"
                className="inline-flex items-center gap-3 bg-white text-[#5C2F0E] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#5C2F0E]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="h-5 w-5" />
                </div>
                {t.processOrders}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Cards - Overlapping Header */}
        <section className="px-4 md:px-8 -mt-10 md:-mt-12 relative z-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4">
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white bg-[#E95F20] px-2 py-1 rounded-full">Pending</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{pendingOrders.length}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.pendingOrders}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-[#4E616F] bg-[#ABC0B9]/20 px-2 py-1 rounded-full">In Cart</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">0</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.inCart}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-[#5C2F0E] bg-[#ABC0B9]/20 px-2 py-1 rounded-full">Done</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">0</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.purchased}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Monthly</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">$0</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.thisMonth}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="px-4 md:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Orders - Takes 2 columns */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#2D363F]">{t.ordersToProcess}</h2>
                  <Link href="/admin/orders" className="text-sm text-[#5C2F0E] hover:text-[#2D363F] font-medium flex items-center gap-1 transition-colors">
                    {t.viewAllOrders} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {pendingOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 border border-[#ABC0B9] text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-[#ABC0B9]/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-[#5C2F0E]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#2D363F] mb-2">All caught up!</h3>
                    <p className="text-[#4E616F]">{t.noOrdersPending}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#ABC0B9] overflow-hidden shadow-sm">
                    {pendingOrders.map((order, idx) => (
                      <Link
                        key={order.id}
                        href="/admin/orders"
                        className={`block p-4 hover:bg-[#FAFBFA] transition-colors ${idx !== pendingOrders.length - 1 ? 'border-b border-[#ABC0B9]' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#FAFBFA] border border-[#ABC0B9] flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-[#4E616F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-[#2D363F] text-sm">{order.po_number || order.request_number}</p>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-sm text-[#4E616F] truncate">{order.requester?.name} • {decodeText(order.product_title) || `${order.product_count} items`}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-[#2D363F]">${((order.total_estimated || (order.estimated_price || 0) * order.quantity)).toLocaleString()}</p>
                            <p className="text-xs text-[#4E616F]">{order.currency || 'MXN'}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions Sidebar */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#2D363F]">{t.quickActions}</h2>

                {/* Main CTA */}
                <Link
                  href="/admin/orders"
                  className="block bg-gradient-to-br from-[#5C2F0E] to-[#2D363F] rounded-2xl p-6 text-white hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{t.processOrders}</h3>
                    <p className="text-white/70 text-sm">Review and process approved orders</p>
                  </div>
                </Link>

                {/* Secondary Actions */}
                <Link
                  href="/purchase/new"
                  className="block bg-white rounded-2xl p-5 border border-[#ABC0B9] shadow-sm hover:shadow-md hover:border-[#5C2F0E] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#5C2F0E]/10 flex items-center justify-center group-hover:bg-[#5C2F0E]/20 transition-colors">
                      <Plus className="h-5 w-5 text-[#5C2F0E]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2D363F]">{t.newPurchase}</h3>
                      <p className="text-sm text-[#4E616F]">Create new purchase request</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/catalog"
                  className="block bg-white rounded-2xl p-5 border border-[#ABC0B9] shadow-sm hover:shadow-md hover:border-[#5C2F0E] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#5C2F0E]/10 flex items-center justify-center group-hover:bg-[#5C2F0E]/20 transition-colors">
                      <Package className="h-5 w-5 text-[#5C2F0E]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2D363F]">{t.viewCatalog}</h3>
                      <p className="text-sm text-[#4E616F]">Browse product catalog</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ============ GENERAL MANAGER DASHBOARD ============
  if (user?.role === 'general_manager') {
    return (
      <div className="min-h-screen bg-[#FAFBFA] overflow-x-hidden">
        {/* Hero Header */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#5C2F0E] via-[#80959A] to-[#2D363F] px-4 md:px-8 pt-8 pb-16 md:pt-10 md:pb-20">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl text-white font-bold">
                  {t.welcome}, {user?.name?.split(' ')[0] || 'Manager'}
                </h1>
              </div>

              {/* Quick CTA Button */}
              <Link
                href="/approvals"
                className="inline-flex items-center gap-3 bg-white text-[#5C2F0E] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#5C2F0E]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckSquare className="h-5 w-5" />
                </div>
                {t.reviewApprovals}
                {(approvalStats?.pending || 0) > 0 && (
                  <span className="bg-[#AA2F0D]/100 text-white text-sm px-2 py-0.5 rounded-full">
                    {approvalStats?.pending}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Cards - Overlapping Header */}
        <section className="px-4 md:px-8 -mt-10 md:-mt-12 relative z-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4">
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white bg-[#E95F20] px-2 py-1 rounded-full">Pending</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{approvalStats?.pending || 0}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.awaitingReview}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-[#5C2F0E] bg-[#ABC0B9]/20 px-2 py-1 rounded-full">Approved</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{approvalStats?.approved || 0}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.approvedThisMonth}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-sm">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-[#AA2F0D] bg-[#AA2F0D]/10 px-2 py-1 rounded-full">Rejected</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{approvalStats?.rejected || 0}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.rejectedThisMonth}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Total</span>
                </div>
                <p className="text-3xl font-bold text-[#2D363F]">{approvalStats?.total || 0}</p>
                <p className="text-sm text-[#4E616F] mt-1">{t.totalValue}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="px-4 md:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main CTA Card - Takes 2 columns */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-[#2D363F] mb-4">{t.approvalsOverview}</h2>

                {/* Pending Approvals CTA */}
                <Link
                  href="/approvals"
                  className="block bg-gradient-to-br from-[#5C2F0E] to-[#2D363F] rounded-2xl p-8 text-white hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckSquare className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{t.reviewApprovals}</h3>
                        <p className="text-white/80 text-lg">
                          {approvalStats?.pending || 0} {t.pendingReview.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <ArrowRight className="h-8 w-8 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>

                {/* Urgent Requests Notice */}
                {(approvalStats?.urgent || 0) > 0 && (
                  <div className="mt-4 p-4 bg-[#AA2F0D]/10 border border-[#AA2F0D]-200 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#AA2F0D]/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-[#AA2F0D]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#AA2F0D]">{approvalStats?.urgent} urgent request(s)</p>
                      <p className="text-sm text-[#AA2F0D]">These requests require immediate attention</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Sidebar */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#2D363F]">{t.quickActions}</h2>

                {/* View All Approvals */}
                <Link
                  href="/approvals"
                  className="block bg-white rounded-2xl p-5 border border-[#ABC0B9] shadow-sm hover:shadow-md hover:border-[#5C2F0E] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#5C2F0E]/10 flex items-center justify-center group-hover:bg-[#5C2F0E]/20 transition-colors">
                      <CheckSquare className="h-5 w-5 text-[#5C2F0E]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2D363F]">{t.viewAllApprovals}</h3>
                      <p className="text-sm text-[#4E616F]">Review all requests</p>
                    </div>
                  </div>
                </Link>

                {/* View Analytics */}
                <Link
                  href="/analytics"
                  className="block bg-white rounded-2xl p-5 border border-[#ABC0B9] shadow-sm hover:shadow-md hover:border-[#5C2F0E] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#5C2F0E]/10 flex items-center justify-center group-hover:bg-[#5C2F0E]/20 transition-colors">
                      <BarChart3 className="h-5 w-5 text-[#5C2F0E]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2D363F]">{t.viewAnalytics}</h3>
                      <p className="text-sm text-[#4E616F]">View reports and trends</p>
                    </div>
                  </div>
                </Link>

                {/* Help Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-[#ABC0B9]-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ABC0B9]/30 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-[#5C2F0E]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2D363F] text-sm mb-1">Approval Tips</h3>
                      <p className="text-xs text-[#5C2F0E] leading-relaxed">
                        Review urgent requests first. Check justification and estimated costs before approving.
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

  // ============ EMPLOYEE DASHBOARD (default) ============
  return (
    <div className="min-h-screen bg-[#FAFBFA] overflow-x-hidden">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5C2F0E] via-[#4E616F] to-[#2D363F] px-4 md:px-8 pt-8 pb-16 md:pt-10 md:pb-20">
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
              className="inline-flex items-center gap-3 bg-white text-[#5C2F0E] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#5C2F0E]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4">
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-[#4E616F] bg-[#ABC0B9]/20 px-2 py-1 rounded-full">{t.totalBadge}</span>
              </div>
              <p className="text-3xl font-bold text-[#2D363F]">{myRequests.length}</p>
              <p className="text-sm text-[#4E616F] mt-1">{t.activeRequests}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-white bg-[#E95F20] px-2 py-1 rounded-full">{t.waitingBadge}</span>
              </div>
              <p className="text-3xl font-bold text-[#2D363F]">{myRequests.filter(r => r.status === 'pending').length}</p>
              <p className="text-sm text-[#4E616F] mt-1">{t.pending}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-[#5C2F0E] bg-[#ABC0B9]/20 px-2 py-1 rounded-full">{t.readyBadge}</span>
              </div>
              <p className="text-3xl font-bold text-[#2D363F]">{myRequests.filter(r => r.status === 'approved' || r.status === 'purchased').length}</p>
              <p className="text-sm text-[#4E616F] mt-1">{t.approved}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-sm">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium text-[#AA2F0D] bg-[#AA2F0D]/10 px-2 py-1 rounded-full">{t.rejectedBadge}</span>
              </div>
              <p className="text-3xl font-bold text-[#2D363F]">{myRequests.filter(r => r.status === 'rejected').length}</p>
              <p className="text-sm text-[#4E616F] mt-1">{t.rejected}</p>
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
                <h2 className="text-lg font-semibold text-[#2D363F]">{t.recentRequests}</h2>
                <Link href="/requests" className="text-sm text-[#5C2F0E] hover:text-[#2D363F] font-medium flex items-center gap-1 transition-colors">
                  {t.viewAll} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {myRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-[#ABC0B9] text-center shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-[#FAFBFA] flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-[#80959A]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#2D363F] mb-2">{t.noRequestsTitle}</h3>
                  <p className="text-[#4E616F] mb-6 max-w-sm mx-auto">{t.noRequests}</p>
                  <Link
                    href="/purchase/new"
                    className="inline-flex items-center gap-2 bg-[#5C2F0E] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#2D363F] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {t.createRequest}
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#ABC0B9] overflow-hidden shadow-sm">
                  {myRequests.slice(0, 5).map((request, idx) => (
                    <Link
                      key={request.id}
                      href="/requests"
                      className={`block p-4 hover:bg-[#FAFBFA] transition-colors ${idx !== Math.min(myRequests.length, 5) - 1 ? 'border-b border-[#ABC0B9]' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Product Image/Icon */}
                        <div className="w-12 h-12 rounded-xl bg-[#FAFBFA] border border-[#ABC0B9] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {request.product_image_url ? (
                            <img src={request.product_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-[#80959A]" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-[#2D363F] text-sm">{request.request_number}</p>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-[#4E616F] truncate">{decodeText(request.product_title) || `${request.product_count} ${t.products}`}</p>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-[#2D363F]">
                            ${((request.estimated_price || 0) * request.quantity).toLocaleString()}
                          </p>
                          <p className="text-xs text-[#4E616F]">{request.currency || 'MXN'}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#2D363F]">{t.quickActions}</h2>

              {/* Main CTA */}
              <Link
                href="/purchase/new"
                className="block bg-gradient-to-br from-[#5C2F0E] to-[#2D363F] rounded-2xl p-6 text-white hover:shadow-xl transition-all group relative overflow-hidden"
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
                className="block bg-white rounded-2xl p-5 border border-[#ABC0B9] shadow-sm hover:shadow-md hover:border-[#5C2F0E] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#5C2F0E]/10 flex items-center justify-center group-hover:bg-[#5C2F0E]/20 transition-colors">
                    <ClipboardList className="h-5 w-5 text-[#5C2F0E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2D363F]">{t.viewMyRequests}</h3>
                    <p className="text-sm text-[#4E616F]">{t.viewFullHistory}</p>
                  </div>
                </div>
              </Link>

              {/* Help Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-[#ABC0B9]-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ABC0B9]/30 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-[#4E616F]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2D363F] text-sm mb-1">{t.needHelp}</h3>
                    <p className="text-xs text-[#4E616F] leading-relaxed">
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
