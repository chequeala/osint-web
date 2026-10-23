const axios = require('axios');
const psl = require('psl');
const middleware = require('./_common/middleware');

// ¿El sitio está bloqueado en algún país? Usa los datos abiertos de OONI
// (Open Observatory of Network Interference): mediciones que hacen voluntarias y
// voluntarios desde redes de todo el mundo. Solo se envía el dominio a OONI.
const OONI_API = 'https://api.ooni.io/api/v1/aggregation';
const DAYS = 90;
const MIN_MEASUREMENTS = 30;  // menos que esto no alcanza para concluir nada
const LIKELY_RATIO = 0.2;     // 20% de anomalías: posible bloqueo (OONI tiene falsos positivos)

const http = axios.create({ timeout: 8000, validateStatus: () => true });

const isoDate = (date) => date.toISOString().slice(0, 10);

const fetchByCountry = async (domain, since, until) => {
  const { status, data } = await http.get(OONI_API, {
    params: { domain, since, until, axis_x: 'probe_cc', test_name: 'web_connectivity' },
  });
  if (status !== 200 || !Array.isArray(data?.result)) throw new Error(`OONI respondió HTTP ${status}`);
  return data.result;
};

const handler = async (url) => {
  const hostname = new URL(url).hostname;
  const registered = psl.parse(hostname).domain || hostname;
  // OONI guarda la URL tal como está en las listas de prueba: con y sin www
  const domains = [...new Set([hostname, registered, `www.${registered}`])];

  const until = new Date();
  const since = new Date(until.getTime() - DAYS * 24 * 60 * 60 * 1000);
  const results = await Promise.all(domains.map(d => fetchByCountry(d, isoDate(since), isoDate(until)).catch(() => null)));
  if (results.every(r => r === null)) throw new Error('No se pudo consultar a OONI');

  // Sumar por país las mediciones de todas las variantes del dominio
  const byCountry = {};
  for (const rows of results.filter(Boolean)) {
    for (const row of rows) {
      if (!row.probe_cc || !row.measurement_count) continue;
      const c = byCountry[row.probe_cc] || (byCountry[row.probe_cc] = { country: row.probe_cc, measurements: 0, anomalies: 0, confirmed: 0 });
      c.measurements += row.measurement_count;
      c.anomalies += row.anomaly_count || 0;
      c.confirmed += row.confirmed_count || 0;
    }
  }

  const countries = Object.values(byCountry)
    .map(c => {
      const ratio = c.measurements ? c.anomalies / c.measurements : 0;
      const status = c.confirmed > 0 ? 'confirmed'
        : (c.measurements >= MIN_MEASUREMENTS && ratio >= LIKELY_RATIO) ? 'likely'
        : 'ok';
      return { ...c, ratio: Math.round(ratio * 1000) / 1000, status };
    })
    .sort((a, b) => (b.confirmed - a.confirmed) || (b.ratio - a.ratio) || (b.measurements - a.measurements));

  if (countries.length === 0) {
    return { skipped: `OONI no tiene mediciones de ${registered} en los últimos ${DAYS} días` };
  }

  return { domain: registered, days: DAYS, countries };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
