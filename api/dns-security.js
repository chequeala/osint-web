const axios = require('axios');
const dns = require('dns').promises;
const psl = require('psl');
const middleware = require('./_common/middleware');

// Registros DNS de seguridad que casi nadie configura:
// - CAA: qué autoridades pueden emitir certificados para el dominio
// - MTA-STS: obliga a que el correo que llega al dominio viaje cifrado
// - TLS-RPT: dirección para recibir reportes cuando ese cifrado falla
const isMissing = (error) => ['ENODATA', 'ENOTFOUND'].includes(error.code);
const orEmpty = (promise) => promise.catch(error => { if (isMissing(error)) return []; throw error; });

// La política de MTA-STS se publica en https://mta-sts.<dominio>/.well-known/mta-sts.txt
const fetchMtaStsPolicy = async (domain) => {
  try {
    const { status, data } = await axios.get(`https://mta-sts.${domain}/.well-known/mta-sts.txt`, {
      timeout: 5000, maxRedirects: 0, validateStatus: () => true, responseType: 'text',
    });
    if (status !== 200 || typeof data !== 'string') return null;
    const mode = (data.match(/^mode:\s*(\w+)/mi) || [])[1];
    return mode ? mode.toLowerCase() : null;
  } catch {
    return null;
  }
};

const handler = async (url) => {
  const domain = psl.parse(new URL(url).hostname).domain;
  if (!domain) throw new Error('No se pudo determinar el dominio registrado');

  const [caa, mx, mtaStsTxt, tlsRptTxt] = await Promise.all([
    orEmpty(dns.resolveCaa(domain)),
    orEmpty(dns.resolveMx(domain)),
    orEmpty(dns.resolveTxt(`_mta-sts.${domain}`)),
    orEmpty(dns.resolveTxt(`_smtp._tls.${domain}`)),
  ]);

  const mtaStsRecord = mtaStsTxt.map(r => r.join('')).find(r => /^v=STSv1/i.test(r)) || null;
  const tlsRptRecord = tlsRptTxt.map(r => r.join('')).find(r => /^v=TLSRPTv1/i.test(r)) || null;
  const mtaStsMode = mtaStsRecord ? await fetchMtaStsPolicy(domain) : null;

  return {
    domain,
    caa: caa.map(record => {
      const [tag] = Object.keys(record).filter(k => k !== 'critical');
      return { tag, value: record[tag] };
    }),
    receivesMail: mx.length > 0,
    mtaSts: mtaStsRecord ? { record: mtaStsRecord, mode: mtaStsMode } : null,
    tlsRpt: tlsRptRecord,
  };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
