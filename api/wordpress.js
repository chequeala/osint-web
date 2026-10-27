const axios = require('axios');
const middleware = require('./_common/middleware');

// Revisiones pasivas (solo GET) de problemas comunes en sitios WordPress:
// usuarios expuestos por la API REST, xmlrpc.php activo y versión visible.
const http = axios.create({
  timeout: 8000,
  maxRedirects: 5,
  validateStatus: () => true,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VeniOSINT/1.0; +https://veni.chequea.la)' },
});

const WP_MARKERS = /\/wp-content\/|\/wp-includes\/|https:\/\/api\.w\.org\/|<meta[^>]+generator[^>]+WordPress/i;

const findVersion = (html) => {
  const generator = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress\s*([\d.]+)/i);
  return generator ? generator[1] : null;
};

const getUsers = async (base) => {
  for (const path of ['/wp-json/wp/v2/users?per_page=20', '/?rest_route=/wp/v2/users&per_page=20']) {
    const res = await http.get(base + path).catch(() => null);
    if (res && res.status === 200 && Array.isArray(res.data)) {
      // Solo el slug: es lo que se usa para entrar al panel, y lo que hay que dejar de exponer
      return res.data.map(u => u.slug).filter(Boolean);
    }
  }
  return [];
};

const isXmlRpcEnabled = async (base) => {
  const res = await http.get(`${base}/xmlrpc.php`).catch(() => null);
  return !!res && typeof res.data === 'string' && /XML-RPC server accepts POST requests only/i.test(res.data);
};

// Última versión de cada rama según la API pública de WordPress.org. No se envía nada
// del sitio analizado; se guarda en memoria unas horas para no consultarla en cada análisis.
const RELEASES_TTL = 6 * 60 * 60 * 1000;
let releasesCache = null;

const getReleases = async () => {
  if (releasesCache && Date.now() - releasesCache.at < RELEASES_TTL) return releasesCache.data;
  const res = await http.get('https://api.wordpress.org/core/version-check/1.7/').catch(() => null);
  const offers = res && res.status === 200 && Array.isArray(res.data?.offers) ? res.data.offers : [];
  const versions = offers.map(o => o.current).filter(v => /^\d+\.\d+/.test(v || ''));
  if (!versions.length) return null;
  const data = { latest: versions[0], versions };
  releasesCache = { at: Date.now(), data };
  return data;
};

const branchOf = (version) => version.split('.').slice(0, 2).join('.');

const getFeedVersion = async (base) => {
  const res = await http.get(`${base}/feed/`).catch(() => null);
  const match = res && typeof res.data === 'string' && res.data.match(/<generator>https?:\/\/wordpress\.org\/\?v=([\d.]+)<\/generator>/i);
  return match ? match[1] : null;
};

const handler = async (url) => {
  const home = await http.get(url);
  if (home.status >= 400) {
    throw new Error(`Received non-success response code: ${home.status}`);
  }
  const html = typeof home.data === 'string' ? home.data : '';
  const finalUrl = home.request?.res?.responseUrl || url;
  const base = new URL(finalUrl).origin;

  if (!WP_MARKERS.test(html)) {
    return { skipped: 'El sitio no parece estar hecho con WordPress' };
  }

  const [users, xmlrpcEnabled, feedVersion, releases] = await Promise.all([
    getUsers(base),
    isXmlRpcEnabled(base),
    getFeedVersion(base),
    getReleases(),
  ]);
  const version = findVersion(html) || feedVersion;

  return {
    isWordPress: true,
    version,
    latestVersion: releases?.latest || null,
    // Último parche de seguridad de la misma rama (p. ej. 6.5.13 para un sitio en 6.5.2)
    branchLatestVersion: (version && releases?.versions.find(v => branchOf(v) === branchOf(version))) || null,
    usersExposed: users.length > 0,
    users,
    xmlrpcEnabled,
  };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
