import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../constants/translations/en.json';
import pt from '../constants/translations/pt.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
