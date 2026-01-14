import { Search, ShoppingBag, Package, Shield, Zap, Laptop, Wrench } from 'lucide-react';

interface HeroProps {
  language: 'en' | 'zh';
}

export function Hero({ language }: HeroProps) {
  const text = {
    en: {
      title: 'What do you need today?',
      search: 'Search for forms, materials, services...',
      actions: [
        { icon: ShoppingBag, label: 'Amazon Purchase', color: '#F38756' },
        { icon: Package, label: 'Regular Purchase (PR/PO)', color: '#5C2F0E' },
        { icon: Shield, label: 'PPE Request', color: '#5C2F0E' },
        { icon: Zap, label: 'Non-Amazon Spot Purchase', color: '#E95F20' },
        { icon: Laptop, label: 'IT Request', color: '#4E616F' },
        { icon: Wrench, label: 'Maintenance Request', color: '#5C2F0E' },
      ],
    },
    zh: {
      title: '今天需要什么？',
      search: '搜索表单、物料、服务...',
      actions: [
        { icon: ShoppingBag, label: '亚马逊采购', color: '#F38756' },
        { icon: Package, label: '常规采购 (PR/PO)', color: '#5C2F0E' },
        { icon: Shield, label: 'PPE 请求', color: '#5C2F0E' },
        { icon: Zap, label: '非亚马逊现货采购', color: '#E95F20' },
        { icon: Laptop, label: 'IT 请求', color: '#4E616F' },
        { icon: Wrench, label: '维护请求', color: '#5C2F0E' },
      ],
    },
  };

  const t = text[language];

  return (
    <section className="mb-12">
      {/* Hero Title */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-[#2D363F]">{t.title}</h1>
        <div className="mx-auto max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#80959A]" />
            <input
              type="text"
              placeholder={t.search}
              className="w-full rounded-xl border border-[#ABC0B9] bg-white py-4 pl-14 pr-4 text-base shadow-sm transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20 focus:shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {t.actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              className="group flex flex-col items-center gap-3 rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl transition-all"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Icon className="h-7 w-7" style={{ color: action.color }} />
              </div>
              <span className="text-center text-sm text-[#2D363F] group-hover:text-[#2D363F]">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
