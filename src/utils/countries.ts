import { dateLocale } from 'i18n';

// Nombre del país en el idioma activo a partir del código ISO (VE → Venezuela)
export const countryName = (code: string): string => {
  try {
    return new Intl.DisplayNames([dateLocale()], { type: 'region' }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
};

export const countryNames = (codes: string): string => codes.split(',').map(c => countryName(c.trim())).join(', ');

// Los hallazgos guardan códigos de país (countryCodes); los textos usan {{countries}}
export const findingParams = (params?: Record<string, string | number>) =>
  params && typeof params.countryCodes === 'string'
    ? { ...params, countries: countryNames(params.countryCodes) }
    : params;
