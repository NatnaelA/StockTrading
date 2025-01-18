import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { LANGUAGES } from '@/i18n/config';

export function useLanguage() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Get the stored language preference
    const storedLang = localStorage.getItem('i18nextLng');
    
    // If there's a stored language and it's different from the current one
    if (storedLang && storedLang !== i18n.language && storedLang in LANGUAGES) {
      i18n.changeLanguage(storedLang);
    }
    
    // If no stored language, try to detect browser language
    if (!storedLang) {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang in LANGUAGES) {
        i18n.changeLanguage(browserLang);
        localStorage.setItem('i18nextLng', browserLang);
      }
    }
  }, [i18n]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    languages: LANGUAGES,
  };
} 