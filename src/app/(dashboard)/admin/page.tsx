'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  ClipboardList,
  CheckSquare,
  Settings,
  ShoppingCart,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import type { DashboardStats } from '@/types';

export default function AdminPage() {
  const { language } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const text = {
    en: {
      title: 'Admin Dashboard',
      subtitle: 'System overview and management',
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      totalProducts: 'Total Products',
      totalRequests: 'Total Requests',
      pendingApprovals: 'Pending Approvals',
      management: 'Management',
      userManagement: 'User Management',
      userManagementDesc: 'Manage user accounts and roles',
      purchaseConfig: 'Purchase Settings',
      purchaseConfigDesc: 'Configure the purchase request module',
    },
    zh: {
      title: '管理后台',
      subtitle: '系统概述和管理',
      totalUsers: '总用户数',
      activeUsers: '活跃用户',
      totalProducts: '总产品数',
      totalRequests: '总请求数',
      pendingApprovals: '待审批',
      management: '管理',
      userManagement: '用户管理',
      userManagementDesc: '管理用户账户和角色',
      purchaseConfig: '采购设置',
      purchaseConfigDesc: '配置采购请求模块',
    },
    es: {
      title: 'Panel de Admin',
      subtitle: 'Resumen y gestión del sistema',
      totalUsers: 'Total de Usuarios',
      activeUsers: 'Usuarios Activos',
      totalProducts: 'Total de Productos',
      totalRequests: 'Total de Solicitudes',
      pendingApprovals: 'Aprobaciones Pendientes',
      management: 'Gestión',
      userManagement: 'Gestión de Usuarios',
      userManagementDesc: 'Gestionar cuentas de usuario y roles',
      purchaseConfig: 'Configuración de Compras',
      purchaseConfigDesc: 'Configurar el módulo de solicitudes de compra',
    },
  };

  const t = text[language];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C2F0E]" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: t.totalUsers,
      value: stats?.total_users || 0,
      color: 'from-[#5C2F0E] to-[#2D363F]',
    },
    {
      icon: Users,
      label: t.activeUsers,
      value: stats?.active_users || 0,
      color: 'from-[#5C2F0E] to-[#3D9066]',
    },
    {
      icon: Package,
      label: t.totalProducts,
      value: stats?.total_products || 0,
      color: 'from-[#3F8F8F] to-[#337373]',
    },
    {
      icon: ClipboardList,
      label: t.totalRequests,
      value: stats?.total_requests || 0,
      color: 'from-[#E95F20] to-[#C77A3F]',
    },
    {
      icon: CheckSquare,
      label: t.pendingApprovals,
      value: stats?.pending_approvals || 0,
      color: 'from-[#E1A948] to-[#C79438]',
    },
  ];

  const managementLinks = [
    {
      icon: Users,
      title: t.userManagement,
      description: t.userManagementDesc,
      href: '/admin/users',
      color: 'bg-[#5C2F0E]',
    },
    {
      icon: ShoppingCart,
      title: t.purchaseConfig,
      description: t.purchaseConfigDesc,
      href: '/admin/purchase-config',
      color: 'bg-[#E95F20]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFA]">
      {/* Header */}
      <section className="border-b border-[#ABC0B9] bg-white px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl text-[#2D363F]" style={{ fontWeight: 600 }}>
            {t.title}
          </h1>
          <p className="text-base text-[#4E616F]">{t.subtitle}</p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-4 md:px-8 py-6 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-xl bg-gradient-to-r ${stat.color} p-6 text-white shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-sm text-white/80 mt-1">{stat.label}</p>
                    </div>
                    <Icon className="h-10 w-10 text-white/60" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Management Links */}
          <h2 className="text-xl font-semibold text-[#2D363F] mb-4">{t.management}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {managementLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <Link
                  key={idx}
                  href={link.href}
                  className="group rounded-xl bg-white border border-[#ABC0B9] p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl ${link.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#2D363F] group-hover:text-[#5C2F0E] transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-sm text-[#4E616F] mt-1">{link.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[#ABC0B9] group-hover:text-[#5C2F0E] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
