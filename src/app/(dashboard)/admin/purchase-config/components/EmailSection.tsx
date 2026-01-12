'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Key,
  Send,
  Loader2,
  Check,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { emailConfigApi, type EmailConfig, type EmailConfigInput } from '@/lib/api';

interface EmailSectionProps {
  language: 'en' | 'zh' | 'es';
}

export function EmailSection({ language }: EmailSectionProps) {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const text = {
    en: {
      title: 'Email Configuration',
      subtitle: 'Configure email notifications via Resend',
      provider: 'Email Provider',
      apiKey: 'API Key',
      apiKeyPlaceholder: 'Enter your Resend API key',
      apiKeySet: 'API key is configured',
      apiKeyNotSet: 'API key not configured',
      fromEmail: 'From Email',
      fromEmailPlaceholder: 'noreply@company.com',
      fromName: 'From Name',
      fromNamePlaceholder: 'IRIS Vista',
      replyTo: 'Reply-To Email',
      replyToPlaceholder: 'support@company.com (optional)',
      enabled: 'Enable Email Notifications',
      enabledDesc: 'Send emails when notifications are triggered',
      sendOnApproval: 'Request Approved',
      sendOnRejection: 'Request Rejected',
      sendOnInfo: 'Information Requested',
      sendOnPurchased: 'Order Purchased',
      sendOnNew: 'New Request',
      sendOnUrgent: 'Urgent Requests',
      sendReminders: 'Send Reminders',
      testConnection: 'Test Connection',
      testEmailPlaceholder: 'Enter email to receive test',
      sendTest: 'Send Test Email',
      testing: 'Sending...',
      testSuccess: 'Test email sent successfully!',
      testFailed: 'Failed to send test email',
      saveChanges: 'Save Email Settings',
      saving: 'Saving...',
      saveSuccess: 'Email configuration saved',
      saveFailed: 'Failed to save configuration',
      lastTest: 'Last test',
      triggers: 'Email Triggers',
      triggersDesc: 'Choose when to send email notifications',
      connection: 'Connection',
    },
    zh: {
      title: '邮件配置',
      subtitle: '通过 Resend 配置邮件通知',
      provider: '邮件提供商',
      apiKey: 'API 密钥',
      apiKeyPlaceholder: '输入您的 Resend API 密钥',
      apiKeySet: 'API 密钥已配置',
      apiKeyNotSet: 'API 密钥未配置',
      fromEmail: '发件人邮箱',
      fromEmailPlaceholder: 'noreply@company.com',
      fromName: '发件人名称',
      fromNamePlaceholder: 'IRIS Vista',
      replyTo: '回复邮箱',
      replyToPlaceholder: 'support@company.com (可选)',
      enabled: '启用邮件通知',
      enabledDesc: '触发通知时发送邮件',
      sendOnApproval: '请求已批准',
      sendOnRejection: '请求被拒绝',
      sendOnInfo: '需要更多信息',
      sendOnPurchased: '订单已购买',
      sendOnNew: '新请求',
      sendOnUrgent: '紧急请求',
      sendReminders: '发送提醒',
      testConnection: '测试连接',
      testEmailPlaceholder: '输入接收测试邮件的邮箱',
      sendTest: '发送测试邮件',
      testing: '发送中...',
      testSuccess: '测试邮件发送成功！',
      testFailed: '发送测试邮件失败',
      saveChanges: '保存邮件设置',
      saving: '保存中...',
      saveSuccess: '邮件配置已保存',
      saveFailed: '保存配置失败',
      lastTest: '上次测试',
      triggers: '邮件触发器',
      triggersDesc: '选择何时发送邮件通知',
      connection: '连接',
    },
    es: {
      title: 'Configuracion de Email',
      subtitle: 'Configura notificaciones por email via Resend',
      provider: 'Proveedor de Email',
      apiKey: 'Clave API',
      apiKeyPlaceholder: 'Ingresa tu clave API de Resend',
      apiKeySet: 'Clave API configurada',
      apiKeyNotSet: 'Clave API no configurada',
      fromEmail: 'Email de Origen',
      fromEmailPlaceholder: 'noreply@company.com',
      fromName: 'Nombre de Origen',
      fromNamePlaceholder: 'IRIS Vista',
      replyTo: 'Email de Respuesta',
      replyToPlaceholder: 'support@company.com (opcional)',
      enabled: 'Habilitar Notificaciones por Email',
      enabledDesc: 'Enviar emails cuando se generen notificaciones',
      sendOnApproval: 'Solicitud Aprobada',
      sendOnRejection: 'Solicitud Rechazada',
      sendOnInfo: 'Informacion Requerida',
      sendOnPurchased: 'Orden Comprada',
      sendOnNew: 'Nueva Solicitud',
      sendOnUrgent: 'Solicitudes Urgentes',
      sendReminders: 'Enviar Recordatorios',
      testConnection: 'Probar Conexion',
      testEmailPlaceholder: 'Ingresa email para recibir prueba',
      sendTest: 'Enviar Email de Prueba',
      testing: 'Enviando...',
      testSuccess: 'Email de prueba enviado exitosamente!',
      testFailed: 'Error al enviar email de prueba',
      saveChanges: 'Guardar Config. Email',
      saving: 'Guardando...',
      saveSuccess: 'Configuracion de email guardada',
      saveFailed: 'Error al guardar configuracion',
      lastTest: 'Ultima prueba',
      triggers: 'Disparadores de Email',
      triggersDesc: 'Elige cuando enviar notificaciones por email',
      connection: 'Conexion',
    },
  };

  const t = text[language];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await emailConfigApi.get();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load email config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (updates: Partial<EmailConfigInput>) => {
    if (config) {
      setConfig({ ...config, ...updates } as EmailConfig);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const input: EmailConfigInput = {
        from_email: config.from_email,
        from_name: config.from_name,
        reply_to_email: config.reply_to_email,
        enabled: config.enabled,
        send_on_approval: config.send_on_approval,
        send_on_rejection: config.send_on_rejection,
        send_on_info_request: config.send_on_info_request,
        send_on_purchased: config.send_on_purchased,
        send_on_new_request: config.send_on_new_request,
        send_on_urgent: config.send_on_urgent,
        send_reminders: config.send_reminders,
      };

      // Only include API key if it was changed
      if (apiKey) {
        input.api_key = apiKey;
      }

      const savedConfig = await emailConfigApi.save(input);
      setConfig(savedConfig);
      setApiKey('');
      setMessage({ type: 'success', text: t.saveSuccess });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: t.saveFailed });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return;

    setIsTesting(true);
    setMessage(null);

    try {
      await emailConfigApi.test(testEmail);
      setMessage({ type: 'success', text: t.testSuccess });
      loadConfig(); // Reload to get updated test status
    } catch (error) {
      console.error('Failed to send test email:', error);
      setMessage({ type: 'error', text: t.testFailed });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#75534B]" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-[#D1625B]" />
        <p className="mt-4 text-[#6E6B67]">Failed to load email configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E4E1DD]">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#75534B]/10">
            <Mail className="h-5 w-5 text-[#75534B]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2C2C2C]">{t.title}</h2>
            <p className="text-sm text-[#6E6B67]">{t.subtitle}</p>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 ${
              message.type === 'success'
                ? 'bg-[#4BAF7E]/10 text-[#4BAF7E]'
                : 'bg-[#D1625B]/10 text-[#D1625B]'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}
      </div>

      {/* Provider Settings */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E4E1DD]">
        <h3 className="text-sm font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
          <Key className="h-4 w-4 text-[#75534B]" />
          {t.connection}
        </h3>

        <div className="space-y-4">
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
              {t.provider}
            </label>
            <div className="px-4 py-2.5 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] text-sm text-[#6E6B67]">
              Resend
            </div>
          </div>

          {/* API Key Status */}
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
              {t.apiKey}
            </label>
            <div className="flex items-center gap-2 mb-2">
              {config.api_key_set ? (
                <span className="flex items-center gap-1 text-sm text-[#4BAF7E]">
                  <CheckCircle className="h-4 w-4" />
                  {t.apiKeySet}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-[#D1625B]">
                  <XCircle className="h-4 w-4" />
                  {t.apiKeyNotSet}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t.apiKeyPlaceholder}
                className="w-full rounded-lg border border-[#E4E1DD] px-4 py-2.5 pr-10 text-sm text-[#2C2C2C] placeholder:text-[#9E9B97] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6B67] hover:text-[#2C2C2C]"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
              {t.fromEmail}
            </label>
            <input
              type="email"
              value={config.from_email || ''}
              onChange={(e) => handleChange({ from_email: e.target.value })}
              placeholder={t.fromEmailPlaceholder}
              className="w-full rounded-lg border border-[#E4E1DD] px-4 py-2.5 text-sm text-[#2C2C2C] placeholder:text-[#9E9B97] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            />
          </div>

          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
              {t.fromName}
            </label>
            <input
              type="text"
              value={config.from_name || ''}
              onChange={(e) => handleChange({ from_name: e.target.value })}
              placeholder={t.fromNamePlaceholder}
              className="w-full rounded-lg border border-[#E4E1DD] px-4 py-2.5 text-sm text-[#2C2C2C] placeholder:text-[#9E9B97] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            />
          </div>

          {/* Reply To */}
          <div>
            <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
              {t.replyTo}
            </label>
            <input
              type="email"
              value={config.reply_to_email || ''}
              onChange={(e) => handleChange({ reply_to_email: e.target.value })}
              placeholder={t.replyToPlaceholder}
              className="w-full rounded-lg border border-[#E4E1DD] px-4 py-2.5 text-sm text-[#2C2C2C] placeholder:text-[#9E9B97] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            />
          </div>
        </div>
      </div>

      {/* Email Triggers */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E4E1DD]">
        <h3 className="text-sm font-semibold text-[#2C2C2C] mb-1 flex items-center gap-2">
          <Send className="h-4 w-4 text-[#75534B]" />
          {t.triggers}
        </h3>
        <p className="text-xs text-[#6E6B67] mb-4">{t.triggersDesc}</p>

        {/* Master Enable Toggle */}
        <div className="mb-4 p-3 rounded-lg bg-[#F9F8F6]">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-medium text-[#2C2C2C]">{t.enabled}</span>
              <p className="text-xs text-[#6E6B67]">{t.enabledDesc}</p>
            </div>
            <div
              className={`relative h-6 w-11 rounded-full transition-colors ${
                config.enabled ? 'bg-[#4BAF7E]' : 'bg-[#E4E1DD]'
              }`}
              onClick={() => handleChange({ enabled: !config.enabled })}
            >
              <div
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  config.enabled ? 'translate-x-5' : ''
                }`}
              />
            </div>
          </label>
        </div>

        {/* Individual Triggers */}
        <div className={`space-y-3 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {[
            { key: 'send_on_approval', label: t.sendOnApproval },
            { key: 'send_on_rejection', label: t.sendOnRejection },
            { key: 'send_on_info_request', label: t.sendOnInfo },
            { key: 'send_on_purchased', label: t.sendOnPurchased },
            { key: 'send_on_new_request', label: t.sendOnNew },
            { key: 'send_on_urgent', label: t.sendOnUrgent },
            { key: 'send_reminders', label: t.sendReminders },
          ].map((trigger) => (
            <label
              key={trigger.key}
              className="flex items-center justify-between cursor-pointer py-2"
            >
              <span className="text-sm text-[#2C2C2C]">{trigger.label}</span>
              <div
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  config[trigger.key as keyof EmailConfig] ? 'bg-[#75534B]' : 'bg-[#E4E1DD]'
                }`}
                onClick={() =>
                  handleChange({
                    [trigger.key]: !config[trigger.key as keyof EmailConfig],
                  } as Partial<EmailConfigInput>)
                }
              >
                <div
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    config[trigger.key as keyof EmailConfig] ? 'translate-x-4' : ''
                  }`}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Test Connection */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E4E1DD]">
        <h3 className="text-sm font-semibold text-[#2C2C2C] mb-4">{t.testConnection}</h3>

        {/* Last test status */}
        {config.last_test_at && (
          <div className="mb-4 text-sm">
            <span className="text-[#6E6B67]">{t.lastTest}: </span>
            <span className={config.last_test_success ? 'text-[#4BAF7E]' : 'text-[#D1625B]'}>
              {config.last_test_success ? 'Success' : 'Failed'}
            </span>
            <span className="text-[#9E9B97] ml-2">
              ({new Date(config.last_test_at).toLocaleString()})
            </span>
            {config.last_test_error && (
              <p className="mt-1 text-xs text-[#D1625B]">{config.last_test_error}</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder={t.testEmailPlaceholder}
            className="flex-1 rounded-lg border border-[#E4E1DD] px-4 py-2.5 text-sm text-[#2C2C2C] placeholder:text-[#9E9B97] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
          />
          <button
            onClick={handleTest}
            disabled={isTesting || !testEmail || !config.api_key_set}
            className="flex items-center gap-2 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] px-4 py-2.5 text-sm font-medium text-[#75534B] transition-all hover:bg-[#75534B] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isTesting ? t.testing : t.sendTest}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {isSaving ? t.saving : t.saveChanges}
        </button>
      </div>
    </div>
  );
}
