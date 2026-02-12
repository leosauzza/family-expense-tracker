import React, { createContext, useState, useCallback, useEffect } from 'react';
import es from '../../public/locales/es.json';
import en from '../../public/locales/en.json';

const translations = { es, en };

interface LocaleContextType {
  locale: 'es' | 'en';
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: 'es' | 'en') => void;
}

export const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<'es' | 'en'>('es');

  useEffect(() => {
    const stored = localStorage.getItem('expense_tracker_locale');
    if (stored === 'es' || stored === 'en') {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: 'es' | 'en') => {
    setLocaleState(newLocale);
    localStorage.setItem('expense_tracker_locale', newLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        const paramValue = params[paramKey];
        return paramValue !== undefined ? String(paramValue) : match;
      });
    }
    
    return value;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
