import i18n from 'i18n';

// Los motivos de "omitido" y algunos errores los escribe el servidor (api/*.js),
// en español o, los heredados de Web Check, en inglés. Aquí se reconocen y se
// muestran en el idioma activo; los que no coinciden se muestran tal cual.
const PATTERNS: [RegExp, string][] = [
  [/Dirección no permitida: (?<host>\S+) apunta a una red privada/, 'privateAddress'],
  [/^Este servidor no tiene un navegador para hacer capturas/, 'noBrowserScreenshot'],
  [/^Este servidor no tiene un navegador para detectar tecnologías/, 'noBrowserTech'],
  [/^Falta configurar (?<key>[A-Z_]+)/, 'missingKey'],
  [/^Sin clave de (?<service>\w+) configurada/, 'missingClientKey'],
  [/^El certificado HTTPS no es válido, así que HSTS/, 'hstsInvalidCert'],
  [/^El sitio no tiene robots\.txt|^No robots\.txt file present/, 'noRobots'],
  [/^El sitio no tiene sitemap\.xml|^No sitemap found/, 'noSitemap'],
  [/^El sitio no parece estar hecho con WordPress/, 'notWordPress'],
  [/^No hay subdominios de (?<domain>\S+) en los registros/, 'noSubdomains'],
  [/^La terminación (?<tld>\S+) no tiene un servidor whois/, 'noWhoisServer'],
  [/^(?<domain>\S+) no aparece en (?<server>\S+)$/, 'whoisNotFound'],
  [/^(?<server>\S+) no entrega datos de (?<domain>\S+)$/, 'whoisNoData'],
  [/^Hiciste muchos análisis seguidos/, 'rateLimited'],
  [/^No mail server in use on this domain/, 'noMail'],
  [/^No cookies/, 'noCookies'],
  [/^No metadata found/, 'noMetadata'],
  [/^No internal or external links found/, 'noLinks'],
  [/^Site has never before been archived/, 'neverArchived'],
  [/^Not enough info to get carbon data/, 'noCarbonData'],
  [/^Skipping, as (?<domain>\S+) isn't ranked/, 'notRanked'],
  [/^Skipping, as (?<domain>\S+) is not present in the Umbrella/, 'notRanked'],
  [/certificate|UNABLE_TO_VERIFY|self[- ]signed/i, 'tlsError'],
  [/ENOTFOUND|getaddrinfo/, 'dnsError'],
  [/timed out|no respondió|ETIMEDOUT|ECONNABORTED/i, 'timeout'],
  [/status(?: code)? 403|code: 403/i, 'blocked403'],
  [/status(?: code)? 429|code: 429/i, 'rateLimitedRemote'],
];

export const translateServerMessage = (message: string): string => {
  if (!message) return message;
  for (const [pattern, key] of PATTERNS) {
    const match = message.match(pattern);
    if (match) return i18n.t(`serverMessages.${key}`, { ...match.groups, original: message });
  }
  return message;
};
