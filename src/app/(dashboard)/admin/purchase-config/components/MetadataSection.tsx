'use client';

import { useState } from 'react';
import { Link2, Loader2, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { PurchaseConfig, ProductMetadata } from '@/types';

// Format price to show all significant decimals (minimum 2)
const formatPrice = (price: number): string => {
  const priceStr = price.toString();
  const decimalIndex = priceStr.indexOf('.');
  if (decimalIndex === -1) {
    return price.toFixed(2);
  }
  const decimals = priceStr.length - decimalIndex - 1;
  return price.toFixed(Math.max(2, decimals));
};

interface Props {
  config: PurchaseConfig;
  onChange: (updates: Partial<PurchaseConfig>) => void;
  language: 'en' | 'zh' | 'es';
}

export function MetadataSection({ config, onChange, language }: Props) {
  const [testUrl, setTestUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ProductMetadata | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const text = {
    en: {
      title: 'Metadata Extraction',
      subtitle: 'Configure how product information is extracted from URLs',
      timeout: 'Extraction timeout',
      timeoutSuffix: 'seconds',
      allowManualEdit: 'Allow manual editing if extraction fails',
      allowManualEditDesc: 'Users can manually enter product information when automatic extraction fails',
      cacheEnabled: 'Cache metadata',
      cacheEnabledDesc: 'Avoid repeated requests by caching extracted metadata',
      cacheDuration: 'Cache duration',
      cacheDurationSuffix: 'hours',
      customUserAgent: 'Custom User-Agent (optional)',
      customUserAgentPlaceholder: 'Mozilla/5.0 (compatible; CompanyBot/1.0)',
      allowedDomains: 'Allowed domains (one per line, empty = all)',
      allowedDomainsPlaceholder: 'amazon.com.mx\namazon.com\nmercadolibre.com.mx',
      allowedDomainsHelp: 'If specified, only URLs from these domains will be allowed. Leave empty to allow any URL.',
      blockedDomains: 'Blocked domains (one per line)',
      blockedDomainsPlaceholder: 'aliexpress.com\nwish.com',
      testExtraction: 'Test Extraction',
      testUrlPlaceholder: 'Enter a URL to test...',
      test: 'Test',
      testing: 'Testing...',
      testSuccess: 'Extraction successful',
      testFailed: 'Extraction failed',
    },
    zh: {
      title: '元数据提取',
      subtitle: '配置如何从URL提取产品信息',
      timeout: '提取超时',
      timeoutSuffix: '秒',
      allowManualEdit: '提取失败时允许手动编辑',
      allowManualEditDesc: '当自动提取失败时，用户可以手动输入产品信息',
      cacheEnabled: '缓存元数据',
      cacheEnabledDesc: '通过缓存提取的元数据避免重复请求',
      cacheDuration: '缓存时长',
      cacheDurationSuffix: '小时',
      customUserAgent: '自定义 User-Agent（可选）',
      customUserAgentPlaceholder: 'Mozilla/5.0 (compatible; CompanyBot/1.0)',
      allowedDomains: '允许的域名（每行一个，空=全部）',
      allowedDomainsPlaceholder: 'amazon.com.mx\namazon.com\nmercadolibre.com.mx',
      allowedDomainsHelp: '如果指定，只允许来自这些域名的URL。留空则允许任何URL。',
      blockedDomains: '阻止的域名（每行一个）',
      blockedDomainsPlaceholder: 'aliexpress.com\nwish.com',
      testExtraction: '测试提取',
      testUrlPlaceholder: '输入URL进行测试...',
      test: '测试',
      testing: '测试中...',
      testSuccess: '提取成功',
      testFailed: '提取失败',
    },
    es: {
      title: 'Extraccion de Metadata',
      subtitle: 'Configura como se extrae la informacion del producto desde URLs',
      timeout: 'Timeout de extraccion',
      timeoutSuffix: 'segundos',
      allowManualEdit: 'Permitir edicion manual si falla la extraccion',
      allowManualEditDesc: 'Los usuarios pueden ingresar la informacion del producto manualmente cuando falla la extraccion automatica',
      cacheEnabled: 'Cachear metadata',
      cacheEnabledDesc: 'Evita solicitudes repetidas cacheando la metadata extraida',
      cacheDuration: 'Duracion del cache',
      cacheDurationSuffix: 'horas',
      customUserAgent: 'User-Agent personalizado (opcional)',
      customUserAgentPlaceholder: 'Mozilla/5.0 (compatible; CompanyBot/1.0)',
      allowedDomains: 'Dominios permitidos (uno por linea, vacio = todos)',
      allowedDomainsPlaceholder: 'amazon.com.mx\namazon.com\nmercadolibre.com.mx',
      allowedDomainsHelp: 'Si se especifican, solo se permitiran URLs de estos dominios. Dejar vacio para permitir cualquier URL.',
      blockedDomains: 'Dominios bloqueados (uno por linea)',
      blockedDomainsPlaceholder: 'aliexpress.com\nwish.com',
      testExtraction: 'Probar Extraccion',
      testUrlPlaceholder: 'Ingresa una URL para probar...',
      test: 'Probar',
      testing: 'Probando...',
      testSuccess: 'Extraccion exitosa',
      testFailed: 'Extraccion fallida',
    },
  };

  const t = text[language];

  const handleTest = async () => {
    if (!testUrl) return;

    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const result = await adminApi.testMetadataExtraction(testUrl);
      setTestResult(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestError(errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const allowedDomainsText = config.allowed_domains?.join('\n') || '';
  const blockedDomainsText = config.blocked_domains?.join('\n') || '';

  return (
    <div className="rounded-xl border border-[#ABC0B9] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#ABC0B9] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5C2F0E]/10">
            <Link2 className="h-5 w-5 text-[#5C2F0E]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D363F]">{t.title}</h2>
            <p className="text-sm text-[#4E616F]">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Timeout and Cache Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#2D363F]">
              {t.timeout}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={60}
                value={config.extraction_timeout_seconds}
                onChange={(e) => onChange({ extraction_timeout_seconds: parseInt(e.target.value) || 10 })}
                className="w-24 rounded-lg border border-[#ABC0B9] bg-white px-4 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
              />
              <span className="text-sm text-[#4E616F]">{t.timeoutSuffix}</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#2D363F]">
              {t.cacheDuration}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={168}
                value={config.cache_duration_hours}
                onChange={(e) => onChange({ cache_duration_hours: parseInt(e.target.value) || 24 })}
                className="w-24 rounded-lg border border-[#ABC0B9] bg-white px-4 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
              />
              <span className="text-sm text-[#4E616F]">{t.cacheDurationSuffix}</span>
            </div>
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-4">
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={config.allow_manual_edit}
                onChange={(e) => onChange({ allow_manual_edit: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#ABC0B9] peer-checked:bg-[#5C2F0E] transition-colors" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1">
              <span className="block text-sm font-medium text-[#2D363F]">{t.allowManualEdit}</span>
              <span className="block text-sm text-[#4E616F]">{t.allowManualEditDesc}</span>
            </div>
          </label>

          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={config.cache_enabled}
                onChange={(e) => onChange({ cache_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#ABC0B9] peer-checked:bg-[#5C2F0E] transition-colors" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <div className="flex-1">
              <span className="block text-sm font-medium text-[#2D363F]">{t.cacheEnabled}</span>
              <span className="block text-sm text-[#4E616F]">{t.cacheEnabledDesc}</span>
            </div>
          </label>
        </div>

        {/* Custom User Agent */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#2D363F]">
            {t.customUserAgent}
          </label>
          <input
            type="text"
            value={config.custom_user_agent}
            onChange={(e) => onChange({ custom_user_agent: e.target.value })}
            placeholder={t.customUserAgentPlaceholder}
            className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
          />
        </div>

        {/* Domain Lists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <label className="text-sm font-medium text-[#2D363F]">{t.allowedDomains}</label>
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-[#4E616F] cursor-help" />
                <div className="absolute left-0 top-6 z-10 hidden w-64 rounded-lg bg-[#2D363F] p-3 text-xs text-white shadow-lg group-hover:block">
                  {t.allowedDomainsHelp}
                </div>
              </div>
            </div>
            <textarea
              value={allowedDomainsText}
              onChange={(e) => onChange({
                allowed_domains: e.target.value.split('\n').filter(d => d.trim())
              })}
              placeholder={t.allowedDomainsPlaceholder}
              rows={5}
              className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] font-mono transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20 resize-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#2D363F]">
              {t.blockedDomains}
            </label>
            <textarea
              value={blockedDomainsText}
              onChange={(e) => onChange({
                blocked_domains: e.target.value.split('\n').filter(d => d.trim())
              })}
              placeholder={t.blockedDomainsPlaceholder}
              rows={5}
              className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] font-mono transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20 resize-none"
            />
          </div>
        </div>

        {/* Test Extraction */}
        <div className="border-t border-[#ABC0B9] pt-6">
          <h3 className="mb-4 text-sm font-semibold text-[#2D363F]">{t.testExtraction}</h3>
          <div className="flex gap-2">
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder={t.testUrlPlaceholder}
              className="flex-1 rounded-lg border border-[#ABC0B9] bg-white px-4 py-2 text-sm text-[#2D363F] transition-all focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
            />
            <button
              onClick={handleTest}
              disabled={isTesting || !testUrl}
              className="flex items-center gap-2 rounded-lg bg-[#5C2F0E] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5C2F0E]/90 disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {isTesting ? t.testing : t.test}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="mt-4 rounded-lg border border-[#5C2F0E]/30 bg-[#5C2F0E]/5 p-4">
              <div className="flex items-center gap-2 text-[#5C2F0E] mb-3">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">{t.testSuccess}</span>
              </div>
              <div className="flex gap-4">
                {testResult.image_url && (
                  <img
                    src={testResult.image_url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover border border-[#ABC0B9]"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D363F] truncate">{testResult.title}</p>
                  <p className="text-xs text-[#4E616F] mt-1 line-clamp-2">{testResult.description}</p>
                  {testResult.price && (
                    <p className="text-sm font-semibold text-[#5C2F0E] mt-2">
                      {testResult.currency} ${formatPrice(testResult.price)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {testError && (
            <div className="mt-4 rounded-lg border border-[#AA2F0D]/30 bg-[#AA2F0D]/5 p-4">
              <div className="flex items-center gap-2 text-[#AA2F0D]">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{t.testFailed}</span>
              </div>
              <p className="mt-2 text-xs text-[#4E616F]">{testError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
