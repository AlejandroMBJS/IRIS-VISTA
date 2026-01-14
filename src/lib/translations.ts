import type { TranslatedText } from './api';

export type Language = 'en' | 'zh' | 'es';

/**
 * Decodes URL-encoded characters in a string (e.g., %20 -> space, %2D -> -)
 * Safely handles strings that may not be URL-encoded
 */
export const decodeText = (text: string | null | undefined): string => {
  if (!text) return '';
  try {
    return decodeURIComponent(text);
  } catch {
    // If decoding fails (invalid encoding), return the original text
    return text;
  }
};

/**
 * Gets the translated text for the current language
 * Falls back to original text if translation is not available
 * Also decodes URL-encoded characters
 */
export const getTranslatedText = (
  translated: TranslatedText | null | undefined,
  fallback: string,
  lang: Language
): string => {
  if (!translated) return decodeText(fallback);
  const result = translated[lang] || translated.original || fallback;
  return decodeText(result);
};

/**
 * Checks if a translated text object has any translations
 */
export const hasTranslations = (translated: TranslatedText | null | undefined): boolean => {
  if (!translated) return false;
  return !!(translated.en || translated.zh || translated.es);
};
