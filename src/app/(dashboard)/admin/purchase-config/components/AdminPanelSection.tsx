'use client';

import { LayoutGrid } from 'lucide-react';
import type { PurchaseConfig } from '@/types';

interface Props {
  config: PurchaseConfig;
  onChange: (updates: Partial<PurchaseConfig>) => void;
  language: 'en' | 'zh' | 'es';
}

const COLUMNS = [
  { id: 'image', labelKey: 'colImage' },
  { id: 'title', labelKey: 'colTitle' },
  { id: 'quantity', labelKey: 'colQuantity' },
  { id: 'price', labelKey: 'colPrice' },
  { id: 'requester', labelKey: 'colRequester' },
  { id: 'approved_at', labelKey: 'colApprovedAt' },
  { id: 'url', labelKey: 'colUrl' },
  { id: 'justification', labelKey: 'colJustification' },
  { id: 'approved_by', labelKey: 'colApprovedBy' },
];

const SORT_OPTIONS = [
  { value: 'approved_at_desc', labelKey: 'sortApprovedAtDesc' },
  { value: 'approved_at_asc', labelKey: 'sortApprovedAtAsc' },
  { value: 'price_desc', labelKey: 'sortPriceDesc' },
  { value: 'price_asc', labelKey: 'sortPriceAsc' },
  { value: 'created_at_desc', labelKey: 'sortCreatedAtDesc' },
  { value: 'created_at_asc', labelKey: 'sortCreatedAtAsc' },
];

export function AdminPanelSection({ config, onChange, language }: Props) {
  const text = {
    en: {
      title: 'Admin Panel Settings',
      subtitle: 'Configure the orders management panel',
      defaultView: 'Default view',
      viewCards: 'Cards',
      viewTable: 'Table',
      visibleColumns: 'Visible columns in table',
      defaultSort: 'Default sort',
      quickActions: 'Quick actions',
      showOpenUrl: 'Show "Open URL" button on each row',
      showMarkPurchased: 'Show "Mark as purchased" button',
      showAddNotes: 'Allow adding purchase notes',
      colImage: 'Product image',
      colTitle: 'Title/Name',
      colQuantity: 'Quantity',
      colPrice: 'Estimated price',
      colRequester: 'Requester',
      colApprovedAt: 'Approval date',
      colUrl: 'URL (link)',
      colJustification: 'Justification',
      colApprovedBy: 'Approved by',
      sortApprovedAtDesc: 'Approval date (newest first)',
      sortApprovedAtAsc: 'Approval date (oldest first)',
      sortPriceDesc: 'Price (highest first)',
      sortPriceAsc: 'Price (lowest first)',
      sortCreatedAtDesc: 'Created date (newest first)',
      sortCreatedAtAsc: 'Created date (oldest first)',
    },
    zh: {
      title: '管理面板设置',
      subtitle: '配置订单管理面板',
      defaultView: '默认视图',
      viewCards: '卡片',
      viewTable: '表格',
      visibleColumns: '表格中可见的列',
      defaultSort: '默认排序',
      quickActions: '快捷操作',
      showOpenUrl: '在每行显示"打开链接"按钮',
      showMarkPurchased: '显示"标记为已购买"按钮',
      showAddNotes: '允许添加采购备注',
      colImage: '产品图片',
      colTitle: '标题/名称',
      colQuantity: '数量',
      colPrice: '预估价格',
      colRequester: '申请人',
      colApprovedAt: '审批日期',
      colUrl: 'URL（链接）',
      colJustification: '说明理由',
      colApprovedBy: '审批人',
      sortApprovedAtDesc: '审批日期（最新优先）',
      sortApprovedAtAsc: '审批日期（最早优先）',
      sortPriceDesc: '价格（最高优先）',
      sortPriceAsc: '价格（最低优先）',
      sortCreatedAtDesc: '创建日期（最新优先）',
      sortCreatedAtAsc: '创建日期（最早优先）',
    },
    es: {
      title: 'Configuracion del Panel Admin',
      subtitle: 'Configura el panel de gestion de pedidos',
      defaultView: 'Vista por defecto',
      viewCards: 'Tarjetas',
      viewTable: 'Tabla',
      visibleColumns: 'Columnas visibles en tabla',
      defaultSort: 'Ordenar por defecto',
      quickActions: 'Acciones rapidas',
      showOpenUrl: 'Mostrar boton "Abrir URL" en cada fila',
      showMarkPurchased: 'Mostrar boton "Marcar como comprado"',
      showAddNotes: 'Permitir agregar notas de compra',
      colImage: 'Imagen del producto',
      colTitle: 'Titulo/Nombre',
      colQuantity: 'Cantidad',
      colPrice: 'Precio estimado',
      colRequester: 'Solicitante',
      colApprovedAt: 'Fecha de aprobacion',
      colUrl: 'URL (link)',
      colJustification: 'Justificacion',
      colApprovedBy: 'Aprobado por',
      sortApprovedAtDesc: 'Fecha de aprobacion (mas reciente)',
      sortApprovedAtAsc: 'Fecha de aprobacion (mas antigua)',
      sortPriceDesc: 'Precio (mayor primero)',
      sortPriceAsc: 'Precio (menor primero)',
      sortCreatedAtDesc: 'Fecha de creacion (mas reciente)',
      sortCreatedAtAsc: 'Fecha de creacion (mas antigua)',
    },
  };

  const t = text[language];

  const handleColumnToggle = (columnId: string) => {
    const currentColumns = config.admin_visible_columns || [];
    const newColumns = currentColumns.includes(columnId)
      ? currentColumns.filter(c => c !== columnId)
      : [...currentColumns, columnId];
    onChange({ admin_visible_columns: newColumns });
  };

  return (
    <div className="rounded-xl border border-[#ABC0B9] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#ABC0B9] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D363F]/10">
            <LayoutGrid className="h-5 w-5 text-[#2D363F]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D363F]">{t.title}</h2>
            <p className="text-sm text-[#4E616F]">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Default View */}
        <div>
          <label className="mb-3 block text-sm font-medium text-[#2D363F]">
            {t.defaultView}
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                checked={config.admin_default_view === 'cards'}
                onChange={() => onChange({ admin_default_view: 'cards' })}
                className="h-4 w-4 border-[#ABC0B9] text-[#5C2F0E] focus:ring-[#5C2F0E]"
              />
              <span className="text-sm text-[#2D363F]">{t.viewCards}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                checked={config.admin_default_view === 'table'}
                onChange={() => onChange({ admin_default_view: 'table' })}
                className="h-4 w-4 border-[#ABC0B9] text-[#5C2F0E] focus:ring-[#5C2F0E]"
              />
              <span className="text-sm text-[#2D363F]">{t.viewTable}</span>
            </label>
          </div>
        </div>

        {/* Visible Columns */}
        <div>
          <label className="mb-3 block text-sm font-medium text-[#2D363F]">
            {t.visibleColumns}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COLUMNS.map((column) => {
              const isChecked = (config.admin_visible_columns || []).includes(column.id);
              return (
                <label
                  key={column.id}
                  className="flex items-center gap-3 cursor-pointer py-2"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleColumnToggle(column.id)}
                      className="sr-only peer"
                    />
                    <div className="h-5 w-5 rounded border-2 border-[#ABC0B9] bg-white peer-checked:border-[#5C2F0E] peer-checked:bg-[#5C2F0E] transition-colors" />
                    <svg
                      className={`absolute inset-0 h-5 w-5 text-white transition-opacity ${isChecked ? 'opacity-100' : 'opacity-0'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#2D363F]">
                    {t[column.labelKey as keyof typeof t]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Default Sort */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#2D363F]">
            {t.defaultSort}
          </label>
          <select
            value={config.admin_default_sort}
            onChange={(e) => onChange({ admin_default_sort: e.target.value })}
            className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t[option.labelKey as keyof typeof t]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
