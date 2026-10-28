const axios = require('axios');
const middleware = require('./_common/middleware');

// Busca archivos que nunca deberían ser públicos. Solo GET, como cualquier visitante.
// Muchos sitios responden 200 con su portada a cualquier dirección, así que cada
// archivo se confirma por su contenido. Nunca se devuelve el contenido encontrado.
const http = axios.create({
  timeout: 6000,
  maxRedirects: 0, // una redirección (p. ej. al login) significa que no está expuesto
  maxContentLength: 2 * 1024 * 1024,
  responseType: 'arraybuffer',
  validateStatus: () => true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; OSINTWeb/1.0; +https://osint.chequea.la)',
    Range: 'bytes=0-4095', // basta el principio del archivo para reconocerlo
  },
});

const text = (buf) => buf.toString('utf8');
const isHtml = (buf) => /<(!doctype|html|head|body)\b/i.test(text(buf).slice(0, 1024));

const CHECKS = [
  { path: '/.git/HEAD', type: 'git', severity: 'high', match: b => /^ref: refs\//.test(text(b)) },
  { path: '/.git/config', type: 'git', severity: 'high', match: b => /\[core\]/.test(text(b)) && !isHtml(b) },
  { path: '/.env', type: 'env', severity: 'high', match: b => !isHtml(b) && /^[A-Z][A-Z0-9_]*=/m.test(text(b)) },
  ...['/wp-config.php.bak', '/wp-config.php~', '/wp-config.php.save', '/wp-config.php.old', '/wp-config.bak', '/wp-config.txt']
    .map(path => ({ path, type: 'wpConfig', severity: 'high', match: b => !isHtml(b) && /define\s*\(\s*['"]DB_(PASSWORD|USER|NAME)['"]/.test(text(b)) })),
  ...['/backup.sql', '/dump.sql', '/database.sql', '/db.sql']
    .map(path => ({ path, type: 'sql', severity: 'high', match: b => !isHtml(b) && /(CREATE TABLE|INSERT INTO|-- MySQL dump|PostgreSQL database dump)/i.test(text(b)) })),
  ...['/backup.zip', '/site.zip', '/www.zip', '/backup.tar.gz']
    .map(path => ({ path, type: 'backup', severity: 'high', match: b => b.slice(0, 4).equals(Buffer.from('PK\x03\x04', 'binary')) || b.slice(0, 2).equals(Buffer.from([0x1f, 0x8b])) })),
  { path: '/.htpasswd', type: 'htpasswd', severity: 'high', match: b => !isHtml(b) && /^[^:\s<]+:(\$apr1\$|\$2[aby]\$|\{SHA\}|[./0-9A-Za-z]{13}$)/m.test(text(b)) },
  ...['/phpinfo.php', '/info.php']
    .map(path => ({ path, type: 'phpinfo', severity: 'medium', match: b => /<title>PHP [\d.]+[^<]*phpinfo\(\)\s*<\/title>/i.test(text(b)) })),
  { path: '/server-status', type: 'serverStatus', severity: 'medium', match: b => /Apache Server Status/i.test(text(b)) },
  { path: '/.DS_Store', type: 'dsStore', severity: 'low', match: b => b.slice(4, 8).toString('binary') === 'Bud1' },
  ...['/wp-content/uploads/', '/uploads/', '/backup/', '/backups/']
    .map(path => ({ path, type: 'dirListing', severity: 'medium', match: b => /<title>\s*Index of \//i.test(text(b)) })),
];

const TLS_ERROR = /certificate|self[- ]signed|UNABLE_TO_VERIFY|CERT_|altname|EPROTO/i;

const handler = async (url) => {
  let base = new URL(url).origin;

  // Línea base: lo que responde el sitio a una dirección que no existe.
  // Cualquier respuesta igual a esa es su página por defecto, no un archivo expuesto.
  const fetchBaseline = () => http.get(`${base}/osint-web-no-existe-${Date.now()}.txt`).then(res => Buffer.from(res.data || []));
  let baseline = null;
  let fetchedOverHttp = false;
  try {
    baseline = await fetchBaseline();
  } catch (error) {
    // Con un certificado inválido cada prueba fallaría y parecería que no hay nada expuesto
    if (TLS_ERROR.test(error.message || '') && base.startsWith('https:')) {
      base = base.replace(/^https:/, 'http:');
      fetchedOverHttp = true;
      baseline = await fetchBaseline().catch(() => null);
    }
  }

  const results = await Promise.all(CHECKS.map(async (check) => {
    try {
      const res = await http.get(base + check.path);
      if (![200, 206].includes(res.status)) return null;
      const body = Buffer.from(res.data || []);
      if (baseline && baseline.length > 0 && body.equals(baseline)) return null;
      return check.match(body) ? { path: check.path, type: check.type, severity: check.severity } : null;
    } catch {
      return null; // timeout o conexión rechazada: no se considera expuesto
    }
  }));

  return { found: results.filter(Boolean), checked: CHECKS.length, ...(fetchedOverHttp && { fetchedOverHttp }) };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
