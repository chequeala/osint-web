const axios = require('axios');
const middleware = require('./_common/middleware');

// La ubicación se consulta desde el servidor, para que el navegador de quien usa
// veni no hable con terceros. ipwho.is primero; ipapi.co limita mucho sin cuenta.
const http = axios.create({ timeout: 8000, validateStatus: () => true });

const fromIpWhoIs = async (ip) => {
  const { data } = await http.get(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (!data || data.success === false) throw new Error(data?.message || 'ipwho.is sin datos');
  // Mismo formato que ipapi.co, que es lo que espera getLocation()
  return {
    city: data.city,
    region: data.region,
    region_code: data.region_code,
    country_name: data.country,
    country_code: data.country_code,
    postal: data.postal,
    latitude: data.latitude,
    longitude: data.longitude,
    org: data.connection?.org || data.connection?.isp,
    timezone: data.timezone?.id,
    currency: data.currency?.code,
    currency_name: data.currency?.name,
  };
};

const fromIpApi = async (ip) => {
  const { data } = await http.get(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
  if (!data || data.error) throw new Error(data?.reason || 'ipapi.co sin datos');
  return data;
};

const handler = async (url) => {
  const ip = new URL(url).hostname.replace(/^\[|\]$/g, '');
  try {
    return await fromIpWhoIs(ip);
  } catch (first) {
    try {
      return await fromIpApi(ip);
    } catch (second) {
      throw new Error(`No se pudo ubicar la IP (${first.message}; ${second.message})`);
    }
  }
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
