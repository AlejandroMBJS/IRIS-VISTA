'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { activityLogsApi, type ActivityLog, type ActivityStats, type ActivityLogsFilters } from '@/lib/api';
import {
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Monitor,
  LogIn,
  LogOut,
  UserPlus,
  Key,
  Shield,
  X,
} from 'lucide-react';

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState<ActivityLogsFilters>({
    per_page: 25,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'sessions'>('all');

  const text = {
    en: {
      title: 'Activity Logs',
      subtitle: 'Monitor user authentication and session activity',
      stats: {
        totalLogins: 'Total Logins',
        failedLogins: 'Failed Logins',
        activeSessions: 'Active Sessions',
        uniqueUsers: 'Unique Users',
        todayLogins: 'Today Logins',
        todayFailed: 'Today Failed',
      },
      tabs: {
        all: 'All Activity',
        sessions: 'Active Sessions',
      },
      filters: {
        type: 'Type',
        all: 'All',
        login: 'Login',
        loginFailed: 'Login Failed',
        logout: 'Logout',
        registration: 'Registration',
        success: 'Status',
        successful: 'Successful',
        failed: 'Failed',
        search: 'Search by identifier or IP...',
        startDate: 'Start Date',
        endDate: 'End Date',
        clear: 'Clear Filters',
      },
      table: {
        user: 'User',
        type: 'Type',
        status: 'Status',
        ipAddress: 'IP Address',
        details: 'Details',
        time: 'Time',
        duration: 'Duration',
        actions: 'Actions',
        endSession: 'End Session',
        noLogs: 'No activity logs found',
        noSessions: 'No active sessions',
      },
      types: {
        login: 'Login',
        login_failed: 'Failed Login',
        logout: 'Logout',
        registration: 'Registration',
        token_refresh: 'Token Refresh',
        password_reset: 'Password Reset',
      },
      pagination: {
        showing: 'Showing',
        of: 'of',
        results: 'results',
        page: 'Page',
      },
      accessDenied: 'Access denied. Admin only.',
      confirmEndSession: 'Are you sure you want to end this session?',
    },
    zh: {
      title: '活动日志',
      subtitle: '监控用户身份验证和会话活动',
      stats: {
        totalLogins: '总登录次数',
        failedLogins: '登录失败',
        activeSessions: '活动会话',
        uniqueUsers: '独立用户',
        todayLogins: '今日登录',
        todayFailed: '今日失败',
      },
      tabs: {
        all: '所有活动',
        sessions: '活动会话',
      },
      filters: {
        type: '类型',
        all: '全部',
        login: '登录',
        loginFailed: '登录失败',
        logout: '登出',
        registration: '注册',
        success: '状态',
        successful: '成功',
        failed: '失败',
        search: '按标识符或IP搜索...',
        startDate: '开始日期',
        endDate: '结束日期',
        clear: '清除筛选',
      },
      table: {
        user: '用户',
        type: '类型',
        status: '状态',
        ipAddress: 'IP地址',
        details: '详情',
        time: '时间',
        duration: '持续时间',
        actions: '操作',
        endSession: '结束会话',
        noLogs: '没有找到活动日志',
        noSessions: '没有活动会话',
      },
      types: {
        login: '登录',
        login_failed: '登录失败',
        logout: '登出',
        registration: '注册',
        token_refresh: '令牌刷新',
        password_reset: '密码重置',
      },
      pagination: {
        showing: '显示',
        of: '共',
        results: '条结果',
        page: '页',
      },
      accessDenied: '拒绝访问。仅限管理员。',
      confirmEndSession: '确定要结束此会话吗？',
    },
    es: {
      title: 'Registro de Actividad',
      subtitle: 'Monitorea la autenticación y actividad de sesiones',
      stats: {
        totalLogins: 'Total Inicios',
        failedLogins: 'Inicios Fallidos',
        activeSessions: 'Sesiones Activas',
        uniqueUsers: 'Usuarios Únicos',
        todayLogins: 'Hoy Inicios',
        todayFailed: 'Hoy Fallidos',
      },
      tabs: {
        all: 'Toda la Actividad',
        sessions: 'Sesiones Activas',
      },
      filters: {
        type: 'Tipo',
        all: 'Todos',
        login: 'Inicio de Sesión',
        loginFailed: 'Inicio Fallido',
        logout: 'Cierre de Sesión',
        registration: 'Registro',
        success: 'Estado',
        successful: 'Exitoso',
        failed: 'Fallido',
        search: 'Buscar por identificador o IP...',
        startDate: 'Fecha Inicio',
        endDate: 'Fecha Fin',
        clear: 'Limpiar Filtros',
      },
      table: {
        user: 'Usuario',
        type: 'Tipo',
        status: 'Estado',
        ipAddress: 'Dirección IP',
        details: 'Detalles',
        time: 'Hora',
        duration: 'Duración',
        actions: 'Acciones',
        endSession: 'Terminar Sesión',
        noLogs: 'No se encontraron registros de actividad',
        noSessions: 'No hay sesiones activas',
      },
      types: {
        login: 'Inicio de Sesión',
        login_failed: 'Inicio Fallido',
        logout: 'Cierre de Sesión',
        registration: 'Registro',
        token_refresh: 'Actualización de Token',
        password_reset: 'Restablecimiento de Contraseña',
      },
      pagination: {
        showing: 'Mostrando',
        of: 'de',
        results: 'resultados',
        page: 'Página',
      },
      accessDenied: 'Acceso denegado. Solo administradores.',
      confirmEndSession: '¿Está seguro de que desea terminar esta sesión?',
    },
  };

  const t = text[language];

  const fetchStats = useCallback(async () => {
    try {
      const data = await activityLogsApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const response = await activityLogsApi.getLogs({ ...filters, page, search: searchQuery || undefined });
      setLogs(response.data || []);
      setTotal(response.total);
      setPages(response.pages);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [filters, page, searchQuery]);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const data = await activityLogsApi.getActiveSessions();
      setActiveSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch active sessions:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchLogs(), fetchActiveSessions()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchLogs, fetchActiveSessions]);

  useEffect(() => {
    if (!loading) {
      fetchLogs();
    }
  }, [page, filters, searchQuery, loading, fetchLogs]);

  const handleEndSession = async (id: number) => {
    if (!confirm(t.confirmEndSession)) return;
    try {
      await activityLogsApi.endSession(id);
      fetchActiveSessions();
      fetchStats();
      fetchLogs();
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString(language === 'zh' ? 'zh-CN' : language === 'es' ? 'es-MX' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LogIn className="h-4 w-4" />;
      case 'login_failed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'logout':
        return <LogOut className="h-4 w-4" />;
      case 'registration':
        return <UserPlus className="h-4 w-4" />;
      case 'token_refresh':
        return <Key className="h-4 w-4" />;
      case 'password_reset':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string, success: boolean) => {
    if (!success || type === 'login_failed') {
      return 'bg-red-100 text-red-700';
    }
    switch (type) {
      case 'login':
        return 'bg-green-100 text-green-700';
      case 'logout':
        return 'bg-gray-100 text-gray-700';
      case 'registration':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const clearFilters = () => {
    setFilters({ per_page: 25 });
    setSearchQuery('');
    setPage(1);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">{t.accessDenied}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-[#75534B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{t.stats.totalLogins}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_logins.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{t.stats.failedLogins}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.failed_logins.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Monitor className="h-5 w-5" />
              <span className="text-sm font-medium">{t.stats.activeSessions}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.active_sessions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">{t.stats.uniqueUsers}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.unique_users.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-[#75534B] mb-2">
              <LogIn className="h-5 w-5" />
              <span className="text-sm font-medium">{t.stats.todayLogins}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.today_logins.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">{t.stats.todayFailed}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.today_failed_logins.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'all'
              ? 'border-[#75534B] text-[#75534B]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.tabs.all}
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'sessions'
              ? 'border-[#75534B] text-[#75534B]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.tabs.sessions} ({activeSessions.length})
        </button>
      </div>

      {/* All Activity Tab */}
      {activeTab === 'all' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t.filters.search}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <select
                value={filters.type || ''}
                onChange={(e) => {
                  setFilters({ ...filters, type: e.target.value || undefined });
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              >
                <option value="">{t.filters.all}</option>
                <option value="login">{t.filters.login}</option>
                <option value="login_failed">{t.filters.loginFailed}</option>
                <option value="logout">{t.filters.logout}</option>
                <option value="registration">{t.filters.registration}</option>
              </select>

              {/* Success Filter */}
              <select
                value={filters.success === undefined ? '' : filters.success.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({
                    ...filters,
                    success: value === '' ? undefined : value === 'true',
                  });
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              >
                <option value="">{t.filters.success}</option>
                <option value="true">{t.filters.successful}</option>
                <option value="false">{t.filters.failed}</option>
              </select>

              {/* Date Filters */}
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => {
                  setFilters({ ...filters, start_date: e.target.value || undefined });
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              />
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => {
                  setFilters({ ...filters, end_date: e.target.value || undefined });
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              />

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                {t.filters.clear}
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-[#75534B]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">{t.table.noLogs}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.user}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.type}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.ipAddress}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.details}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.time}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.user_name || log.identifier}
                            </p>
                            {log.user_email && (
                              <p className="text-xs text-gray-500">{log.user_email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(
                              log.type,
                              log.success
                            )}`}
                          >
                            {getTypeIcon(log.type)}
                            {t.types[log.type as keyof typeof t.types] || log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 font-mono">{log.ip_address}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 truncate max-w-[200px] block" title={log.details}>
                            {log.details || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(log.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {t.pagination.showing} {((page - 1) * (filters.per_page || 25)) + 1}-
                  {Math.min(page * (filters.per_page || 25), total)} {t.pagination.of} {total} {t.pagination.results}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {t.pagination.page} {page} / {pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pages}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Active Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeSessions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">{t.table.noSessions}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.user}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.ipAddress}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.time}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.duration}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.user_name || session.identifier}
                          </p>
                          {session.user_email && (
                            <p className="text-xs text-gray-500">{session.user_email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 font-mono">{session.ip_address}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(session.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{formatDuration(session.duration_seconds)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEndSession(session.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          {t.table.endSession}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
