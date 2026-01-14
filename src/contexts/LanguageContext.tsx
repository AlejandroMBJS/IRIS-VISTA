'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useSyncExternalStore } from 'react';

export type Language = 'en' | 'zh' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Get language from localStorage (client-side only)
const getLanguageFromStorage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('language') as Language;
  if (saved && ['en', 'zh', 'es'].includes(saved)) {
    return saved;
  }
  return 'en';
};

// Subscribe to storage changes (for cross-tab sync)
const subscribeToStorage = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Use useSyncExternalStore for proper SSR/hydration handling
  const storedLanguage = useSyncExternalStore(
    subscribeToStorage,
    getLanguageFromStorage,
    () => 'en' as Language // Server snapshot
  );

  const [language, setLanguageState] = useState<Language>(storedLanguage);

  // Sync with storage on mount and when storage changes
  useEffect(() => {
    setLanguageState(storedLanguage);
  }, [storedLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Dispatch storage event for cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', { key: 'language', newValue: lang }));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
