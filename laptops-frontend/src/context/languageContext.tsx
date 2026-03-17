"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { en, type TranslationKey } from "@/i18n/en";
import { ro } from "@/i18n/ro";

export type UiLanguage = "ro" | "en";

type LanguageContextValue = {
  lang: UiLanguage;
  language: UiLanguage;
  setLang: (language: UiLanguage) => void;
  setLanguage: (language: UiLanguage) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const STORAGE_KEY = "lapstore-ui-language";

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<UiLanguage>("ro");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "ro" || stored === "en") {
        setLang(stored);
      } else {
        window.localStorage.setItem(STORAGE_KEY, "ro");
      }
    } catch {
      // ignore localStorage access issues
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore localStorage access issues
    }
  }, [lang]);

  const dictionary = lang === "ro" ? ro : en;

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const template = dictionary[key] ?? en[key] ?? key;
      if (!vars) return template;

      return template.replace(/\{(\w+)\}/g, (_, varName: string) => {
        const value = vars[varName];
        return value === undefined || value === null ? "" : String(value);
      });
    },
    [dictionary]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, language: lang, setLang, setLanguage: setLang, t }),
    [lang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return ctx;
}
