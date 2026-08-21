'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SupportedLanguage } from '@/context/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark' | 'compact';
  className?: string;
}

export default function LanguageSwitcher({ variant = 'light', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, languages, isTranslating } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const buttonStyles =
    variant === 'dark'
      ? 'bg-[#104835] hover:bg-[#0B3B2B] text-[#F4D06F] border border-[#D4AF37]/40'
      : variant === 'compact'
      ? 'bg-transparent text-slate-700 hover:text-emerald-800'
      : 'bg-white/90 hover:bg-white text-slate-800 border border-[#D4AF37]/40 shadow-xs';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${buttonStyles}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change Website Language"
      >
        <i className="fas fa-globe text-[#0F766E] text-xs"></i>
        <span>{currentLang.nativeLabel}</span>
        {isTranslating ? (
          <i className="fas fa-circle-notch fa-spin text-[10px] text-emerald-600"></i>
        ) : (
          <i className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white shadow-xl border border-slate-200 py-1.5 z-60 animate-in fade-in zoom-in-95 duration-100 font-sans">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Select Language
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {languages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLanguage(item.code as SupportedLanguage);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-black'
                      : 'text-slate-700 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{item.nativeLabel}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({item.label})</span>
                  </span>
                  {isSelected && (
                    <i className="fas fa-check text-xs text-emerald-600"></i>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
