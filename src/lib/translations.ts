import type { TranslatedText } from './api';

export type Language = 'en' | 'zh' | 'es';

/**
 * Gets the translated text for the current language
 * Falls back to original text if translation is not available
 */
export const getTranslatedText = (
  translated: TranslatedText | null | undefined,
  fallback: string,
  lang: Language
): string => {
  if (!translated) return fallback;
  return translated[lang] || translated.original || fallback;
};

/**
 * Checks if a translated text object has any translations
 */
export const hasTranslations = (translated: TranslatedText | null | undefined): boolean => {
  if (!translated) return false;
  return !!(translated.en || translated.zh || translated.es);
};
