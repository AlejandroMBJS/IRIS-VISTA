'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Power,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Link2,
  Clock,
  Shield,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { amazonConfigApi, type AmazonConfig } from '@/lib/api';

interface AmazonSectionProps {
  language: 'en' | 'zh' | 'es';
}

export function AmazonSection({ language }: AmazonSectionProps) {
  const [config, setConfig] = useState<AmazonConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [marketplace, setMarketplace] = useState('www.amazon.com.mx');
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const text = {
    en: {
      title: 'Amazon Integration',
      subtitle: 'Configure Amazon Business integration for automated cart management',
      enableIntegration: 'Enable Integration',
      enableDescription: 'When enabled, approved products will be automatically added to the Amazon Business cart. When disabled, you can manually open product URLs and mark them as purchased.',
      connectionStatus: 'Connection Status',
      connected: 'Connected',
      disconnected: 'Not Configured',
      lastTested: 'Last tested',
      testConnection: 'Test Connection',
      testing: 'Testing...',
      credentials: 'Amazon Business Credentials',
      credentialsWarning: 'Credentials are stored encrypted on the server.',
      email: 'Amazon Business Email',
      password: 'Password',
      passwordPlaceholder: 'Enter new password to update',
      marketplace: 'Marketplace',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      disabledMessage: 'Amazon integration is disabled. When disabled, you can manually open product URLs and mark orders as purchased.',
      configuredMessage: 'Amazon is configured. Test the connection to verify credentials.',
      notConfigured: 'Amazon is not configured. Enter your credentials below.',
      saveSuccess: 'Amazon configuration saved successfully',
      saveFailed: 'Failed to save configuration',
      testSuccess: 'Connection test successful',
      testFailed: 'Connection test failed',
      loadError: 'Failed to load configuration',
    },
    zh: {
      title: 'Amazon 集成',
      subtitle: '配置 Amazon Business 集成以自动管理购物车',
      enableIntegration: '启用集成',
      enableDescription: '启用后，已批准的产品将自动添加到 Amazon Business 购物车。禁用时，您可以手动打开产品链接并标记为已购买。',
      connectionStatus: '连接状态',
      connected: '已连接',
      disconnected: '未配置',
      lastTested: '上次测试',
      testConnection: '测试连接',
      testing: '测试中...',
      credentials: 'Amazon Business 凭据',
      credentialsWarning: '凭据已加密存储在服务器上。',
      email: 'Amazon Business 邮箱',
      password: '密码',
      passwordPlaceholder: '输入新密码以更新',
      marketplace: '市场',
      saveChanges: '保存更改',
      saving: '保存中...',
      disabledMessage: 'Amazon 集成已禁用。禁用时，您可以手动打开产品链接并标记订单为已购买。',
      configuredMessage: 'Amazon 已配置。测试连接以验证凭据。',
      notConfigured: 'Amazon 未配置。请在下方输入您的凭据。',
      saveSuccess: 'Amazon 配置保存成功',
      saveFailed: '保存配置失败',
      testSuccess: '连接测试成功',
      testFailed: '连接测试失败',
      loadError: '加载配置失败',
    },
    es: {
      title: 'Integracion Amazon',
      subtitle: 'Configurar integracion de Amazon Business para gestion automatizada del carrito',
      enableIntegration: 'Habilitar Integracion',
      enableDescription: 'Cuando esta habilitado, los productos aprobados se agregaran automaticamente al carrito de Amazon Business. Cuando esta deshabilitado, puedes abrir manualmente las URLs de productos y marcarlos como comprados.',
      connectionStatus: 'Estado de Conexion',
      connected: 'Conectado',
      disconnected: 'No Configurado',
      lastTested: 'Ultima prueba',
      testConnection: 'Probar Conexion',
      testing: 'Probando...',
      credentials: 'Credenciales de Amazon Business',
      credentialsWarning: 'Las credenciales se almacenan encriptadas en el servidor.',
      email: 'Email de Amazon Business',
      password: 'Contrasena',
      passwordPlaceholder: 'Ingresa nueva contrasena para actualizar',
      marketplace: 'Marketplace',
      saveChanges: 'Guardar Cambios',
      saving: 'Guardando...',
      disabledMessage: 'La integracion de Amazon esta deshabilitada. Cuando esta deshabilitada, puedes abrir manualmente las URLs de productos y marcar ordenes como compradas.',
      configuredMessage: 'Amazon esta configurado. Prueba la conexion para verificar las credenciales.',
      notConfigured: 'Amazon no esta configurado. Ingresa tus credenciales abajo.',
      saveSuccess: 'Configuracion de Amazon guardada exitosamente',
      saveFailed: 'Error al guardar la configuracion',
      testSuccess: 'Prueba de conexion exitosa',
      testFailed: 'Prueba de conexion fallida',
      loadError: 'Error al cargar la configuracion',
    },
  };

  const t = text[language];

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await amazonConfigApi.get();
      setConfig(data);
      setEmail(data.email || '');
      setMarketplace(data.marketplace || 'www.amazon.com.mx');
      setIsActive(data.is_active);
      setPassword(''); // Never show existing password
    } catch (error) {
      console.error('Failed to fetch Amazon config:', error);
      // Set defaults for empty config
      setConfig({
        id: 0,
        email: '',
        marketplace: 'www.amazon.com.mx',
        has_password: false,
        is_active: false,
        test_status: '',
        test_message: '',
        created_at: '',
        updated_at: '',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Track changes
  useEffect(() => {
    if (config) {
      const emailChanged = email !== (config.email || '');
      const marketplaceChanged = marketplace !== (config.marketplace || 'www.amazon.com.mx');
      const activeChanged = isActive !== config.is_active;
      const passwordChanged = password.length > 0;
      setHasChanges(emailChanged || marketplaceChanged || activeChanged || passwordChanged);
    }
  }, [config, email, marketplace, isActive, password]);

  const handleSave = async () => {
    // Email is required only if enabling the integration
    if (isActive && !email) {
      setMessage({ type: 'error', text: 'Email is required' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const data: { email: string; marketplace?: string; is_active?: boolean; password?: string } = {
        email: email || config?.email || '',
        marketplace,
        is_active: isActive,
      };

      // Only send password if it was changed
      if (password.length > 0) {
        data.password = password;
      }

      const savedConfig = await amazonConfigApi.save(data);
      setConfig(savedConfig);
      setPassword(''); // Clear password field after save
      setHasChanges(false);
      setMessage({ type: 'success', text: t.saveSuccess });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save Amazon config:', error);
      setMessage({ type: 'error', text: t.saveFailed });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      const result = await amazonConfigApi.test();
      if (result.status === 'success') {
        setMessage({ type: 'success', text: t.testSuccess });
        // Refresh config to get updated test status
        fetchConfig();
      } else {
        setMessage({ type: 'error', text: `${t.testFailed}: ${result.message}` });
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      setMessage({ type: 'error', text: t.testFailed });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const formatLastTested = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMins < 1) return language === 'zh' ? '刚刚' : language === 'es' ? 'Ahora' : 'Just now';
    if (diffMins < 60) return language === 'zh' ? `${diffMins}分钟前` : language === 'es' ? `Hace ${diffMins} min` : `${diffMins} min ago`;
    if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return language === 'zh' ? `${hours}小时前` : language === 'es' ? `Hace ${hours}h` : `${hours}h ago`;
    }
    return date.toLocaleString();
  };

  const getStatusBadge = () => {
    if (!config?.has_password) {
      return (
        <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          {t.disconnected}
        </Badge>
      );
    }

    if (config.test_status === 'success') {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {t.connected}
        </Badge>
      );
    }

    if (config.test_status === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          {t.testFailed}
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {language === 'zh' ? '未测试' : language === 'es' ? 'No probado' : 'Not tested'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#6E6B67]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable Toggle Card */}
      <div className="rounded-xl border border-[#E4E1DD] bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9900] to-[#FF6600]">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#2C2C2C]">{t.title}</h2>
              <p className="text-sm text-[#6E6B67] mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between p-4 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD]">
          <div>
            <p className="font-medium text-[#2C2C2C]">{t.enableIntegration}</p>
            <p className="text-sm text-[#6E6B67] mt-0.5 max-w-lg">{t.enableDescription}</p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                isActive ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
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
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Save button - always visible when there are changes */}
        {hasChanges && (
          <div className="mt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-[#75534B] to-[#5D423C] hover:opacity-90"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? t.saving : t.saveChanges}
            </Button>
          </div>
        )}
      </div>

      {!isActive ? (
        <div className="rounded-xl border border-[#E4E1DD] bg-white p-8 text-center">
          <Power className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-4 text-[#6E6B67]">{t.disabledMessage}</p>
        </div>
      ) : (
        <>
          {/* Connection Status */}
          <div className="rounded-xl border border-[#E4E1DD] bg-white p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C] mb-4">
              <Link2 className="h-5 w-5" />
              {t.connectionStatus}
            </h3>

            <div className="p-4 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={isTesting || !config?.has_password}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">{isTesting ? t.testing : t.testConnection}</span>
                </Button>
              </div>

              {config?.has_password && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E4E1DD]">
                  <div>
                    <p className="text-xs text-[#6E6B67]">{t.email}</p>
                    <p className="text-sm font-medium text-[#2C2C2C]">{config.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6E6B67]">{t.lastTested}</p>
                    <p className="text-sm font-medium text-[#2C2C2C] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastTested(config.last_test_at)}
                    </p>
                  </div>
                  {config.test_message && (
                    <div className="col-span-2">
                      <p className="text-xs text-[#6E6B67]">Status</p>
                      <p className={`text-sm ${config.test_status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {config.test_message}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!config?.has_password && (
                <p className="text-sm text-[#6E6B67]">{t.notConfigured}</p>
              )}
            </div>
          </div>

          {/* Credentials */}
          <div className="rounded-xl border border-[#E4E1DD] bg-white p-6">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C] mb-2">
              <Shield className="h-5 w-5" />
              {t.credentials}
            </h3>
            <p className="text-sm text-[#6E6B67] mb-4 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {t.credentialsWarning}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                  {t.email}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@amazon.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                  {t.password}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={config?.has_password ? t.passwordPlaceholder : '********'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {config?.has_password && (
                  <p className="text-xs text-[#6E6B67] mt-1">
                    {language === 'zh' ? '留空以保留现有密码' : language === 'es' ? 'Dejar en blanco para mantener la contrasena actual' : 'Leave blank to keep existing password'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                  {t.marketplace}
                </label>
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E4E1DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75534B]"
                >
                  <option value="www.amazon.com.mx">Amazon Mexico (amazon.com.mx)</option>
                  <option value="www.amazon.com">Amazon US (amazon.com)</option>
                  <option value="www.amazon.es">Amazon Spain (amazon.es)</option>
                </select>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="w-full bg-gradient-to-r from-[#75534B] to-[#5D423C] hover:opacity-90"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? t.saving : t.saveChanges}
              </Button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
