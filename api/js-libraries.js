const axios = require('axios');
const cheerio = require('cheerio');
const middleware = require('./_common/middleware');

// Librerías JavaScript con vulnerabilidades conocidas, con la base abierta de
// retire.js (https://github.com/RetireJS/retire.js). Se detectan por la URL o el
// nombre del script y por el comentario de versión al principio del archivo.
const REPOSITORY_URL = 'https://raw.githubusercontent.com/RetireJS/retire.js/master/repository/jsrepository-v4.json';
const VERSION = '[0-9][0-9.a-z_\\-]+';
const MAX_SCRIPTS = 12;
const HEAD_BYTES = 8192;

const http = axios.create({
  timeout: 5000,
  maxRedirects: 3,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VeniOSINT/1.0; +https://veni.chequea.la)' },
});

// La base se guarda en memoria mientras la función siga "caliente" (12 h)
let cache = { repo: null, at: 0 };
const loadRepository = async () => {
  if (cache.repo && Date.now() - cache.at < 12 * 60 * 60 * 1000) return cache.repo;
  const { data } = await http.get(REPOSITORY_URL, { timeout: 6000 });
  // §§version§§ se reemplaza por el patrón de versión; los regex se compilan una vez
  const compile = (list = []) => list.map(p => { try { return new RegExp(p.replace(/§§version§§/g, VERSION)); } catch { return null; } }).filter(Boolean);
  const repo = Object.entries(data)
    .filter(([, lib]) => lib && lib.extractors && Array.isArray(lib.vulnerabilities))
    .map(([name, lib]) => ({
      name,
      uri: compile(lib.extractors.uri),
      filename: compile(lib.extractors.filename),
      filecontent: compile(lib.extractors.filecontent),
      vulnerabilities: lib.vulnerabilities,
    }));
  cache = { repo, at: Date.now() };
  return repo;
};

// Comparación de versiones como la de retire.js: por partes, numéricas si se puede
const parts = (v) => String(v).split(/[.\-]/).map(p => (/^\d+$/.test(p) ? Number(p) : p));
const compareVersions = (a, b) => {
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x === y) continue;
    if (typeof x === 'number' && typeof y === 'number') return x < y ? -1 : 1;
    return String(x) < String(y) ? -1 : 1;
  }
  return 0;
};

const vulnerableIn = (lib, version) => lib.vulnerabilities.filter(v =>
  (!v.below || compareVersions(version, v.below) < 0) && (!v.atOrAbove || compareVersions(version, v.atOrAbove) >= 0));

const firstMatch = (regexes, text) => {
  for (const re of regexes) {
    const m = text.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
};

const handler = async (url) => {
  const [repo, page] = await Promise.all([loadRepository(), http.get(url, { maxContentLength: 5 * 1024 * 1024 })]);
  if (typeof page.data !== 'string') return { skipped: 'La página no devolvió HTML' };
  const base = page.request?.res?.responseUrl || url;
  const $ = cheerio.load(page.data);

  const scripts = [...new Set($('script[src]').map((_, el) => $(el).attr('src')).get())]
    .map(src => { try { return new URL(src, base).toString(); } catch { return null; } })
    .filter(src => src && /^https?:/i.test(src))
    .slice(0, MAX_SCRIPTS);

  // Los primeros KB de cada script, donde suele ir el comentario con la versión
  const heads = await Promise.all(scripts.map(src => http.get(src, {
    responseType: 'text', headers: { Range: `bytes=0-${HEAD_BYTES - 1}` }, maxContentLength: 2 * 1024 * 1024,
  }).then(res => (typeof res.data === 'string' ? res.data.slice(0, HEAD_BYTES) : '')).catch(() => '')));

  const found = new Map();
  scripts.forEach((src, i) => {
    const filename = decodeURIComponent(new URL(src).pathname.split('/').pop() || '');
    for (const lib of repo) {
      const version = firstMatch(lib.uri, src) || firstMatch(lib.filename, filename) || (heads[i] && firstMatch(lib.filecontent, heads[i]));
      if (!version) continue;
      const key = `${lib.name}@${version}`;
      if (found.has(key)) continue;
      const vulns = vulnerableIn(lib, version);
      found.set(key, {
        name: lib.name,
        version,
        source: src,
        vulnerabilities: vulns.map(v => ({
          severity: v.severity || 'medium',
          summary: v.identifiers?.summary || null,
          cves: v.identifiers?.CVE || [],
          fixedIn: v.below || null,
        })),
      });
    }
  });

  const libraries = [...found.values()].sort((a, b) => b.vulnerabilities.length - a.vulnerabilities.length);
  return { checkedScripts: scripts.length, libraries };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
module.exports.compareVersions = compareVersions;
