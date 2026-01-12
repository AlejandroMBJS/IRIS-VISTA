'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AmazonConfig {
  enabled: boolean;
  account_email: string;
  session_status: 'connected' | 'disconnected' | 'expired';
  last_verified_at?: string;
  auto_verify_minutes: number;
  notify_on_expiry: boolean;
  add_without_confirm: boolean;
  max_products_per_op: number;
  delay_between_products: number;
}

interface AmazonSectionProps {
  language: 'en' | 'zh' | 'es';
}

export function AmazonSection({ language }: AmazonSectionProps) {
  const [config, setConfig] = useState<AmazonConfig>({
    enabled: true,
    account_email: 'iamx_punchout@improaerotek.com',
    session_status: 'connected',
    last_verified_at: new Date().toISOString(),
    auto_verify_minutes: 30,
    notify_on_expiry: true,
    add_without_confirm: false,
    max_products_per_op: 10,
    delay_between_products: 2,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const text = {
    en: {
      title: 'Amazon Integration',
      subtitle: 'Configure Amazon Business integration for automated cart management',
      enableIntegration: 'Enable Integration',
      enableDescription: 'When enabled, you can add approved products directly to the Amazon Business cart.',
      connectionStatus: 'Connection Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      expired: 'Session Expired',
      account: 'Account',
      lastVerified: 'Last verified',
      verifySession: 'Verify Session',
      disconnect: 'Disconnect',
      connect: 'Connect',
      reconnect: 'Reconnect',
      credentials: 'Amazon Business Credentials',
      credentialsWarning: 'Credentials are stored encrypted on the server.',
      email: 'Amazon Business Email',
      password: 'Password',
      updateCredentials: 'Update Credentials',
      advancedOptions: 'Advanced Options',
      autoVerify: 'Auto-verify session every',
      minutes: 'minutes',
      notifyExpiry: 'Notify if session expires',
      addWithoutConfirm: 'Add to cart without confirmation (not recommended)',
      maxProducts: 'Maximum products per operation',
      delayBetween: 'Delay between products (seconds)',
      disabledMessage: 'Amazon integration is disabled. Enable it to configure settings.',
      testConnection: 'Test Connection',
      connectionSuccess: 'Connection verified successfully',
    },
    zh: {
      title: 'Amazon 集成',
      subtitle: '配置 Amazon Business 集成以自动管理购物车',
      enableIntegration: '启用集成',
      enableDescription: '启用后，您可以将已批准的产品直接添加到 Amazon Business 购物车。',
      connectionStatus: '连接状态',
      connected: '已连接',
      disconnected: '未连接',
      expired: '会话已过期',
      account: '账户',
      lastVerified: '上次验证',
      verifySession: '验证会话',
      disconnect: '断开连接',
      connect: '连接',
      reconnect: '重新连接',
      credentials: 'Amazon Business 凭据',
      credentialsWarning: '凭据已加密存储在服务器上。',
      email: 'Amazon Business 邮箱',
      password: '密码',
      updateCredentials: '更新凭据',
      advancedOptions: '高级选项',
      autoVerify: '自动验证会话间隔',
      minutes: '分钟',
      notifyExpiry: '会话过期时通知',
      addWithoutConfirm: '无需确认直接添加到购物车（不推荐）',
      maxProducts: '每次操作最大产品数',
      delayBetween: '产品之间的延迟（秒）',
      disabledMessage: 'Amazon 集成已禁用。启用它以配置设置。',
      testConnection: '测试连接',
      connectionSuccess: '连接验证成功',
    },
    es: {
      title: 'Integracion Amazon',
      subtitle: 'Configurar integracion de Amazon Business para gestion automatizada del carrito',
      enableIntegration: 'Habilitar Integracion',
      enableDescription: 'Cuando esta habilitado, puedes agregar productos aprobados directamente al carrito de Amazon Business.',
      connectionStatus: 'Estado de Conexion',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      expired: 'Sesion Expirada',
      account: 'Cuenta',
      lastVerified: 'Ultima verificacion',
      verifySession: 'Verificar Sesion',
      disconnect: 'Desconectar',
      connect: 'Conectar',
      reconnect: 'Reconectar',
      credentials: 'Credenciales de Amazon Business',
      credentialsWarning: 'Las credenciales se almacenan encriptadas en el servidor.',
      email: 'Email de Amazon Business',
      password: 'Contrasena',
      updateCredentials: 'Actualizar Credenciales',
      advancedOptions: 'Opciones Avanzadas',
      autoVerify: 'Verificar sesion automaticamente cada',
      minutes: 'minutos',
      notifyExpiry: 'Notificar si la sesion expira',
      addWithoutConfirm: 'Agregar al carrito sin confirmacion (no recomendado)',
      maxProducts: 'Maximo de productos por operacion',
      delayBetween: 'Retraso entre productos (segundos)',
      disabledMessage: 'La integracion de Amazon esta deshabilitada. Habilita para configurar.',
      testConnection: 'Probar Conexion',
      connectionSuccess: 'Conexion verificada exitosamente',
    },
  };

  const t = text[language];

  const handleToggle = () => {
    setConfig({ ...config, enabled: !config.enabled });
  };

  const handleVerifySession = async () => {
    setIsVerifying(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setConfig({ ...config, last_verified_at: new Date().toISOString() });
    setIsVerifying(false);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setConfig({ ...config, session_status: 'connected', last_verified_at: new Date().toISOString() });
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    setConfig({ ...config, session_status: 'disconnected' });
  };

  const getStatusBadge = () => {
    switch (config.session_status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {t.connected}
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t.expired}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t.disconnected}
          </Badge>
        );
    }
  };

  const formatLastVerified = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMins < 1) return language === 'zh' ? '刚刚' : language === 'es' ? 'Ahora' : 'Just now';
    if (diffMins < 60) return language === 'zh' ? `${diffMins}分钟前` : language === 'es' ? `Hace ${diffMins} min` : `${diffMins} min ago`;
    return date.toLocaleString();
  };

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
            <p className="text-sm text-[#6E6B67] mt-0.5">{t.enableDescription}</p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              config.enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                config.enabled ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {!config.enabled ? (
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
                <div className="flex items-center gap-2">
                  {config.session_status === 'connected' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVerifySession}
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2">{t.verifySession}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {t.disconnect}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="bg-[#FF9900] hover:bg-[#FF6600] text-white"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {config.session_status === 'expired' ? t.reconnect : t.connect}
                    </Button>
                  )}
                </div>
              </div>

              {config.session_status !== 'disconnected' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E4E1DD]">
                  <div>
                    <p className="text-xs text-[#6E6B67]">{t.account}</p>
                    <p className="text-sm font-medium text-[#2C2C2C]">{config.account_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6E6B67]">{t.lastVerified}</p>
                    <p className="text-sm font-medium text-[#2C2C2C] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastVerified(config.last_verified_at)}
                    </p>
                  </div>
                </div>
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
                  value={config.account_email}
                  onChange={(e) => setConfig({ ...config, account_email: e.target.value })}
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
                    placeholder="********"
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
              </div>

              <Button variant="outline" className="w-full">
                {t.updateCredentials}
              </Button>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="rounded-xl border border-[#E4E1DD] bg-white p-6">
            <h3 className="text-base font-semibold text-[#2C2C2C] mb-4">
              {t.advancedOptions}
            </h3>

            <div className="space-y-4">
              {/* Auto Verify */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6]">
                <label className="text-sm text-[#2C2C2C]">{t.autoVerify}</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={config.auto_verify_minutes}
                    onChange={(e) => setConfig({ ...config, auto_verify_minutes: parseInt(e.target.value) || 30 })}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-[#6E6B67]">{t.minutes}</span>
                </div>
              </div>

              {/* Notify on Expiry */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6]">
                <label className="text-sm text-[#2C2C2C]">{t.notifyExpiry}</label>
                <input
                  type="checkbox"
                  checked={config.notify_on_expiry}
                  onChange={(e) => setConfig({ ...config, notify_on_expiry: e.target.checked })}
                  className="rounded border-gray-300 text-[#75534B] focus:ring-[#75534B]"
                />
              </div>

              {/* Add Without Confirm */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6]">
                <label className="text-sm text-[#2C2C2C]">{t.addWithoutConfirm}</label>
                <input
                  type="checkbox"
                  checked={config.add_without_confirm}
                  onChange={(e) => setConfig({ ...config, add_without_confirm: e.target.checked })}
                  className="rounded border-gray-300 text-[#75534B] focus:ring-[#75534B]"
                />
              </div>

              {/* Max Products */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6]">
                <label className="text-sm text-[#2C2C2C]">{t.maxProducts}</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={config.max_products_per_op}
                  onChange={(e) => setConfig({ ...config, max_products_per_op: parseInt(e.target.value) || 10 })}
                  className="w-20 text-center"
                />
              </div>

              {/* Delay Between Products */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F6]">
                <label className="text-sm text-[#2C2C2C]">{t.delayBetween}</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={config.delay_between_products}
                  onChange={(e) => setConfig({ ...config, delay_between_products: parseInt(e.target.value) || 2 })}
                  className="w-20 text-center"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
