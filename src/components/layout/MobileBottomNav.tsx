'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  ExternalLink,
  ClipboardList,
  CheckSquare,
  Settings,
  DollarSign,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
  roles?: string[];
}

// Primary nav items shown in bottom bar
const primaryItems: NavItem[] = [
  { icon: Home, labelKey: 'home', href: '/' },
  { icon: ShoppingBag, labelKey: 'catalog', href: '/catalog' },
  { icon: ExternalLink, labelKey: 'new', href: '/purchase/new' },
  { icon: ClipboardList, labelKey: 'requests', href: '/requests' },
];

// Items shown in "More" menu
const moreItems: NavItem[] = [
  { icon: CheckSquare, labelKey: 'approvals', href: '/approvals', roles: ['general_manager', 'admin'] },
  { icon: DollarSign, labelKey: 'orders', href: '/admin/orders', roles: ['admin', 'purchase_admin'] },
  { icon: Settings, labelKey: 'admin', href: '/admin', roles: ['admin'] },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language } = useLanguage();
  const [showMore, setShowMore] = useState(false);

  const text = {
    en: {
      home: 'Home',
      catalog: 'Catalog',
      new: 'New',
      requests: 'Requests',
      approvals: 'Approvals',
      orders: 'Orders',
      admin: 'Admin',
      more: 'More',
    },
    zh: {
      home: '首页',
      catalog: '目录',
      new: '新建',
      requests: '请求',
      approvals: '审批',
      orders: '订单',
      admin: '管理',
      more: '更多',
    },
    es: {
      home: 'Inicio',
      catalog: 'Catálogo',
      new: 'Nuevo',
      requests: 'Solicitudes',
      approvals: 'Aprobaciones',
      orders: 'Órdenes',
      admin: 'Admin',
      more: 'Más',
    },
  };

  const t = text[language];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const filteredMoreItems = moreItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  // Check if any "more" item is active
  const isMoreActive = filteredMoreItems.some((item) => isActive(item.href));

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E4E1DD] bg-white md:hidden">
        <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const label = t[item.labelKey as keyof typeof t];

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 text-xs ${
                  active ? 'text-[#75534B]' : 'text-[#6E6B67]'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'stroke-2' : ''}`} />
                <span className={active ? 'font-medium' : ''}>{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          {filteredMoreItems.length > 0 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs ${
                isMoreActive || showMore ? 'text-[#75534B]' : 'text-[#6E6B67]'
              }`}
            >
              <MoreHorizontal className={`h-5 w-5 ${isMoreActive ? 'stroke-2' : ''}`} />
              <span className={isMoreActive ? 'font-medium' : ''}>{t.more}</span>
            </button>
          )}
        </div>
      </nav>

      {/* More Menu Overlay */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-[60px] left-4 right-4 z-50 rounded-xl bg-white p-4 shadow-xl md:hidden">
            <div className="grid grid-cols-4 gap-4">
              {filteredMoreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const label = t[item.labelKey as keyof typeof t];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-2 rounded-lg p-3 ${
                      active
                        ? 'bg-[#75534B]/10 text-[#75534B]'
                        : 'text-[#6E6B67] hover:bg-[#F9F8F6]'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
