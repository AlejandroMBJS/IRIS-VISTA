'use client';

import { Bell } from 'lucide-react';
import type { PurchaseConfig } from '@/types';

interface Props {
  config: PurchaseConfig;
  onChange: (updates: Partial<PurchaseConfig>) => void;
  language: 'en' | 'zh' | 'es';
}

export function NotificationsSection({ config, onChange, language }: Props) {
  const text = {
    en: {
      title: 'Notifications',
      subtitle: 'Configure email and in-app notifications',
      requesterSection: 'Notify the requester when:',
      requesterApproved: 'Their request is approved',
      requesterRejected: 'Their request is rejected',
      requesterInfoRequested: 'More information is required',
      requesterPurchased: 'The order is marked as purchased',
      approverSection: 'Notify the approver when:',
      approverNewRequest: 'A new request arrives',
      approverUrgent: 'An urgent request is pending',
      adminSection: 'Notify admin when:',
      adminNewApproved: 'There are new approved orders',
      remindersSection: 'Automatic reminders',
      reminderPending: 'Remind pending approvals every',
      reminderUnpurchased: 'Remind unpurchased orders after',
      hours: 'hours',
    },
    zh: {
      title: '通知',
      subtitle: '配置邮件和应用内通知',
      requesterSection: '通知申请人当：',
      requesterApproved: '请求被批准',
      requesterRejected: '请求被拒绝',
      requesterInfoRequested: '需要更多信息',
      requesterPurchased: '订单标记为已购买',
      approverSection: '通知审批人当：',
      approverNewRequest: '有新请求到达',
      approverUrgent: '有紧急请求待处理',
      adminSection: '通知管理员当：',
      adminNewApproved: '有新批准的订单',
      remindersSection: '自动提醒',
      reminderPending: '每隔多少小时提醒待审批',
      reminderUnpurchased: '多少小时后提醒未购买订单',
      hours: '小时',
    },
    es: {
      title: 'Notificaciones',
      subtitle: 'Configura notificaciones por correo y en la aplicacion',
      requesterSection: 'Notificar al solicitante cuando:',
      requesterApproved: 'Su solicitud sea aprobada',
      requesterRejected: 'Su solicitud sea rechazada',
      requesterInfoRequested: 'Se requiera mas informacion',
      requesterPurchased: 'El pedido sea marcado como comprado',
      approverSection: 'Notificar al aprobador cuando:',
      approverNewRequest: 'Llegue una nueva solicitud',
      approverUrgent: 'Una solicitud urgente este pendiente',
      adminSection: 'Notificar al admin cuando:',
      adminNewApproved: 'Haya nuevos pedidos aprobados',
      remindersSection: 'Recordatorios automaticos',
      reminderPending: 'Recordar aprobaciones pendientes cada',
      reminderUnpurchased: 'Recordar pedidos sin comprar despues de',
      hours: 'horas',
    },
  };

  const t = text[language];

  const CheckboxItem = ({
    checked,
    onChange: onItemChange,
    label,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer py-2">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onItemChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="h-5 w-5 rounded border-2 border-[#ABC0B9] bg-white peer-checked:border-[#5C2F0E] peer-checked:bg-[#5C2F0E] transition-colors flex items-center justify-center">
          <svg
            className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <svg
          className={`absolute inset-0 h-5 w-5 text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-sm text-[#2D363F]">{label}</span>
    </label>
  );

  return (
    <div className="rounded-xl border border-[#ABC0B9] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#ABC0B9] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E95F20]/10">
            <Bell className="h-5 w-5 text-[#E95F20]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D363F]">{t.title}</h2>
            <p className="text-sm text-[#4E616F]">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Requester Notifications */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#2D363F]">{t.requesterSection}</h3>
          <div className="ml-2 space-y-1">
            <CheckboxItem
              checked={config.notify_requester_approved}
              onChange={(checked) => onChange({ notify_requester_approved: checked })}
              label={t.requesterApproved}
            />
            <CheckboxItem
              checked={config.notify_requester_rejected}
              onChange={(checked) => onChange({ notify_requester_rejected: checked })}
              label={t.requesterRejected}
            />
            <CheckboxItem
              checked={config.notify_requester_info_requested}
              onChange={(checked) => onChange({ notify_requester_info_requested: checked })}
              label={t.requesterInfoRequested}
            />
            <CheckboxItem
              checked={config.notify_requester_purchased}
              onChange={(checked) => onChange({ notify_requester_purchased: checked })}
              label={t.requesterPurchased}
            />
          </div>
        </div>

        {/* Approver Notifications */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#2D363F]">{t.approverSection}</h3>
          <div className="ml-2 space-y-1">
            <CheckboxItem
              checked={config.notify_approver_new_request}
              onChange={(checked) => onChange({ notify_approver_new_request: checked })}
              label={t.approverNewRequest}
            />
            <CheckboxItem
              checked={config.notify_approver_urgent}
              onChange={(checked) => onChange({ notify_approver_urgent: checked })}
              label={t.approverUrgent}
            />
          </div>
        </div>

        {/* Admin Notifications */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[#2D363F]">{t.adminSection}</h3>
          <div className="ml-2 space-y-1">
            <CheckboxItem
              checked={config.notify_admin_new_approved}
              onChange={(checked) => onChange({ notify_admin_new_approved: checked })}
              label={t.adminNewApproved}
            />
          </div>
        </div>

        {/* Reminders */}
        <div className="border-t border-[#ABC0B9] pt-6">
          <h3 className="mb-4 text-sm font-semibold text-[#2D363F]">{t.remindersSection}</h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-sm text-[#2D363F] sm:min-w-[280px]">{t.reminderPending}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={config.reminder_pending_hours}
                  onChange={(e) => onChange({ reminder_pending_hours: parseInt(e.target.value) || 24 })}
                  className="w-20 rounded-lg border border-[#ABC0B9] bg-white px-3 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                />
                <span className="text-sm text-[#4E616F]">{t.hours}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-sm text-[#2D363F] sm:min-w-[280px]">{t.reminderUnpurchased}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={config.reminder_unpurchased_hours}
                  onChange={(e) => onChange({ reminder_unpurchased_hours: parseInt(e.target.value) || 48 })}
                  className="w-20 rounded-lg border border-[#ABC0B9] bg-white px-3 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
                />
                <span className="text-sm text-[#4E616F]">{t.hours}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
