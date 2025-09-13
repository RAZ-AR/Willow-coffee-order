import { useState, useEffect } from 'react';
import { LS_KEYS, LANGS } from '../constants';
import type { Lang } from '../types';

export const useLanguage = () => {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(LS_KEYS.lang) as Lang | null;
      return stored && (LANGS as readonly string[]).includes(stored) ? stored : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEYS.lang, lang);
  }, [lang]);

  return {
    lang,
    setLang
  };
};