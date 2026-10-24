// Generadores "Arréglalo tú": convierten un hallazgo en el archivo o registro listo
// para copiar. Funciones puras; la interfaz está en components/misc/Generators.tsx.
// Las opciones por defecto son prudentes, para no romper el sitio ni el correo.

const pad = (n: number) => String(n).padStart(2, '0');

// ---------- security.txt (RFC 9116) ----------
export interface SecurityTxtOptions {
  domain: string;
  contact: string;          // correo o URL
  languages: string[];      // ['es', 'pt']
  encryption?: string;      // URL de la llave PGP (opcional)
  policy?: string;          // URL de la política de divulgación (opcional)
  now?: Date;
}

export const securityTxt = (o: SecurityTxtOptions): string => {
  const now = o.now || new Date();
  // Expires: máximo recomendado un año; se deja a 11 meses para renovarlo con margen
  const expires = new Date(now.getTime());
  expires.setUTCMonth(expires.getUTCMonth() + 11);
  const contact = /^(https?:|mailto:)/i.test(o.contact.trim()) ? o.contact.trim() : `mailto:${o.contact.trim()}`;
  return [
    `Contact: ${contact}`,
    `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
    o.encryption?.trim() && `Encryption: ${o.encryption.trim()}`,
    o.policy?.trim() && `Policy: ${o.policy.trim()}`,
    o.languages.length > 0 && `Preferred-Languages: ${o.languages.join(', ')}`,
    `Canonical: https://${o.domain}/.well-known/security.txt`,
  ].filter(Boolean).join('\n') + '\n';
};

// ---------- SPF y DMARC ----------
export const MAIL_PROVIDERS: Record<string, { spf: string, mx: RegExp }> = {
  google: { spf: 'include:_spf.google.com', mx: /google\.com|googlemail\.com/i },
  microsoft: { spf: 'include:spf.protection.outlook.com', mx: /protection\.outlook\.com/i },
  proton: { spf: 'include:_spf.protonmail.ch', mx: /protonmail\.ch|proton\.me/i },
  tuta: { spf: 'include:spf.tutanota.de', mx: /tutanota\.de|tuta\.io/i },
  zoho: { spf: 'include:zoho.com', mx: /zoho\.(com|eu)/i },
  godaddy: { spf: 'include:secureserver.net', mx: /secureserver\.net/i },
  hosting: { spf: 'a mx', mx: /$^/ }, // correo del propio hosting (cPanel, etc.)
  sendgrid: { spf: 'include:sendgrid.net', mx: /$^/ },
  mailchimp: { spf: 'include:servers.mcsv.net', mx: /$^/ },
};

export const detectMailProviders = (mxHosts: string[]): string[] =>
  Object.entries(MAIL_PROVIDERS).filter(([, p]) => mxHosts.some(h => p.mx.test(h))).map(([id]) => id);

export type DmarcPolicy = 'none' | 'quarantine' | 'reject';

export interface MailOptions {
  sendsMail: boolean;
  providers: string[];
  reportEmail?: string;
  policy?: DmarcPolicy;   // por defecto none: primero observar
  existingSpf?: string | null; // SPF actual: se conserva todo y se suma lo nuevo
}

// Política DMARC publicada hoy (p=none, quarantine, reject) a partir de los TXT
export const currentDmarcPolicy = (txtRecords: any[] | undefined): DmarcPolicy | null => {
  const record = (txtRecords || []).map(r => [].concat(r).join('')).find(r => /^v=DMARC1/i.test(r));
  const policy = record?.match(/;\s*p=(none|quarantine|reject)/i)?.[1]?.toLowerCase();
  return (policy as DmarcPolicy) || null;
};

export const mailRecords = (o: MailOptions): { spf: string, dmarc: string } => {
  if (!o.sendsMail) {
    // Nadie puede enviar a nombre del dominio
    return { spf: 'v=spf1 -all', dmarc: 'v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s' };
  }
  // Solo puede haber un SPF: si ya existe, se conservan sus mecanismos (otros servicios,
  // IPs propias) y su política final; reemplazarlo cortaría el correo de esos servicios
  const existing = (o.existingSpf || '').trim().split(/\s+/).filter(Boolean);
  const existingAll = existing.find(m => /^[-~?+]?all$/i.test(m));
  const kept = existing.filter(m => !/^v=spf1$/i.test(m) && !/^[-~?+]?all$/i.test(m));
  const added = o.providers.flatMap(p => (MAIL_PROVIDERS[p]?.spf || '').split(' ')).filter(Boolean);
  const mechanisms = [...new Set([...kept, ...added])];
  // ~all si es nuevo: si falta un servicio en la lista, el correo no se pierde
  const spf = ['v=spf1', ...mechanisms, existingAll || '~all'].join(' ');
  // p=none = solo observar; después de unas semanas pasar a quarantine y luego a reject
  const dmarc = ['v=DMARC1', `p=${o.policy || 'none'}`, o.reportEmail?.trim() && `rua=mailto:${o.reportEmail.trim()}`, 'fo=1']
    .filter(Boolean).join('; ');
  return { spf, dmarc };
};

// ---------- Cabeceras de seguridad ----------
export type ServerType = 'apache' | 'nginx' | 'netlify' | 'cloudflare';

export const detectServer = (headers: Record<string, any> | undefined): ServerType => {
  const server = String(headers?.server || '').toLowerCase();
  if (headers?.['cf-ray'] || server.includes('cloudflare')) return 'cloudflare';
  if (server.includes('netlify')) return 'netlify';
  if (server.includes('nginx')) return 'nginx';
  return 'apache'; // Apache y LiteSpeed (lo más común en hostings compartidos) leen .htaccess
};

// CSP que casi nunca rompe un sitio: no limita scripts ni estilos, pero impide que lo
// incrusten en otros sitios, fuerza https en los recursos y bloquea plugins viejos
const SAFE_CSP = "upgrade-insecure-requests; frame-ancestors 'self'; object-src 'none'; base-uri 'self'";

export const securityHeaders = (includeHsts: boolean): [string, string][] => [
  ...(includeHsts ? [['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'] as [string, string]] : []),
  ['Content-Security-Policy', SAFE_CSP],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
];

export const headersSnippet = (server: ServerType, headers: [string, string][]): string => {
  switch (server) {
    case 'nginx':
      return headers.map(([name, value]) => `add_header ${name} "${value}" always;`).join('\n') + '\n';
    case 'netlify':
      return ['/*', ...headers.map(([name, value]) => `  ${name}: ${value}`)].join('\n') + '\n';
    case 'cloudflare':
      // Reglas de transformación > Modificar encabezado de respuesta > Establecer estático
      return headers.map(([name, value]) => `${name}\n  ${value}`).join('\n\n') + '\n';
    default:
      return ['<IfModule mod_headers.c>', ...headers.map(([name, value]) => `  Header always set ${name} "${value}"`), '</IfModule>'].join('\n') + '\n';
  }
};

// ---------- CAA ----------
const CAA_BY_ISSUER: [RegExp, string][] = [
  [/let'?s encrypt/i, 'letsencrypt.org'], [/sectigo|comodo|zerossl/i, 'sectigo.com'], [/digicert/i, 'digicert.com'],
  [/google trust/i, 'pki.goog'], [/globalsign/i, 'globalsign.com'], [/amazon/i, 'amazon.com'],
  [/godaddy|starfield/i, 'godaddy.com'], [/entrust/i, 'entrust.net'],
];

export const caaForIssuer = (issuerOrg: string | undefined): string | null =>
  (CAA_BY_ISSUER.find(([re]) => re.test(issuerOrg || '')) || [])[1] || null;

export const caaRecords = (issuers: string[], reportEmail?: string): string[] => [
  ...[...new Set(issuers)].map(issuer => `0 issue "${issuer}"`),
  ...(reportEmail?.trim() ? [`0 iodef "mailto:${reportEmail.trim()}"`] : []),
];

// ---------- MTA-STS y TLS-RPT ----------
export const mtaStsFiles = (o: { mxHosts: string[], reportEmail: string, now?: Date }) => {
  const now = o.now || new Date();
  const id = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
  return {
    stsRecord: `v=STSv1; id=${id}`,
    // testing primero: reporta problemas sin rechazar correos; luego pasar a enforce
    policy: ['version: STSv1', 'mode: testing', ...o.mxHosts.map(h => `mx: ${h.replace(/\.$/, '')}`), 'max_age: 604800'].join('\n') + '\n',
    tlsRptRecord: `v=TLSRPTv1; rua=mailto:${o.reportEmail.trim()}`,
  };
};

// ---------- WordPress ----------
export const wordpressHardening = (): string => `<?php
/**
 * Plugin Name: Endurecimiento básico (chequea.la)
 * Description: Oculta los usuarios de la API REST, desactiva xmlrpc.php y la versión de WordPress.
 */

// xmlrpc.php: entrada antigua muy usada para probar contraseñas
add_filter('xmlrpc_enabled', '__return_false');

// Lista de usuarios de la API REST, solo para quien inició sesión (el editor la sigue usando)
add_filter('rest_endpoints', function ($endpoints) {
    if (!is_user_logged_in()) {
        unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\\d]+)']);
    }
    return $endpoints;
});

// /?author=1 también revela nombres de usuario
add_action('template_redirect', function () {
    if (is_author() && !is_user_logged_in()) {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
});

// Versión de WordPress en el código de la página y en los feeds
remove_action('wp_head', 'wp_generator');
add_filter('the_generator', '__return_empty_string');
`;
