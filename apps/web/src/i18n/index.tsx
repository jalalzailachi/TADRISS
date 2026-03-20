'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import fr from './fr.json';
import ar from './ar.json';

type Locale = 'fr' | 'ar';

const translations: Record<Locale, typeof fr> = { fr, ar };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // fallback: return key path
    }
  }
  return typeof current === 'string' ? current : path;
}

export function I18nProvider({ children, defaultLocale = 'fr' }: { children: ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const t = useCallback(
    (key: string) => getNestedValue(translations[locale] as unknown as Record<string, unknown>, key),
    [locale]
  );

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
