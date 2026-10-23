import i18n from 'i18n';
import docsEs, * as es from 'utils/docs';
import docsPt, * as pt from 'utils/docs.pt';

// Documentación de cada prueba (botón ⓘ y página "Acerca de") en el idioma activo
export const getDocs = (language: string = i18n.language) => (
  language === 'pt'
    ? { docs: docsPt, about: pt.about, featureIntro: pt.featureIntro, fairUse: pt.fairUse }
    : { docs: docsEs, about: es.about, featureIntro: es.featureIntro, fairUse: es.fairUse }
);
