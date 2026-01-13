'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell, Globe, ChevronDown, LogOut, Check, CheckCheck, Key, X, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { notificationsApi, authApi, type NotificationData } from '@/lib/api';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { itemCount } = useCart();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const [notifResponse, countResponse] = await Promise.all([
        notificationsApi.list({ per_page: 10 }),
        notificationsApi.getCount(),
      ]);
      setNotifications(notifResponse.data || []);
      setUnreadCount(countResponse.unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'zh' ? '刚刚' : language === 'es' ? 'Ahora' : 'Just now';
    if (diffMins < 60) return language === 'zh' ? `${diffMins}分钟前` : language === 'es' ? `Hace ${diffMins}m` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'zh' ? `${diffHours}小时前` : language === 'es' ? `Hace ${diffHours}h` : `${diffHours}h ago`;
    return language === 'zh' ? `${diffDays}天前` : language === 'es' ? `Hace ${diffDays}d` : `${diffDays}d ago`;
  };

  const text = {
    en: {
      search: 'Search IRIS Vista...',
      notifications: 'Notifications',
      logout: 'Sign Out',
      changePassword: 'Change Password',
      passwordModalTitle: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      passwordMinLength: 'Minimum 6 characters',
      passwordMismatch: 'Passwords do not match',
      passwordChanged: 'Password changed successfully',
      changeBtn: 'Change Password',
      changing: 'Changing...',
      cancel: 'Cancel',
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
    },
    zh: {
      search: '搜索 IRIS Vista...',
      notifications: '通知',
      logout: '退出登录',
      changePassword: '修改密码',
      passwordModalTitle: '修改密码',
      currentPassword: '当前密码',
      newPassword: '新密码',
      confirmPassword: '确认新密码',
      passwordMinLength: '至少6个字符',
      passwordMismatch: '密码不匹配',
      passwordChanged: '密码修改成功',
      changeBtn: '修改密码',
      changing: '修改中...',
      cancel: '取消',
      languages: {
        en: 'English',
        zh: '中文',
        es: 'Español',
      },
    },
    es: {
      search: 'Buscar IRIS Vista...',
      notifications: 'Notificaciones',
      logout: 'Cerrar Sesion',
      changePassword: 'Cambiar Contrasena',
      passwordModalTitle: 'Cambiar Contrasena',
      currentPassword: 'Contrasena Actual',
      newPassword: 'Nueva Contrasena',
      confirmPassword: 'Confirmar Nueva Contrasena',
      passwordMinLength: 'Minimo 6 caracteres',
      passwordMismatch: 'Las contrasenas no coinciden',
      passwordChanged: 'Contrasena cambiada exitosamente',
      changeBtn: 'Cambiar Contrasena',
      changing: 'Cambiando...',
      cancel: 'Cancelar',
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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const openPasswordModal = () => {
    setShowUserMenu(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError(t.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordMismatch);
      return;
    }

    setIsChangingPassword(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const parts = user.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E4E1DD] shadow-sm">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 transition-transform duration-200 hover:scale-105 active:scale-100"
        >
          <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#75534B] to-[#5D423C] shadow-md transition-shadow duration-300 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
            <span className="relative text-lg sm:text-xl text-white" style={{ fontWeight: 700 }}>
              IRIS
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div
              className="text-xl text-[#2C2C2C]"
              style={{ fontWeight: 600, letterSpacing: '-0.02em' }}
            >
              VISTA
            </div>
            <div className="text-xs text-[#75534B]" style={{ fontWeight: 400 }}>
              Supply Chain & Procurement
            </div>
          </div>
        </Link>

        {/* Global Search - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E6B67]" />
            <input
              type="text"
              placeholder={t.search}
              className="w-full rounded-xl border border-[#E4E1DD] bg-[#F9F8F6] py-2.5 pl-12 pr-4 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#75534B] transition-all duration-200 hover:bg-[#F9F8F6] active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#75534B] text-xs text-white shadow-md">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#75534B] transition-all duration-200 hover:bg-[#F9F8F6] active:scale-95"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#D1625B] text-xs text-white shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 sm:right-0 top-12 w-[calc(100vw-1.5rem)] sm:w-80 max-w-80 rounded-xl bg-white shadow-lg border border-[#E4E1DD] overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E4E1DD] bg-[#F9F8F6]">
                  <span className="text-sm font-semibold text-[#2C2C2C]">{t.notifications}</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 text-xs text-[#75534B] hover:text-[#5D423C] transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {language === 'zh' ? '全部已读' : language === 'es' ? 'Marcar todo' : 'Mark all read'}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[#6E6B67]">
                      {language === 'zh' ? '没有通知' : language === 'es' ? 'Sin notificaciones' : 'No notifications'}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-[#E4E1DD] last:border-b-0 cursor-pointer transition-colors ${
                          notification.is_read ? 'bg-white' : 'bg-[#75534B]/5'
                        } hover:bg-[#F9F8F6]`}
                        onClick={() => {
                          if (!notification.is_read) {
                            handleMarkAsRead(notification.id);
                          }
                          if (notification.action_url) {
                            router.push(notification.action_url);
                            setShowNotifications(false);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                            notification.is_read ? 'bg-transparent' : 'bg-[#D1625B]'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${notification.is_read ? 'text-[#6E6B67]' : 'text-[#2C2C2C] font-medium'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-[#6E6B67] mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-[#9E9B97] mt-1">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="p-1 text-[#75534B] hover:bg-[#75534B]/10 rounded transition-colors"
                              title={language === 'zh' ? '标记为已读' : language === 'es' ? 'Marcar leído' : 'Mark as read'}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Switch - Hidden on small screens */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 rounded-xl border border-[#E4E1DD] px-3 py-2 text-sm text-[#75534B] transition-all duration-200 hover:border-[#75534B] hover:bg-[#F9F8F6] active:scale-95"
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
                      setLanguage(key as Language);
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

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#75534B] to-[#5D423C] text-sm text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              <span style={{ fontWeight: 600 }}>{getUserInitials()}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-56 rounded-xl bg-white shadow-lg border border-[#E4E1DD] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#E4E1DD]">
                  <p className="text-sm font-semibold text-[#2C2C2C]">{user?.name}</p>
                  <p className="text-xs text-[#6E6B67]">{user?.email}</p>
                  <p className="text-xs text-[#75534B] capitalize mt-1">
                    {user?.role.replace('_', ' ')}
                  </p>
                </div>
                <button
                  onClick={openPasswordModal}
                  className="w-full px-4 py-3 text-left text-sm text-[#2C2C2C] hover:bg-[#F9F8F6] transition-colors flex items-center gap-2 border-b border-[#E4E1DD]"
                >
                  <Key className="h-4 w-4" />
                  {t.changePassword}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-[#D1625B] hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E1DD]">
              <h2 className="text-lg font-semibold text-[#2C2C2C] flex items-center gap-2">
                <Key className="h-5 w-5 text-[#75534B]" />
                {t.passwordModalTitle}
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-[#F9F8F6] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#6E6B67]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {passwordSuccess ? (
                <div className="flex flex-col items-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-[#2C2C2C]">{t.passwordChanged}</p>
                </div>
              ) : (
                <>
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                      {t.currentPassword}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPwd ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 border border-[#E4E1DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 focus:border-[#75534B] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                      {t.newPassword}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 border border-[#E4E1DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 focus:border-[#75534B] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#6E6B67] mt-1">{t.passwordMinLength}</p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-1">
                      {t.confirmPassword}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#E4E1DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 focus:border-[#75534B]"
                    />
                  </div>

                  {/* Error */}
                  {passwordError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm">{passwordError}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!passwordSuccess && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E4E1DD] bg-[#F9F8F6]">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-lg border border-[#E4E1DD] bg-white text-[#2C2C2C] font-medium hover:bg-[#F9F8F6] transition-colors disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.changing}
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      {t.changeBtn}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
