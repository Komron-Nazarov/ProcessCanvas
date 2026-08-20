"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { dictionaries } from "./config";
import type { Locale, TranslationKey, TranslationVariables } from "./types";

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, variables?: TranslationVariables) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, setLocale, children }: { locale: Locale; setLocale: (locale: Locale) => void; children: ReactNode }) {
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const t = useCallback((key: TranslationKey, variables?: TranslationVariables) => {
    let value = dictionaries[locale][key];
    if (variables) Object.entries(variables).forEach(([name, replacement]) => { value = value.replaceAll(`{${name}}`, String(replacement)); });
    return value;
  }, [locale]);
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
