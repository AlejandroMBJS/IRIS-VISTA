'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Save,
  Loader2,
  Settings,
  Link2,
  CheckSquare,
  Bell,
  FormInput,
  LayoutGrid,
  AlertCircle,
  Check,
  Mail,
  Package,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import type { PurchaseConfig, UserBasic } from '@/types';

// Import section components
import { GeneralSection } from './components/GeneralSection';
import { MetadataSection } from './components/MetadataSection';
import { ApprovalSection } from './components/ApprovalSection';
import { NotificationsSection } from './components/NotificationsSection';
import { FormFieldsSection } from './components/FormFieldsSection';
import { AdminPanelSection } from './components/AdminPanelSection';
import { EmailSection } from './components/EmailSection';
import { AmazonSection } from './components/AmazonSection';

type TabId = 'general' | 'metadata' | 'approval' | 'notifications' | 'email' | 'amazon' | 'formFields' | 'adminPanel';

interface Tab {
  id: TabId;
  labelKey: string;
  icon: typeof Settings;
}

const TABS: Tab[] = [
  { id: 'general', labelKey: 'general', icon: Settings },
  { id: 'metadata', labelKey: 'metadata', icon: Link2 },
  { id: 'approval', labelKey: 'approval', icon: CheckSquare },
  { id: 'notifications', labelKey: 'notifications', icon: Bell },
  { id: 'email', labelKey: 'email', icon: Mail },
  { id: 'amazon', labelKey: 'amazon', icon: Package },
  { id: 'formFields', labelKey: 'formFields', icon: FormInput },
  { id: 'adminPanel', labelKey: 'adminPanel', icon: LayoutGrid },
];

export default function PurchaseConfigPage() {
  const { language } = useLanguage();
  const [config, setConfig] = useState<PurchaseConfig | null>(null);
  const [approvers, setApprovers] = useState<UserBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [originalConfig, setOriginalConfig] = useState<PurchaseConfig | null>(null);

  const text = {
    en: {
      title: 'Purchase Settings',
      subtitle: 'Configure the purchase request module',
      general: 'General',
      metadata: 'Metadata',
      approval: 'Approval',
      notifications: 'Notifications',
      email: 'Email',
      amazon: 'Amazon',
      formFields: 'Form Fields',
      adminPanel: 'Admin Panel',
      save: 'Save Changes',
      saving: 'Saving...',
      saveSuccess: 'Configuration saved successfully',
      saveFailed: 'Failed to save configuration',
      unsavedChanges: 'You have unsaved changes',
      loadError: 'Failed to load configuration',
    },
    zh: {
      title: '采购设置',
      subtitle: '配置采购请求模块',
      general: '常规',
      metadata: '元数据',
      approval: '审批',
      notifications: '通知',
      email: '邮件',
      amazon: '亚马逊',
      formFields: '表单字段',
      adminPanel: '管理面板',
      save: '保存更改',
      saving: '保存中...',
      saveSuccess: '配置保存成功',
      saveFailed: '保存配置失败',
      unsavedChanges: '您有未保存的更改',
      loadError: '加载配置失败',
    },
    es: {
      title: 'Configuracion de Compras',
      subtitle: 'Configurar el modulo de solicitudes de compra',
      general: 'General',
      metadata: 'Metadata',
      approval: 'Aprobacion',
      notifications: 'Notificaciones',
      email: 'Email',
      amazon: 'Amazon',
      formFields: 'Campos',
      adminPanel: 'Panel Admin',
      save: 'Guardar Cambios',
      saving: 'Guardando...',
      saveSuccess: 'Configuracion guardada exitosamente',
      saveFailed: 'Error al guardar la configuracion',
      unsavedChanges: 'Tienes cambios sin guardar',
      loadError: 'Error al cargar la configuracion',
    },
  };

  const t = text[language];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configData, approversData] = await Promise.all([
        adminApi.getPurchaseConfig(),
        adminApi.getApprovers(),
      ]);
      setConfig(configData);
      setOriginalConfig(JSON.parse(JSON.stringify(configData)));
      setApprovers(approversData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: t.loadError });
    } finally {
      setIsLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (config && originalConfig) {
      const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasChanges(changed);
    }
  }, [config, originalConfig]);

  const handleConfigChange = (updates: Partial<PurchaseConfig>) => {
    if (config) {
      setConfig({ ...config, ...updates });
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const savedConfig = await adminApi.savePurchaseConfig(config);
      setConfig(savedConfig);
      setOriginalConfig(JSON.parse(JSON.stringify(savedConfig)));
      setHasChanges(false);
      setMessage({ type: 'success', text: t.saveSuccess });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: t.saveFailed });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6]">
        <div className="flex items-center gap-3 text-[#6E6B67]">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-[#D1625B]" />
          <p className="mt-4 text-[#6E6B67]">{t.loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <div className="border-b border-[#E4E1DD] bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E08A4B] to-[#D47A3B]">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2C2C2C]">{t.title}</h1>
              <p className="text-sm text-[#6E6B67]">{t.subtitle}</p>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4">
            {hasChanges && (
              <div className="flex items-center gap-2 text-[#E08A4B]">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{t.unsavedChanges}</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? t.saving : t.save}
            </button>
          </div>
        </div>

        {/* Message */}
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

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#75534B] text-white'
                    : 'text-[#6E6B67] hover:bg-[#E4E1DD]/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t[tab.labelKey as keyof typeof t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="mx-auto max-w-4xl">
          {activeTab === 'general' && (
            <GeneralSection
              config={config}
              onChange={handleConfigChange}
              language={language}
            />
          )}
          {activeTab === 'metadata' && (
            <MetadataSection
              config={config}
              onChange={handleConfigChange}
              language={language}
            />
          )}
          {activeTab === 'approval' && (
            <ApprovalSection
              config={config}
              onChange={handleConfigChange}
              approvers={approvers}
              language={language}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsSection
              config={config}
              onChange={handleConfigChange}
              language={language}
            />
          )}
          {activeTab === 'email' && (
            <EmailSection language={language} />
          )}
          {activeTab === 'amazon' && (
            <AmazonSection language={language} />
          )}
          {activeTab === 'formFields' && (
            <FormFieldsSection
              config={config}
              onChange={handleConfigChange}
              language={language}
            />
          )}
          {activeTab === 'adminPanel' && (
            <AdminPanelSection
              config={config}
              onChange={handleConfigChange}
              language={language}
            />
          )}
        </div>
      </div>
    </div>
  );
}
