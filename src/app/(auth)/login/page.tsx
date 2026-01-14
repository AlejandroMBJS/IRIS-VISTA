'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, ChevronDown, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const text = {
    en: {
      welcomeBack: 'Welcome back',
      signInToContinue: 'Sign in to your account to continue',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      loginError: 'Invalid email or password',
      pendingError: 'Your account is awaiting admin approval. Please wait for confirmation.',
      rejectedError: 'Your registration was rejected. Please contact the administrator.',
      disabledError: 'Your account has been disabled. Please contact the administrator.',
      noAccount: "Don't have an account?",
      register: 'Register',
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
    },
    zh: {
      welcomeBack: '欢迎回来',
      signInToContinue: '登录您的账户以继续',
      email: '邮箱',
      emailPlaceholder: '输入您的邮箱',
      password: '密码',
      passwordPlaceholder: '输入您的密码',
      signIn: '登录',
      signingIn: '登录中...',
      loginError: '邮箱或密码错误',
      pendingError: '您的账户正在等待管理员审批，请耐心等待确认。',
      rejectedError: '您的注册申请已被拒绝，请联系管理员。',
      disabledError: '您的账户已被禁用，请联系管理员。',
      noAccount: '还没有账户？',
      register: '注册',
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
    },
    es: {
      welcomeBack: 'Bienvenido de nuevo',
      signInToContinue: 'Inicie sesión en su cuenta para continuar',
      email: 'Correo Electrónico',
      emailPlaceholder: 'Ingrese su correo electrónico',
      password: 'Contraseña',
      passwordPlaceholder: 'Ingrese su contraseña',
      signIn: 'Iniciar Sesión',
      signingIn: 'Iniciando sesión...',
      loginError: 'Correo electrónico o contraseña inválidos',
      pendingError: 'Su cuenta está pendiente de aprobación. Por favor espere la confirmación.',
      rejectedError: 'Su registro fue rechazado. Por favor contacte al administrador.',
      disabledError: 'Su cuenta ha sido deshabilitada. Por favor contacte al administrador.',
      noAccount: '¿No tiene cuenta?',
      register: 'Registrarse',
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
    },
  };

  const t = text[language];

  const languageLabels = {
    en: 'EN',
    zh: '中文',
    es: 'ES',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setIsLoading(true);

    try {
      await login({ email, password });
      router.push('/');
    } catch (err: unknown) {
      // Check for specific error codes from the API
      const apiError = err as { response?: { data?: { code?: string } } };
      const code = apiError?.response?.data?.code;
      setErrorCode(code || '');

      if (code === 'PENDING_APPROVAL') {
        setError(t.pendingError);
      } else if (code === 'REJECTED') {
        setError(t.rejectedError);
      } else if (code === 'DISABLED') {
        setError(t.disabledError);
      } else {
        setError(t.loginError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 rounded-xl border border-[#ABC0B9] bg-white px-3 py-2 text-sm text-[#5C2F0E] transition-all duration-200 hover:border-[#5C2F0E] hover:bg-[#FAFBFA] active:scale-95"
          >
            <Globe className="h-4 w-4" />
            <span style={{ fontWeight: 500 }}>{languageLabels[language]}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-12 w-48 rounded-xl bg-white shadow-lg border border-[#ABC0B9] overflow-hidden z-50">
              {Object.entries(t.languages).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setLanguage(key as 'en' | 'zh' | 'es');
                    setShowLangMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                    language === key
                      ? 'bg-[#5C2F0E]/10 text-[#5C2F0E]'
                      : 'text-[#2D363F] hover:bg-[#FAFBFA]'
                  }`}
                  style={{ fontWeight: language === key ? 600 : 400 }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#5C2F0E] to-[#2D363F] shadow-lg mb-4">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
          <span
            className="relative text-2xl text-white"
            style={{ fontWeight: 700 }}
          >
            IRIS
          </span>
        </div>
        <h1
          className="text-2xl text-[#2D363F]"
          style={{ fontWeight: 600, letterSpacing: '-0.02em' }}
        >
          VISTA
        </h1>
        <p className="text-sm text-[#5C2F0E]">Supply Chain & Procurement</p>
      </div>

      {/* Login Form */}
      <div className="rounded-2xl bg-white p-8 shadow-lg border border-[#ABC0B9]">
        <div className="text-center mb-6">
          <h2
            className="text-xl text-[#2D363F] mb-1"
            style={{ fontWeight: 600 }}
          >
            {t.welcomeBack}
          </h2>
          <p className="text-sm text-[#4E616F]">{t.signInToContinue}</p>
        </div>

        {error && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${
            errorCode === 'PENDING_APPROVAL'
              ? 'bg-[#F38756]/20 border border-amber-200 text-[#E95F20]'
              : 'bg-[#AA2F0D]/10 border border-[#AA2F0D]-200 text-[#AA2F0D]'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#2D363F] mb-1.5"
            >
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 text-sm text-[#2D363F] transition-all placeholder:text-[#4E616F] focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#2D363F] mb-1.5"
            >
              {t.password}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-[#ABC0B9] bg-white px-4 py-3 pr-12 text-sm text-[#2D363F] transition-all placeholder:text-[#4E616F] focus:border-[#5C2F0E] focus:outline-none focus:ring-2 focus:ring-[#5C2F0E]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4E616F] hover:text-[#2D363F] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-[#5C2F0E] to-[#2D363F] px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.signingIn}
              </>
            ) : (
              t.signIn
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 pt-4 border-t border-[#ABC0B9] text-center">
          <p className="text-sm text-[#4E616F]">
            {t.noAccount}{' '}
            <Link
              href="/register"
              className="text-[#5C2F0E] font-medium hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t.register}
            </Link>
          </p>
        </div>
      </div>

      {/* Demo credentials hint */}
      <div className="mt-4 rounded-lg bg-white/50 p-4 text-center text-xs text-[#4E616F] border border-[#ABC0B9]/50">
        <p className="font-medium mb-1">Demo Account:</p>
        <p>Email: admin@vista.com / Password: admin123</p>
      </div>
    </div>
  );
}
