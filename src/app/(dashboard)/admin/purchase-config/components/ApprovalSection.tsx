'use client';

import { CheckSquare, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { PurchaseConfig, UserBasic, ApprovalLevel } from '@/types';

interface Props {
  config: PurchaseConfig;
  onChange: (updates: Partial<PurchaseConfig>) => void;
  approvers: UserBasic[];
  language: 'en' | 'zh' | 'es';
}

export function ApprovalSection({ config, onChange, approvers, language }: Props) {
  const text = {
    en: {
      title: 'Approval Flow',
      subtitle: 'Configure how purchase requests are approved',
      defaultApprover: 'Default approver',
      defaultApproverPlaceholder: 'Select a user...',
      autoApprove: 'Enable auto-approval for low amounts',
      autoApproveDesc: 'Requests below the threshold will be approved automatically',
      autoApproveMax: 'Maximum amount for auto-approval',
      currency: 'MXN',
      autoApproveWarning: 'Requests under this amount will be approved automatically without review',
      approvalLevels: 'Approval by amount',
      upTo: 'Up to',
      moreThan: 'More than',
      approver: 'Approver Role',
      addLevel: 'Add approval level',
      roles: {
        admin: 'Administrator',
        general_manager: 'General Manager',
        supply_chain_manager: 'Supply Chain Manager',
      },
    },
    zh: {
      title: '审批流程',
      subtitle: '配置采购请求的审批方式',
      defaultApprover: '默认审批人',
      defaultApproverPlaceholder: '选择用户...',
      autoApprove: '启用低金额自动审批',
      autoApproveDesc: '低于阈值的请求将自动获批',
      autoApproveMax: '自动审批最大金额',
      currency: 'MXN',
      autoApproveWarning: '低于此金额的请求将自动审批，无需审核',
      approvalLevels: '按金额审批',
      upTo: '最多',
      moreThan: '超过',
      approver: '审批人角色',
      addLevel: '添加审批级别',
      roles: {
        admin: '管理员',
        general_manager: '总经理',
        supply_chain_manager: '供应链经理',
      },
    },
    es: {
      title: 'Flujo de Aprobacion',
      subtitle: 'Configura como se aprueban las solicitudes de compra',
      defaultApprover: 'Aprobador por defecto',
      defaultApproverPlaceholder: 'Seleccionar usuario...',
      autoApprove: 'Habilitar auto-aprobacion para montos bajos',
      autoApproveDesc: 'Las solicitudes bajo el umbral se aprobaran automaticamente',
      autoApproveMax: 'Monto maximo para auto-aprobacion',
      currency: 'MXN',
      autoApproveWarning: 'Las solicitudes bajo este monto se aprobaran automaticamente sin revision',
      approvalLevels: 'Aprobacion por monto',
      upTo: 'Hasta',
      moreThan: 'Mas de',
      approver: 'Rol del aprobador',
      addLevel: 'Agregar nivel de aprobacion',
      roles: {
        admin: 'Administrador',
        general_manager: 'Gerente General',
        supply_chain_manager: 'Gerente de Cadena de Suministro',
      },
    },
  };

  const t = text[language];

  const handleAddLevel = () => {
    const newLevels: ApprovalLevel[] = [...(config.approval_levels || [])];
    const lastMax = newLevels.length > 0 ? newLevels[newLevels.length - 1].max_amount : 0;
    newLevels.push({
      max_amount: lastMax + 5000,
      approver_role: 'general_manager',
    });
    onChange({ approval_levels: newLevels });
  };

  const handleRemoveLevel = (index: number) => {
    const newLevels = [...(config.approval_levels || [])];
    newLevels.splice(index, 1);
    onChange({ approval_levels: newLevels });
  };

  const handleLevelChange = (index: number, updates: Partial<ApprovalLevel>) => {
    const newLevels = [...(config.approval_levels || [])];
    newLevels[index] = { ...newLevels[index], ...updates };
    onChange({ approval_levels: newLevels });
  };

  return (
    <div className="rounded-xl border border-[#ABC0B9] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#ABC0B9] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5C2F0E]/10">
            <CheckSquare className="h-5 w-5 text-[#5C2F0E]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D363F]">{t.title}</h2>
            <p className="text-sm text-[#4E616F]">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Default Approver */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#2D363F]">
            {t.defaultApprover}
          </label>
          <select
            value={config.default_approver_id || ''}
            onChange={(e) => onChange({
              default_approver_id: e.target.value ? parseInt(e.target.value) : null
            })}
            className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
          >
            <option value="">{t.defaultApproverPlaceholder}</option>
            {approvers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email}) - {t.roles[user.role as keyof typeof t.roles] || user.role}
              </option>
            ))}
          </select>
        </div>

        {/* Auto Approval */}
        <div className="rounded-lg border border-[#ABC0B9] p-4">
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={config.auto_approve_enabled}
                onChange={(e) => onChange({ auto_approve_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#ABC0B9] peer-checked:bg-[#5C2F0E] transition-colors" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1">
              <span className="block text-sm font-medium text-[#2D363F]">{t.autoApprove}</span>
              <span className="block text-sm text-[#4E616F]">{t.autoApproveDesc}</span>
            </div>
          </label>

          {config.auto_approve_enabled && (
            <div className="mt-4 pl-15">
              <label className="mb-2 block text-sm font-medium text-[#2D363F]">
                {t.autoApproveMax}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#4E616F]">$</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={config.auto_approve_max_amount}
                  onChange={(e) => onChange({ auto_approve_max_amount: parseFloat(e.target.value) || 0 })}
                  className="w-32 rounded-lg border border-[#ABC0B9] bg-white px-4 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                />
                <span className="text-sm text-[#4E616F]">{t.currency}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[#E95F20]">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">{t.autoApproveWarning}</span>
              </div>
            </div>
          )}
        </div>

        {/* Approval Levels */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-[#2D363F]">{t.approvalLevels}</h3>
          <div className="space-y-3">
            {(config.approval_levels || []).map((level, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg border border-[#ABC0B9] p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#4E616F]">{t.upTo}</span>
                  <span className="text-sm text-[#4E616F]">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={level.max_amount}
                    onChange={(e) => handleLevelChange(index, { max_amount: parseFloat(e.target.value) || 0 })}
                    className="w-28 rounded-lg border border-[#ABC0B9] bg-white px-3 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                  />
                  <span className="text-sm text-[#4E616F]">{t.currency}</span>
                </div>
                <span className="text-[#ABC0B9]">|</span>
                <div className="flex-1">
                  <select
                    value={level.approver_role}
                    onChange={(e) => handleLevelChange(index, { approver_role: e.target.value })}
                    className="w-full rounded-lg border border-[#ABC0B9] bg-white px-3 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                  >
                    <option value="general_manager">{t.roles.general_manager}</option>
                    <option value="supply_chain_manager">{t.roles.supply_chain_manager}</option>
                    <option value="admin">{t.roles.admin}</option>
                  </select>
                </div>
                <button
                  onClick={() => handleRemoveLevel(index)}
                  className="rounded-lg p-2 text-[#AA2F0D] hover:bg-[#AA2F0D]/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              onClick={handleAddLevel}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#ABC0B9] px-4 py-3 text-sm font-medium text-[#4E616F] transition-all hover:border-[#5C2F0E] hover:text-[#5C2F0E]"
            >
              <Plus className="h-4 w-4" />
              {t.addLevel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
