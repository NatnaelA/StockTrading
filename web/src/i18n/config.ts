import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import am from './locales/am.json';
import om from './locales/om.json';
import ti from './locales/ti.json';

export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
  am: { name: 'Amharic', nativeName: 'አማርኛ', dir: 'ltr' },
  om: { name: 'Oromia', nativeName: 'Afaan Oromoo', dir: 'ltr' },
  ti: { name: 'Tigrigna', nativeName: 'ትግርኛ', dir: 'ltr' },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      om: { translation: om },
      ti: { translation: ti },
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n; 