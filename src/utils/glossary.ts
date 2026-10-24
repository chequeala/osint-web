// Glosario de términos técnicos. Los términos quedan en inglés (también en los
// textos en portugués), así que la detección es la misma; la definición está en
// locales/*.json, bajo glossary.<clave>.

// [clave, texto que se busca]. Los más largos primero (DNSSEC antes que DNS).
export const TERMS: [string, string][] = [
  ['csp', 'Content-Security-Policy'],
  ['xfo', 'X-Frame-Options'],
  ['xcto', 'X-Content-Type-Options'],
  ['hsts', 'Strict-Transport-Security'],
  ['apiRest', 'API REST'],
  ['tlsRpt', 'TLS-RPT'],
  ['mtaSts', 'MTA-STS'],
  ['dnssec', 'DNSSEC'],
  ['securityTxt', 'security.txt'],
  ['xmlrpc', 'xmlrpc.php'],
  ['onion', '.onion'],
  ['https', 'HTTPS'],
  ['hsts', 'HSTS'],
  ['dmarc', 'DMARC'],
  ['dkim', 'DKIM'],
  ['spf', 'SPF'],
  ['cname', 'CNAME'],
  ['caa', 'CAA'],
  ['dns', 'DNS'],
  ['ddos', 'DDoS'],
  ['waf', 'WAF'],
  ['ooni', 'OONI'],
  ['tor', 'Tor'],
  ['tls', 'TLS'],
  ['ssl', 'SSL'],
  ['whois', 'Whois'],
  ['phishing', 'phishing'],
  ['malware', 'malware'],
  ['httpOnly', 'HttpOnly'],
  ['ip', 'IP'],
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Sin \b para términos que empiezan con punto; los demás, palabra completa.
// Las siglas distinguen mayúsculas (IP no debe marcar "ipwho.is")
const PATTERN = new RegExp(
  TERMS.map(([, term]) => (term.startsWith('.') ? escape(term) : `\\b${escape(term)}\\b`)).join('|'),
  'g',
);
const KEY_BY_TERM = new Map(TERMS.map(([key, term]) => [term, key]));

export type GlossaryPiece = string | { term: string, key: string };

// Divide un texto en trozos y marca la primera aparición de cada término.
// `seen` se puede compartir entre varios textos (p. ej. título y descripción de un hallazgo)
export const splitTerms = (text: string, seen: Set<string> = new Set()): GlossaryPiece[] => {
  const pieces: GlossaryPiece[] = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const term = match[0];
    const key = KEY_BY_TERM.get(term);
    // los .onion son direcciones como "abc.onion": solo el término suelto
    if (!key || seen.has(key) || (term === '.onion' && /\w/.test(text[(match.index || 0) - 1] || ''))) continue;
    seen.add(key);
    if ((match.index || 0) > last) pieces.push(text.slice(last, match.index));
    pieces.push({ term, key });
    last = (match.index || 0) + term.length;
  }
  if (last < text.length) pieces.push(text.slice(last));
  return pieces;
};

// Claves de los términos que aparecen en varios textos (para el glosario del informe)
export const termsIn = (texts: string[]): string[] => {
  const keys = new Set<string>();
  texts.forEach(text => splitTerms(text).forEach(p => { if (typeof p !== 'string') keys.add(p.key); }));
  return TERMS.map(([key]) => key).filter((key, i, all) => keys.has(key) && all.indexOf(key) === i);
};

export const allTermKeys = (): string[] => [...new Set(TERMS.map(([key]) => key))];
