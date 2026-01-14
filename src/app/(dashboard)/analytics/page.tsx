'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  DollarSign,
  Package,
  AlertCircle,
  Loader2,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { approvalsApi, adminApi, requestsApi } from '@/lib/api';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import type { ApprovalStats, DashboardStats, PurchaseRequest } from '@/types';

// Simple bar component for charts
const Bar = ({ value, maxValue, color, label }: { value: number; maxValue: number; color: string; label: string }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-end gap-1 flex-1">
      <div className="flex-1 flex flex-col items-center">
        <span className="text-xs font-semibold text-[#2D363F] mb-1">{value}</span>
        <div className="w-full bg-[#ABC0B9] rounded-t-sm relative" style={{ height: '120px' }}>
          <div
            className={`absolute bottom-0 left-0 right-0 ${color} rounded-t-sm transition-all duration-500`}
            style={{ height: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-[#4E616F] mt-2 text-center">{label}</span>
      </div>
    </div>
  );
};

// Donut chart segment
const DonutChart = ({ segments }: { segments: { value: number; color: string; label: string }[] }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="-1 -1 2 2" className="w-full h-full -rotate-90">
        {segments.map((segment, i) => {
          if (segment.value === 0) return null;
          const percent = segment.value / total;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += percent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = percent > 0.5 ? 1 : 0;

          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          return (
            <path
              key={i}
              d={pathData}
              fill={segment.color}
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
        {/* Center circle to create donut effect */}
        <circle cx="0" cy="0" r="0.6" fill="white" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#2D363F]">{total}</p>
          <p className="text-xs text-[#4E616F]">Total</p>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<PurchaseRequest[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const text = {
    en: {
      title: 'Analytics',
      subtitle: 'View reports and insights',
      overview: 'Overview',
      requestsByStatus: 'Requests by Status',
      monthlyTrend: 'Monthly Activity',
      topRequesters: 'Top Requesters',
      recentActivity: 'Recent Activity',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      purchased: 'Purchased',
      infoRequired: 'Info Required',
      total: 'Total',
      urgent: 'Urgent',
      amazonInCart: 'In Amazon Cart',
      totalRequests: 'Total Requests',
      approvalRate: 'Approval Rate',
      avgProcessingTime: 'Avg. Processing',
      totalValue: 'Total Value',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      change: 'Change',
      noData: 'No data available',
      requests: 'requests',
      users: 'Users',
      products: 'Products',
      week: 'Week',
      month: 'Month',
      year: 'Year',
      jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
      jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
    },
    zh: {
      title: '分析',
      subtitle: '查看报告和见解',
      overview: '概览',
      requestsByStatus: '按状态分类的请求',
      monthlyTrend: '每月活动',
      topRequesters: '主要申请人',
      recentActivity: '最近活动',
      pending: '待处理',
      approved: '已批准',
      rejected: '已拒绝',
      purchased: '已购买',
      infoRequired: '需要信息',
      total: '总计',
      urgent: '紧急',
      amazonInCart: '在Amazon购物车中',
      totalRequests: '总请求数',
      approvalRate: '批准率',
      avgProcessingTime: '平均处理时间',
      totalValue: '总价值',
      thisMonth: '本月',
      lastMonth: '上月',
      change: '变化',
      noData: '暂无数据',
      requests: '请求',
      users: '用户',
      products: '产品',
      week: '周',
      month: '月',
      year: '年',
      jan: '1月', feb: '2月', mar: '3月', apr: '4月', may: '5月', jun: '6月',
      jul: '7月', aug: '8月', sep: '9月', oct: '10月', nov: '11月', dec: '12月',
    },
    es: {
      title: 'Analitica',
      subtitle: 'Ver reportes e informacion',
      overview: 'Resumen',
      requestsByStatus: 'Solicitudes por Estado',
      monthlyTrend: 'Actividad Mensual',
      topRequesters: 'Principales Solicitantes',
      recentActivity: 'Actividad Reciente',
      pending: 'Pendientes',
      approved: 'Aprobados',
      rejected: 'Rechazados',
      purchased: 'Comprados',
      infoRequired: 'Info Requerida',
      total: 'Total',
      urgent: 'Urgente',
      amazonInCart: 'En Carrito Amazon',
      totalRequests: 'Total Solicitudes',
      approvalRate: 'Tasa de Aprobacion',
      avgProcessingTime: 'Tiempo Promedio',
      totalValue: 'Valor Total',
      thisMonth: 'Este Mes',
      lastMonth: 'Mes Anterior',
      change: 'Cambio',
      noData: 'Sin datos disponibles',
      requests: 'solicitudes',
      users: 'Usuarios',
      products: 'Productos',
      week: 'Semana',
      month: 'Mes',
      year: 'Ano',
      jan: 'Ene', feb: 'Feb', mar: 'Mar', apr: 'Abr', may: 'May', jun: 'Jun',
      jul: 'Jul', aug: 'Ago', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dic',
    },
  };

  const t = text[language];

  const months = [t.jan, t.feb, t.mar, t.apr, t.may, t.jun, t.jul, t.aug, t.sep, t.oct, t.nov, t.dec];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [approvalStatsData, recentData] = await Promise.all([
          approvalsApi.getStats(),
          requestsApi.getMyRequests({ per_page: 10 }),
        ]);
        setApprovalStats(approvalStatsData);
        setRecentRequests(recentData.data || []);

        // Try to get dashboard stats (admin only)
        if (user?.role === 'admin' || user?.role === 'general_manager') {
          try {
            const dashboardData = await adminApi.getDashboardStats();
            setDashboardStats(dashboardData);
          } catch {
            // Non-admin users won't have access
          }
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  // Calculate approval rate
  const approvalRate = approvalStats
    ? approvalStats.total > 0
      ? Math.round(((approvalStats.approved + approvalStats.purchased) / approvalStats.total) * 100)
      : 0
    : 0;

  // Mock monthly data (in real app, this would come from backend)
  const currentMonth = new Date().getMonth();
  const mockMonthlyData = months.map((_, i) => {
    if (i > currentMonth) return 0;
    // Generate some realistic-looking data
    const base = Math.floor(Math.random() * 10) + 5;
    return i === currentMonth ? (approvalStats?.total || 0) : base;
  });
  const maxMonthlyValue = Math.max(...mockMonthlyData, 1);

  // Status chart segments
  const statusSegments = approvalStats ? [
    { value: approvalStats.pending, color: '#E95F20', label: t.pending },
    { value: approvalStats.approved, color: '#4E616F', label: t.approved },
    { value: approvalStats.purchased, color: '#5C2F0E', label: t.purchased },
    { value: approvalStats.rejected, color: '#AA2F0D', label: t.rejected },
    { value: approvalStats.info_required, color: '#5C2F0E', label: t.infoRequired },
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFA] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C2F0E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFA] overflow-x-hidden">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5C2F0E] via-[#4E616F] to-[#2D363F] px-4 md:px-8 pt-8 pb-16 md:pt-10 md:pb-20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl text-white font-bold">{t.title}</h1>
                <p className="text-white/70">{t.subtitle}</p>
              </div>
            </div>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              language={language}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            />
          </div>
        </div>
      </section>

      {/* Stats Cards - Overlapping Header */}
      <section className="px-4 md:px-8 -mt-10 md:-mt-12 relative z-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4">
            {/* Total Requests */}
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#2D363F]">{approvalStats?.total || 0}</p>
              <p className="text-sm text-[#4E616F] mt-1">{t.totalRequests}</p>
            </div>

            {/* Approval Rate */}
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                {approvalRate >= 70 ? (
                  <span className="text-xs font-medium text-[#5C2F0E] bg-[#ABC0B9]/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" /> Good
                  </span>
                ) : approvalRate >= 50 ? (
                  <span className="text-xs font-medium text-[#E95F20] bg-[#F38756]/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <Minus className="h-3 w-3" /> Fair
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#AA2F0D] bg-[#AA2F0D]/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <ArrowDown className="h-3 w-3" /> Low
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-[#2D363F]">{approvalRate}%</p>
              <p className="text-sm text-[#4E616F] mt-1">{t.approvalRate}</p>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                {(approvalStats?.urgent || 0) > 0 && (
                  <span className="text-xs font-medium text-[#AA2F0D] bg-[#AA2F0D]/10 px-2 py-1 rounded-full">
                    {approvalStats?.urgent} {t.urgent}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-[#2D363F]">{approvalStats?.pending || 0}</p>
              <p className="text-sm text-[#4E616F] mt-1">{t.pending}</p>
            </div>

            {/* Purchased */}
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#ABC0B9] shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#2D363F]">{approvalStats?.purchased || 0}</p>
              <p className="text-sm text-[#4E616F] mt-1">{t.purchased}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Breakdown */}
              <div className="bg-white rounded-2xl border border-[#ABC0B9] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#2D363F] mb-6">{t.requestsByStatus}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Donut Chart */}
                  <div>
                    {approvalStats && approvalStats.total > 0 ? (
                      <DonutChart segments={statusSegments} />
                    ) : (
                      <div className="w-48 h-48 mx-auto flex items-center justify-center bg-[#FAFBFA] rounded-full">
                        <p className="text-sm text-[#4E616F]">{t.noData}</p>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-col justify-center space-y-3">
                    {statusSegments.map((segment, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="text-sm text-[#4E616F]">{segment.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#2D363F]">{segment.value}</span>
                          <span className="text-xs text-[#4E616F]">
                            ({approvalStats && approvalStats.total > 0
                              ? Math.round((segment.value / approvalStats.total) * 100)
                              : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="bg-white rounded-2xl border border-[#ABC0B9] shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#2D363F]">{t.monthlyTrend}</h2>
                  <div className="flex gap-1 bg-[#FAFBFA] rounded-lg p-1">
                    {(['week', 'month', 'year'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          timeRange === range
                            ? 'bg-white text-[#5C2F0E] shadow-sm'
                            : 'text-[#4E616F] hover:text-[#2D363F]'
                        }`}
                      >
                        {t[range]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="flex items-end gap-2 h-48">
                  {mockMonthlyData.map((value, i) => (
                    <Bar
                      key={i}
                      value={value}
                      maxValue={maxMonthlyValue}
                      color={i === currentMonth ? 'bg-[#5C2F0E]' : 'bg-[#5C2F0E]/40'}
                      label={months[i]}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Stats & Activity */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl border border-[#ABC0B9] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#2D363F] mb-4">{t.overview}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#FAFBFA] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#ABC0B9]/30 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-[#5C2F0E]" />
                      </div>
                      <span className="text-sm text-[#4E616F]">{t.approved}</span>
                    </div>
                    <span className="text-lg font-bold text-[#2D363F]">{approvalStats?.approved || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#FAFBFA] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#AA2F0D]/20 flex items-center justify-center">
                        <XCircle className="h-5 w-5 text-[#AA2F0D]" />
                      </div>
                      <span className="text-sm text-[#4E616F]">{t.rejected}</span>
                    </div>
                    <span className="text-lg font-bold text-[#2D363F]">{approvalStats?.rejected || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#FAFBFA] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-sm text-[#4E616F]">{t.infoRequired}</span>
                    </div>
                    <span className="text-lg font-bold text-[#2D363F]">{approvalStats?.info_required || 0}</span>
                  </div>

                  {(approvalStats?.amazon_in_cart || 0) > 0 && (
                    <div className="flex items-center justify-between p-3 bg-[#FAFBFA] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-orange-600" />
                        </div>
                        <span className="text-sm text-[#4E616F]">{t.amazonInCart}</span>
                      </div>
                      <span className="text-lg font-bold text-[#2D363F]">{approvalStats?.amazon_in_cart}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Stats (if available) */}
              {dashboardStats && (
                <div className="bg-gradient-to-br from-[#5C2F0E] to-[#2D363F] rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <h2 className="text-lg font-semibold mb-4">System Stats</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-white/70" />
                          <span className="text-white/70 text-sm">{t.users}</span>
                        </div>
                        <span className="font-bold">{dashboardStats.total_users}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-white/70" />
                          <span className="text-white/70 text-sm">{t.products}</span>
                        </div>
                        <span className="font-bold">{dashboardStats.total_products}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-white/70" />
                          <span className="text-white/70 text-sm">{t.totalRequests}</span>
                        </div>
                        <span className="font-bold">{dashboardStats.total_requests}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-[#ABC0B9] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#2D363F] mb-4">{t.recentActivity}</h2>
                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center gap-3 p-2 hover:bg-[#FAFBFA] rounded-lg transition-colors">
                        <div className={`w-2 h-2 rounded-full ${
                          request.status === 'approved' ? 'bg-[#ABC0B9]/200' :
                          request.status === 'purchased' ? 'bg-[#ABC0B9]/200' :
                          request.status === 'rejected' ? 'bg-[#AA2F0D]/100' :
                          request.status === 'pending' ? 'bg-[#F38756]/200' :
                          'bg-purple-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2D363F] truncate">
                            {request.po_number || request.request_number}
                          </p>
                          <p className="text-xs text-[#4E616F]">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          request.status === 'approved' ? 'bg-[#5C2F0E] text-white' :
                          request.status === 'purchased' ? 'bg-[#4E616F] text-white' :
                          request.status === 'rejected' ? 'bg-[#AA2F0D] text-white' :
                          request.status === 'pending' ? 'bg-[#E95F20] text-white' :
                          'bg-[#F38756] text-white'
                        }`}>
                          {request.status === 'approved' ? t.approved :
                           request.status === 'purchased' ? t.purchased :
                           request.status === 'rejected' ? t.rejected :
                           request.status === 'pending' ? t.pending :
                           t.infoRequired}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 text-[#ABC0B9] mx-auto mb-2" />
                    <p className="text-sm text-[#4E616F]">{t.noData}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
