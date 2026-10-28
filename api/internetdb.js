const axios = require('axios');
const middleware = require('./_common/middleware');

// Puertos, nombres de host, software y vulnerabilidades conocidas de la IP según
// InternetDB, la base gratuita de Shodan (sin clave). Se consulta desde el servidor,
// para que el navegador de quien usa OSINT Web no hable con terceros.
const http = axios.create({ timeout: 8000, validateStatus: () => true });

const handler = async (url) => {
  const ip = new URL(url).hostname.replace(/^\[|\]$/g, '');
  const res = await http.get(`https://internetdb.shodan.io/${encodeURIComponent(ip)}`);
  // 404: Shodan no tiene datos de esa IP, no es un error del sitio
  if (res.status === 404) return { skipped: 'Shodan no tiene datos de esta IP' };
  if (res.status !== 200 || !res.data || typeof res.data !== 'object') {
    throw new Error(`InternetDB respondió HTTP ${res.status}`);
  }
  const { ports = [], hostnames = [], cpes = [], vulns = [], tags = [] } = res.data;
  return { ip, ports, hostnames, cpes, vulns, tags };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
