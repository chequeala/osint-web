const axios = require('axios');
const { co2 } = require('@tgwf/co2');
const middleware = require('./_common/middleware');

// Huella de carbono estimada de la carga inicial del HTML, con el modelo Sustainable
// Web Design de CO2.js (Green Web Foundation). El cálculo es local; solo se consulta
// a Green Web Foundation si el hosting usa energía renovable.
// Antes se usaba websitecarbon.com, pero bloquea las IPs de Netlify (HTTP 403).
const http = axios.create({
  timeout: 8000,
  maxRedirects: 5,
  validateStatus: () => true,
  responseType: 'arraybuffer',
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OSINTWeb/1.0; +https://osint.chequea.la)' },
});

const getGreenHosting = async (hostname) => {
  const res = await axios.get(`https://api.thegreenwebfoundation.org/api/v3/greencheck/${encodeURIComponent(hostname)}`, {
    timeout: 8000, validateStatus: () => true,
  }).catch(() => null);
  if (!res || res.status !== 200 || typeof res.data?.green !== 'boolean') return null;
  return { green: res.data.green, hostedBy: res.data.hosted_by || null };
};

const handler = async (url) => {
  const [page, hosting] = await Promise.all([
    http.get(url),
    getGreenHosting(new URL(url).hostname),
  ]);
  if (page.status >= 400) throw new Error(`Received non-success response code: ${page.status}`);
  const bytes = page.data ? page.data.byteLength : 0;
  if (!bytes) return { skipped: 'La página no devolvió contenido para medir' };

  const grams = new co2({ model: 'swd' }).perVisit(bytes, hosting?.green === true);
  return {
    bytes,
    co2Grams: Number(grams.toPrecision(3)),
    greenHosting: hosting ? hosting.green : null,
    hostedBy: hosting?.hostedBy || null,
  };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
