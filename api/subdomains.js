const axios = require('axios');
const dns = require('dns').promises;
const psl = require('psl');
const middleware = require('./_common/middleware');

// Subdominios a partir de los registros públicos de certificados (Certificate
// Transparency). Lo más importante es detectar CNAME "colgantes": subdominios que
// apuntan a un servicio que ya no existe y que alguien más podría reclamar.
const http = axios.create({ timeout: 5000, validateStatus: () => true });
const MAX_SUBDOMAINS = 40;

const resolver = new dns.Resolver({ timeout: 2000, tries: 1 });

const fromCertSpotter = async (domain) => {
  const { status, data } = await http.get('https://api.certspotter.com/v1/issuances', {
    params: { domain, include_subdomains: true, expand: 'dns_names' },
  });
  if (status !== 200 || !Array.isArray(data)) throw new Error(`certspotter HTTP ${status}`);
  return data.flatMap(cert => cert.dns_names || []);
};

const fromCrtSh = async (domain) => {
  const { status, data } = await http.get('https://crt.sh/', { params: { q: `%.${domain}`, output: 'json' }, timeout: 4000 });
  if (status !== 200 || !Array.isArray(data)) throw new Error(`crt.sh HTTP ${status}`);
  return data.flatMap(cert => (cert.name_value || '').split('\n'));
};

const isMissing = (error) => ['ENOTFOUND', 'ENODATA', 'NXDOMAIN'].includes(error.code);

const inspect = async (name) => {
  const cname = await resolver.resolveCname(name).then(r => r[0]).catch(() => null);
  let active = false;
  let dangling = false;
  try {
    const addresses = await resolver.resolve4(name).catch(async (e) => {
      if (!isMissing(e)) throw e;
      return resolver.resolve6(name);
    });
    active = addresses.length > 0;
  } catch (error) {
    // El CNAME existe pero su destino no: el clásico caso de toma de subdominio
    if (cname && isMissing(error)) {
      dangling = await resolver.resolve4(cname).then(() => false).catch(e => isMissing(e));
    }
  }
  return { name, active, cname, dangling };
};

const handler = async (url) => {
  const domain = psl.parse(new URL(url).hostname).domain;
  if (!domain) throw new Error('No se pudo determinar el dominio registrado');

  let names;
  let source = 'certspotter';
  try {
    names = await fromCertSpotter(domain);
  } catch (first) {
    source = 'crt.sh';
    names = await fromCrtSh(domain).catch(second => {
      throw new Error(`No se pudieron consultar los registros de certificados (${first.message}; ${second.message})`);
    });
  }

  const unique = [...new Set(names
    .map(n => n.trim().toLowerCase().replace(/^\*\./, ''))
    .filter(n => n.endsWith(`.${domain}`) && n !== `www.${domain}`))].sort();

  if (unique.length === 0) {
    return { skipped: `No hay subdominios de ${domain} en los registros públicos de certificados` };
  }

  const subdomains = await Promise.all(unique.slice(0, MAX_SUBDOMAINS).map(inspect));
  return { domain, source, total: unique.length, subdomains };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
