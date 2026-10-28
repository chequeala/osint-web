const axios = require('axios');
const cheerio = require('cheerio');
const middleware = require('./_common/middleware');

// Contenido mixto: recursos que se cargan por http:// dentro de una página https://.
// Los "activos" (scripts, hojas de estilo, iframes, formularios) los bloquea el
// navegador y la página se rompe; los "pasivos" (imágenes, audio, video) generan
// un aviso de "no seguro" y pueden ser alterados en el camino.
const ACTIVE = [
  ['script[src]', 'src'], ['link[rel~="stylesheet"][href]', 'href'], ['iframe[src]', 'src'],
  ['form[action]', 'action'], ['object[data]', 'data'], ['embed[src]', 'src'],
];
const PASSIVE = [['img[src]', 'src'], ['audio[src]', 'src'], ['video[src]', 'src'], ['source[src]', 'src']];
const MAX_ITEMS = 20;

const handler = async (url) => {
  if (!/^https:\/\//i.test(url)) {
    return { skipped: 'El sitio no se cargó por HTTPS, así que no aplica el contenido mixto' };
  }
  const response = await axios.get(url, {
    timeout: 8000,
    maxContentLength: 5 * 1024 * 1024,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OSINTWeb/1.0; +https://osint.chequea.la)' },
  });
  // Si terminó en http:// (redirección), no hay "contenido mixto" sino falta de HTTPS
  const finalUrl = response.request?.res?.responseUrl || url;
  if (!/^https:\/\//i.test(finalUrl)) {
    return { skipped: 'El sitio redirige a http://, así que no aplica el contenido mixto' };
  }
  if (typeof response.data !== 'string') {
    return { skipped: 'La página no devolvió HTML' };
  }

  const $ = cheerio.load(response.data);
  const collect = (rules) => {
    const found = new Set();
    for (const [selector, attr] of rules) {
      $(selector).each((_, el) => {
        const value = ($(el).attr(attr) || '').trim();
        if (/^http:\/\//i.test(value)) found.add(value);
      });
    }
    return [...found];
  };

  const active = collect(ACTIVE);
  const passive = collect(PASSIVE);
  // De paso: dirección .onion declarada en el HTML (la cabecera la ve la prueba de cabeceras)
  const onionMeta = $('meta').filter((_, el) => /^onion-location$/i.test($(el).attr('http-equiv') || '')).attr('content');
  return {
    ...(onionMeta && /\.onion(\/|$)/i.test(onionMeta) && { onionLocation: onionMeta }),
    active: active.slice(0, MAX_ITEMS),
    passive: passive.slice(0, MAX_ITEMS),
    activeCount: active.length,
    passiveCount: passive.length,
  };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
