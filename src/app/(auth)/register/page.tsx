'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { authApi } from '@/lib/api';
import {
  Globe,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function RegisterPage() {
  const { language, setLanguage } = useLanguage();
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const text = {
    en: {
      createAccount: 'Create Account',
      registerToContinue: 'Register to request access to IRIS VISTA',
      employeeNumber: 'Employee Number',
      employeeNumberPlaceholder: 'Your employee number',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      email: 'Email',
      emailPlaceholder: 'your.email@company.com',
      password: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter your password',
      register: 'Register',
      registering: 'Registering...',
      haveAccount: 'Already have an account?',
      signIn: 'Sign In',
      passwordMismatch: 'Passwords do not match',
      employeeNumberExists: 'This employee number is already registered',
      emailExists: 'This email is already registered',
      registrationFailed: 'Registration failed. Please try again.',
      successTitle: 'Registration Successful!',
      successMessage: 'Your account has been created and is pending admin approval.',
      successNote: 'You will be able to log in once an administrator approves your account.',
      backToLogin: 'Back to Login',
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
    },
    zh: {
      createAccount: '创建账户',
      registerToContinue: '注册以申请访问 IRIS VISTA',
      employeeNumber: '员工编号',
      employeeNumberPlaceholder: '您的员工编号',
      fullName: '姓名',
      fullNamePlaceholder: '输入您的姓名',
      email: '邮箱',
      emailPlaceholder: 'your.email@company.com',
      password: '密码',
      passwordPlaceholder: '至少8个字符',
      confirmPassword: '确认密码',
      confirmPasswordPlaceholder: '再次输入您的密码',
      register: '注册',
      registering: '注册中...',
      haveAccount: '已有账户？',
      signIn: '登录',
      passwordMismatch: '密码不匹配',
      employeeNumberExists: '此员工编号已注册',
      emailExists: '此邮箱已注册',
      registrationFailed: '注册失败，请重试。',
      successTitle: '注册成功！',
      successMessage: '您的账户已创建，正在等待管理员审批。',
      successNote: '管理员审批后您即可登录。',
      backToLogin: '返回登录',
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
    },
    es: {
      createAccount: 'Crear Cuenta',
      registerToContinue: 'Regístrese para solicitar acceso a IRIS VISTA',
      employeeNumber: 'Número de Empleado',
      employeeNumberPlaceholder: 'Su número de empleado',
      fullName: 'Nombre Completo',
      fullNamePlaceholder: 'Ingrese su nombre completo',
      email: 'Correo Electrónico',
      emailPlaceholder: 'su.correo@empresa.com',
      password: 'Contraseña',
      passwordPlaceholder: 'Al menos 8 caracteres',
      confirmPassword: 'Confirmar Contraseña',
      confirmPasswordPlaceholder: 'Vuelva a ingresar su contraseña',
      register: 'Registrarse',
      registering: 'Registrando...',
      haveAccount: '¿Ya tiene cuenta?',
      signIn: 'Iniciar Sesión',
      passwordMismatch: 'Las contraseñas no coinciden',
      employeeNumberExists: 'Este número de empleado ya está registrado',
      emailExists: 'Este correo ya está registrado',
      registrationFailed: 'Registro fallido. Por favor intente de nuevo.',
      successTitle: '¡Registro Exitoso!',
      successMessage: 'Su cuenta ha sido creada y está pendiente de aprobación.',
      successNote: 'Podrá iniciar sesión una vez que un administrador apruebe su cuenta.',
      backToLogin: 'Volver al Inicio de Sesión',
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
    setFieldError(null);

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({
        employee_number: employeeNumber,
        name,
        email,
        password,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { field?: string; error?: string } } };
      const field = apiError?.response?.data?.field;

      if (field === 'employee_number') {
        setError(t.employeeNumberExists);
        setFieldError('employee_number');
      } else if (field === 'email') {
        setError(t.emailExists);
        setFieldError('email');
      } else {
        setError(t.registrationFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#75534B] to-[#5D423C] shadow-lg mb-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
            <span className="relative text-2xl text-white" style={{ fontWeight: 700 }}>
              IRIS
            </span>
          </div>
          <h1 className="text-2xl text-[#2C2C2C]" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
            VISTA
          </h1>
          <p className="text-sm text-[#75534B]">Supply Chain & Procurement</p>
        </div>

        {/* Success Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-[#E4E1DD]">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl text-[#2C2C2C] mb-2" style={{ fontWeight: 600 }}>
              {t.successTitle}
            </h2>
            <p className="text-sm text-[#6E6B67] mb-4">
              {t.successMessage}
            </p>
            <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
              <Clock className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                {t.successNote}
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <LogIn className="h-4 w-4" />
              {t.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 rounded-xl border border-[#E4E1DD] bg-white px-3 py-2 text-sm text-[#75534B] transition-all duration-200 hover:border-[#75534B] hover:bg-[#F9F8F6] active:scale-95"
          >
            <Globe className="h-4 w-4" />
            <span style={{ fontWeight: 500 }}>{languageLabels[language]}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-12 w-48 rounded-xl bg-white shadow-lg border border-[#E4E1DD] overflow-hidden z-50">
              {Object.entries(t.languages).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setLanguage(key as 'en' | 'zh' | 'es');
                    setShowLangMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                    language === key
                      ? 'bg-[#75534B]/10 text-[#75534B]'
                      : 'text-[#2C2C2C] hover:bg-[#F9F8F6]'
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
      <div className="flex flex-col items-center mb-6">
        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#75534B] to-[#5D423C] shadow-lg mb-3">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
          <span className="relative text-xl text-white" style={{ fontWeight: 700 }}>
            IRIS
          </span>
        </div>
        <h1 className="text-xl text-[#2C2C2C]" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
          VISTA
        </h1>
      </div>

      {/* Registration Form */}
      <div className="rounded-2xl bg-white p-8 shadow-lg border border-[#E4E1DD]">
        <div className="text-center mb-6">
          <h2 className="text-xl text-[#2C2C2C] mb-1" style={{ fontWeight: 600 }}>
            {t.createAccount}
          </h2>
          <p className="text-sm text-[#6E6B67]">{t.registerToContinue}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="employeeNumber"
              className="block text-sm font-medium text-[#2C2C2C] mb-1.5"
            >
              {t.employeeNumber}
            </label>
            <input
              id="employeeNumber"
              type="text"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              placeholder={t.employeeNumberPlaceholder}
              required
              maxLength={50}
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:outline-none focus:ring-2 ${
                fieldError === 'employee_number'
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[#E4E1DD] focus:border-[#75534B] focus:ring-[#75534B]/20'
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[#2C2C2C] mb-1.5"
            >
              {t.fullName}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              required
              minLength={2}
              maxLength={255}
              className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#2C2C2C] mb-1.5"
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
              className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:outline-none focus:ring-2 ${
                fieldError === 'email'
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[#E4E1DD] focus:border-[#75534B] focus:ring-[#75534B]/20'
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#2C2C2C] mb-1.5"
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
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 pr-12 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6B67] hover:text-[#2C2C2C] transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#2C2C2C] mb-1.5"
            >
              {t.confirmPassword}
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPasswordPlaceholder}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.registering}
              </>
            ) : (
              t.register
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 pt-4 border-t border-[#E4E1DD] text-center">
          <p className="text-sm text-[#6E6B67]">
            {t.haveAccount}{' '}
            <Link
              href="/login"
              className="text-[#75534B] font-medium hover:underline inline-flex items-center gap-1"
            >
              <LogIn className="h-3.5 w-3.5" />
              {t.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
