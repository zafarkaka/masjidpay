'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'ml' | 'ur' | 'ar';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag?: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', dir: 'ltr' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', dir: 'ltr' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', dir: 'rtl' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
];

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languages: LanguageOption[];
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  languages: SUPPORTED_LANGUAGES,
  isTranslating: false,
});

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Helper to set cookie
  const setGoogleTransCookie = (lang: string) => {
    const value = lang === 'en' ? '/auto/en' : `/auto/${lang}`;
    document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${value}; path=/;`;
    localStorage.setItem('masjidpay_lang', lang);
  };

  useEffect(() => {
    // Read saved language from localStorage or cookie
    const saved = (localStorage.getItem('masjidpay_lang') as SupportedLanguage) || 'en';
    if (saved && ['en', 'ta', 'hi', 'ml', 'ur', 'ar'].includes(saved)) {
      setLanguageState(saved);
      setGoogleTransCookie(saved);
    }
  }, []);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    setIsTranslating(true);
    setGoogleTransCookie(newLang);

    // Apply translation using Google Translate DOM trigger
    const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectElem) {
      selectElem.value = newLang;
      selectElem.dispatchEvent(new Event('change'));
      setTimeout(() => setIsTranslating(false), 500);
    } else {
      // Reload page with new language cookie so Google Translate picks it up immediately
      window.location.reload();
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages: SUPPORTED_LANGUAGES, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
