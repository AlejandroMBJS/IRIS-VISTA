'use client';

import { Settings } from 'lucide-react';
import type { PurchaseConfig } from '@/types';

interface Props {
  config: PurchaseConfig;
  onChange: (updates: Partial<PurchaseConfig>) => void;
  language: 'en' | 'zh' | 'es';
}

export function GeneralSection({ config, onChange, language }: Props) {
  const text = {
    en: {
      title: 'General Configuration',
      subtitle: 'Basic settings for the purchase request module',
      moduleName: 'Module Name',
      moduleNamePlaceholder: 'Purchase Requests',
      moduleDescription: 'Description for users',
      moduleDescriptionPlaceholder: 'System for requesting product and service purchases...',
      moduleActive: 'Module active',
      moduleActiveDesc: 'Enable or disable the entire purchase module',
      allowUrgent: 'Allow urgent requests',
      allowUrgentDesc: 'Users can mark requests as urgent for priority processing',
      requireJustification: 'Require justification',
      requireJustificationDesc: 'Users must provide a reason for each purchase request',
    },
    zh: {
      title: '常规配置',
      subtitle: '采购请求模块的基本设置',
      moduleName: '模块名称',
      moduleNamePlaceholder: '采购请求',
      moduleDescription: '用户说明',
      moduleDescriptionPlaceholder: '用于请求购买产品和服务的系统...',
      moduleActive: '模块启用',
      moduleActiveDesc: '启用或禁用整个采购模块',
      allowUrgent: '允许紧急请求',
      allowUrgentDesc: '用户可以将请求标记为紧急以优先处理',
      requireJustification: '要求说明理由',
      requireJustificationDesc: '用户必须为每个采购请求提供原因',
    },
    es: {
      title: 'Configuracion General',
      subtitle: 'Configuracion basica del modulo de solicitudes de compra',
      moduleName: 'Nombre del modulo',
      moduleNamePlaceholder: 'Solicitudes de Compra',
      moduleDescription: 'Descripcion para usuarios',
      moduleDescriptionPlaceholder: 'Sistema para solicitar compras de productos y servicios...',
      moduleActive: 'Modulo activo',
      moduleActiveDesc: 'Habilitar o deshabilitar todo el modulo de compras',
      allowUrgent: 'Permitir solicitudes urgentes',
      allowUrgentDesc: 'Los usuarios pueden marcar solicitudes como urgentes para procesamiento prioritario',
      requireJustification: 'Requerir justificacion',
      requireJustificationDesc: 'Los usuarios deben proporcionar una razon para cada solicitud de compra',
    },
  };

  const t = text[language];

  return (
    <div className="rounded-xl border border-[#E4E1DD] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#E4E1DD] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#75534B]/10">
            <Settings className="h-5 w-5 text-[#75534B]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2C2C2C]">{t.title}</h2>
            <p className="text-sm text-[#6E6B67]">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Module Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#2C2C2C]">
            {t.moduleName}
          </label>
          <input
            type="text"
            value={config.module_name}
            onChange={(e) => onChange({ module_name: e.target.value })}
            placeholder={t.moduleNamePlaceholder}
            className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
          />
        </div>

        {/* Module Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#2C2C2C]">
            {t.moduleDescription}
          </label>
          <textarea
            value={config.module_description}
            onChange={(e) => onChange({ module_description: e.target.value })}
            placeholder={t.moduleDescriptionPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 resize-none"
          />
        </div>

        {/* Toggle Options */}
        <div className="space-y-4 pt-2">
          {/* Module Active */}
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={config.module_active}
                onChange={(e) => onChange({ module_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#E4E1DD] peer-checked:bg-[#4BAF7E] transition-colors" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1">
              <span className="block text-sm font-medium text-[#2C2C2C]">{t.moduleActive}</span>
              <span className="block text-sm text-[#6E6B67]">{t.moduleActiveDesc}</span>
            </div>
          </label>

          {/* Allow Urgent */}
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={config.allow_urgent}
                onChange={(e) => onChange({ allow_urgent: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#E4E1DD] peer-checked:bg-[#4BAF7E] transition-colors" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1">
              <span className="block text-sm font-medium text-[#2C2C2C]">{t.allowUrgent}</span>
              <span className="block text-sm text-[#6E6B67]">{t.allowUrgentDesc}</span>
            </div>
          </label>

          {/* Require Justification */}
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={config.require_justification}
                onChange={(e) => onChange({ require_justification: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#E4E1DD] peer-checked:bg-[#4BAF7E] transition-colors" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1">
              <span className="block text-sm font-medium text-[#2C2C2C]">{t.requireJustification}</span>
              <span className="block text-sm text-[#6E6B67]">{t.requireJustificationDesc}</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
