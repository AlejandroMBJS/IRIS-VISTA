'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  ExternalLink,
  ClipboardList,
  CheckSquare,
  Truck,
  Package,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language } = useLanguage();

  const text = {
    en: {
      home: 'Home',
      catalog: 'Catalog',
      new: 'New',
      requests: 'Requests',
      approvals: 'Approvals',
      orders: 'Orders',
      inventory: 'Inventory',
      admin: 'Admin',
    },
    zh: {
      home: '首页',
      catalog: '目录',
      new: '新建',
      requests: '请求',
      approvals: '审批',
      orders: '订单',
      inventory: '库存',
      admin: '管理',
    },
    es: {
      home: 'Inicio',
      catalog: 'Catálogo',
      new: 'Nuevo',
      requests: 'Solicitudes',
      approvals: 'Aprobaciones',
      orders: 'Órdenes',
      inventory: 'Inventario',
      admin: 'Admin',
    },
  };

  const t = text[language];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Get 5 nav items based on user role
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { icon: Home, labelKey: 'home', href: '/' },
      { icon: ShoppingBag, labelKey: 'catalog', href: '/catalog' },
      { icon: ExternalLink, labelKey: 'new', href: '/purchase/new' },
      { icon: ClipboardList, labelKey: 'requests', href: '/requests' },
    ];

    // 5th item based on role
    if (user?.role === 'general_manager') {
      // GM sees Approvals as 5th item
      baseItems.push({ icon: CheckSquare, labelKey: 'approvals', href: '/approvals' });
    } else if (user?.role === 'admin') {
      // Admin sees Admin settings as 5th item
      baseItems.push({ icon: Settings, labelKey: 'admin', href: '/admin' });
    } else if (user?.role === 'purchase_admin' || user?.role === 'supply_chain_manager') {
      // Purchase admin and supply chain see Orders as 5th item
      baseItems.push({ icon: Truck, labelKey: 'orders', href: '/admin/orders' });
    } else {
      // Regular employees see Inventory as 5th item (view only)
      baseItems.push({ icon: Package, labelKey: 'inventory', href: '/inventory' });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#ABC0B9]/40 bg-white/95 backdrop-blur-md lg:hidden shadow-soft">
      <div className="flex items-center justify-around px-1 py-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const label = t[item.labelKey as keyof typeof t];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] tracking-tight transition-all duration-200 active:scale-95 min-w-0 flex-1 ${
                active ? 'text-[#5C2F0E]' : 'text-[#4E616F]/70'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-[#5C2F0E]/10' : ''}`}>
                <Icon className={`h-5 w-5 transition-all duration-200 ${active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`transition-all duration-200 truncate ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
