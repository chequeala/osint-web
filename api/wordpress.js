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

// Plugins: los que aparecen en el código de la página y los que se ven en el índice de
// la API REST. La versión sale de sus archivos (?ver=6.1.7) o, si no, de su readme.txt.
// A WordPress.org solo se le envía el nombre del plugin, nunca el sitio.
const MAX_PLUGINS = 25;

// Espacio en /wp-json/ → nombre del plugin en WordPress.org, para los más usados
const REST_NAMESPACES = {
  'contact-form-7': 'contact-form-7', yoast: 'wordpress-seo', akismet: 'akismet', mc4wp: 'mailchimp-for-wp',
  monsterinsights: 'google-analytics-for-wordpress', 'wp-statistics': 'wp-statistics', redirection: 'redirection',
  'mv-grow-social': 'social-pug', wordfence: 'wordfence', jetpack: 'jetpack', elementor: 'elementor',
  wc: 'woocommerce', litespeed: 'litespeed-cache', rankmath: 'seo-by-rank-math', wpforms: 'wpforms-lite',
  'wp-rocket': 'wp-rocket', 'wp-smush': 'wp-smushit', 'wp-super-cache': 'wp-super-cache', 'the-events-calendar': 'the-events-calendar',
  'tribe': 'the-events-calendar', 'complianz': 'complianz-gdpr', 'sbi': 'instagram-feed', 'updraftplus': 'updraftplus',
};

const mostCommon = (values) => {
  const counts = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
};

// Si un plugin no declara versión, WordPress le pone la suya: esa no sirve
const findPlugins = (html, coreVersion) => {
  const text = html.replace(/\\\//g, '/'); // URLs dentro de JSON (https:\/\/...)
  const versions = {};
  const slugs = new Set();
  const re = /\/wp-content\/plugins\/([a-z0-9_-]+)\/([^"'\s<>)]*)/gi;
  let m;
  while ((m = re.exec(text))) {
    const slug = m[1].toLowerCase();
    slugs.add(slug);
    // Solo números con puntos ("6.1.7"): descarta códigos de caché como "1dfe7db394"
    const ver = (m[2].match(/[?&](?:ver|version)=(\d+(?:\.\d+)+)(?=[&#]|$)/i) || [])[1];
    if (ver && ver !== coreVersion) (versions[slug] = versions[slug] || []).push(ver);
  }
  return [...slugs].map(slug => ({ slug, version: versions[slug] ? mostCommon(versions[slug]) : null }));
};

const getRestPluginSlugs = async (base) => {
  const res = await http.get(`${base}/wp-json/`).catch(() => null);
  const namespaces = Array.isArray(res?.data?.namespaces) ? res.data.namespaces : [];
  return [...new Set(namespaces.map(ns => REST_NAMESPACES[ns.split('/')[0]]).filter(Boolean))];
};

const getReadmeVersion = async (base, slug) => {
  const res = await http.get(`${base}/wp-content/plugins/${slug}/readme.txt`, { timeout: 4000 }).catch(() => null);
  if (!res || res.status !== 200 || typeof res.data !== 'string') return null;
  return (res.data.match(/^\s*Stable tag:\s*(\d+(?:\.\d+)+)\s*$/im) || [])[1] || null;
};

// "Jetpack &#8211; AI Agents &amp; MCP, Security..." → "Jetpack"
const decodeEntities = (text) => text
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const shortName = (name) => (name ? decodeEntities(name).split(/\s+[–—|:-]\s+|:\s+/)[0].trim() : null);

const pluginInfoCache = new Map();
const getPluginInfo = async (slug) => {
  const cached = pluginInfoCache.get(slug);
  if (cached && Date.now() - cached.at < RELEASES_TTL) return cached.data;
  const res = await http.get('https://api.wordpress.org/plugins/info/1.2/', {
    timeout: 5000,
    params: { action: 'plugin_information', 'request[slug]': slug, 'request[fields][sections]': 0 },
  }).catch(() => null);
  if (!res || res.status >= 500 || !res.data || typeof res.data !== 'object') return null; // sin respuesta: no se sabe
  let data;
  if (res.data.version) data = { status: 'listed', latest: res.data.version, name: shortName(res.data.name) };
  else if (res.data.error === 'closed') data = { status: 'closed', name: shortName(res.data.name) };
  else data = { status: 'notListed' }; // de pago o propio del sitio
  pluginInfoCache.set(slug, { at: Date.now(), data });
  return data;
};

const comparePluginVersions = (a, b) => {
  const pa = a.split(/[.-]/).map(n => parseInt(n, 10) || 0);
  const pb = b.split(/[.-]/).map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
};

const getPlugins = async (base, html, coreVersion) => {
  const fromHtml = findPlugins(html, coreVersion);
  const fromRest = (await getRestPluginSlugs(base))
    .filter(slug => !fromHtml.some(p => p.slug === slug))
    .map(slug => ({ slug, version: null }));
  const plugins = [...fromHtml, ...fromRest].slice(0, MAX_PLUGINS);
  return Promise.all(plugins.map(async (plugin) => {
    const [version, info] = await Promise.all([
      plugin.version || getReadmeVersion(base, plugin.slug),
      getPluginInfo(plugin.slug),
    ]);
    const result = { slug: plugin.slug, name: info?.name || null, version: version || null, latest: info?.latest || null, status: info?.status || 'unknown' };
    // Una versión mayor que la publicada no es del plugin (p. ej. la de un tema o una librería)
    if (result.version && result.latest && comparePluginVersions(result.version, result.latest) > 0) result.version = null;
    if (result.status === 'listed' && result.version) {
      result.status = comparePluginVersions(result.version, result.latest) < 0 ? 'outdated' : 'current';
    }
    return result;
  }));
};

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

  // Páginas de "verifica que no eres un robot" (SiteGround, Cloudflare...): no se puede
  // saber si es WordPress, y decir que no lo es sería falso
  if (html.length < 5000 && /sgcaptcha|cf-chl|challenge-platform|Just a moment\.\.\./i.test(html)) {
    return { skipped: 'El sitio respondió con una verificación anti-robots; no se pudo revisar WordPress' };
  }

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
  const plugins = await getPlugins(base, html, version).catch(() => []);

  return {
    isWordPress: true,
    version,
    latestVersion: releases?.latest || null,
    // Último parche de seguridad de la misma rama (p. ej. 6.5.13 para un sitio en 6.5.2)
    branchLatestVersion: (version && releases?.versions.find(v => branchOf(v) === branchOf(version))) || null,
    usersExposed: users.length > 0,
    users,
    xmlrpcEnabled,
    plugins,
  };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
module.exports.findPlugins = findPlugins;
