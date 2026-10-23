// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Solo español y portugués, como chequea.la. Los términos técnicos (DNS, HSTS,
// CNAME...) se dejan en inglés dentro de los textos.
export const LANGUAGES = ['es', 'pt'] as const;
export type Language = typeof LANGUAGES[number];

const resources = {
  es: {
    translation: require('./locales/es.json'),
    labels: require('./locales/labels.es.json'),
  },
  pt: {
    translation: require('./locales/pt.json'),
    labels: require('./locales/labels.pt.json'),
  },
};

// Preferencia guardada; si no hay, portugués para navegadores en portugués y español para el resto
const detectLanguage = (): Language => {
  let saved: string | null = null;
  try { saved = localStorage.getItem('language'); } catch { /* sin acceso a localStorage */ }
  if (saved && (LANGUAGES as readonly string[]).includes(saved)) return saved as Language;
  return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'es';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'es',
    ns: ['translation', 'labels'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
  });

// Etiquetas de las tarjetas: la clave es el texto original en inglés (puede llevar
// puntos o signos), y si no hay traducción se muestra tal cual.
export const tl = (text: string): string =>
  i18n.t(text, { ns: 'labels', keySeparator: false, nsSeparator: false, defaultValue: text });

export const dateLocale = (): string => (i18n.language === 'pt' ? 'pt-BR' : 'es');

export default i18n;
