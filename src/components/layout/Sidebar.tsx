'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ExternalLink,
  ClipboardList,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  ShoppingCart,
  Package,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { notificationsApi, type PendingCounts } from '@/lib/api';

interface MenuItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
  roles?: string[];
  badgeKey?: keyof PendingCounts | 'pending_combined';
}

const menuItems: MenuItem[] = [
  // Common for all users
  { icon: Home, labelKey: 'home', href: '/' },
  { icon: ExternalLink, labelKey: 'newPurchase', href: '/purchase/new' },
  { icon: ClipboardList, labelKey: 'requests', href: '/requests' },

  // Approvals - GM can approve, Admin + Purchase Admin can view (includes pending orders)
  { icon: CheckSquare, labelKey: 'approvals', href: '/approvals', roles: ['general_manager', 'admin', 'purchase_admin'], badgeKey: 'pending_combined' },

  // Inventory - Admin + Purchase Admin + Supply Chain Manager
  { icon: Package, labelKey: 'inventory', href: '/inventory', roles: ['admin', 'purchase_admin', 'supply_chain_manager'] },

  // Analytics - Admin + Supply Chain Manager
  { icon: BarChart3, labelKey: 'analytics', href: '/analytics', roles: ['admin', 'supply_chain_manager'] },

  // Purchase Settings - Admin + Purchase Admin
  { icon: ShoppingCart, labelKey: 'purchaseConfig', href: '/admin/purchase-config', roles: ['admin', 'purchase_admin'] },

  // User Management - Admin only
  { icon: Users, labelKey: 'users', href: '/admin/users', roles: ['admin'] },

  // Activity Logs - Admin only
  { icon: Activity, labelKey: 'logs', href: '/admin/logs', roles: ['admin'] },

  // System Admin - Admin only
  { icon: Settings, labelKey: 'admin', href: '/admin', roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [pendingCounts, setPendingCounts] = useState<PendingCounts | null>(null);

  // Fetch pending counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const counts = await notificationsApi.getPendingCounts();
        setPendingCounts(counts);
      } catch (err) {
        console.error('Failed to fetch pending counts:', err);
      }
    };

    if (user) {
      fetchCounts();
      // Refresh every 30 seconds
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const text = {
    en: {
      home: 'Home',
      newPurchase: 'New Purchase',
      requests: 'My Requests',
      approvals: 'Approvals',
      orders: 'Orders',
      inventory: 'Inventory',
      analytics: 'Analytics',
      users: 'Users',
      purchaseConfig: 'Purchase Settings',
      logs: 'Activity Logs',
      admin: 'Admin',
    },
    zh: {
      home: '首页',
      newPurchase: '新采购',
      requests: '我的请求',
      approvals: '审批',
      orders: '订单',
      inventory: '库存',
      analytics: '分析',
      users: '用户',
      purchaseConfig: '采购设置',
      logs: '活动日志',
      admin: '管理',
    },
    es: {
      home: 'Inicio',
      newPurchase: 'Nueva Compra',
      requests: 'Mis Solicitudes',
      approvals: 'Aprobaciones',
      orders: 'Órdenes',
      inventory: 'Inventario',
      analytics: 'Analítica',
      users: 'Usuarios',
      purchaseConfig: 'Config. Compras',
      logs: 'Registro de Actividad',
      admin: 'Admin',
    },
  };

  const t = text[language];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    // Exact match
    if (pathname === href) {
      return true;
    }
    // Check if pathname starts with href + '/'
    // But only if no other menu item is a more specific match
    if (pathname.startsWith(href + '/')) {
      // Check if there's a more specific menu item that matches
      const hasMoreSpecificMatch = filteredMenuItems.some(
        (item) => item.href !== href &&
                  item.href.startsWith(href + '/') &&
                  (pathname === item.href || pathname.startsWith(item.href + '/'))
      );
      return !hasMoreSpecificMatch;
    }
    return false;
  };

  // Get badge count for a menu item
  const getBadgeCount = (item: MenuItem): number => {
    if (!item.badgeKey || !pendingCounts) return 0;
    // Combined badge for approvals (pending_approvals + pending_orders)
    if (item.badgeKey === 'pending_combined') {
      return (pendingCounts.pending_approvals || 0) + (pendingCounts.pending_orders || 0);
    }
    return pendingCounts[item.badgeKey] || 0;
  };

  return (
    <aside className="fixed left-0 top-16 sm:top-[73px] bottom-0 border-r border-[#ABC0B9]/40 bg-white/95 backdrop-blur-sm overflow-y-auto hidden lg:block w-56 xl:w-64 transition-all duration-300">
      <nav className="flex flex-col gap-1.5 p-4 lg:p-5">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const label = t[item.labelKey as keyof typeof t] || item.labelKey;
          const badgeCount = getBadgeCount(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 lg:px-4 lg:py-3 text-sm font-medium tracking-tight transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] text-white shadow-soft-md'
                  : 'text-[#4E616F] hover:bg-[#ABC0B9]/15 hover:text-[#2D363F] active:scale-[0.98]'
              }`}
              title={label}
            >
              <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-200 ${active ? '' : 'opacity-70'}`} />
              <span className="flex-1 truncate">{label}</span>
              {badgeCount > 0 && (
                <span
                  className={`flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all duration-200 ${
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-gradient-to-br from-[#AA2F0D] to-[#8a260b] text-white'
                  }`}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
