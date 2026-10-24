const dns = require('dns').promises;
const psl = require('psl');
const middleware = require('./_common/middleware');

// Dominios parecidos al de la organización que ya están registrados: son los que
// se usan para phishing (amnistia.org.mx → amnistia-mx.org, arnnistia.org.mx...).
// Solo consulta DNS; no se envía el dominio a ningún servicio externo.
const MAX_VARIANTS = 160;
const CONCURRENCY = 25;
const resolver = new dns.Resolver({ timeout: 1500, tries: 1 });

const HOMOGLYPHS = [['o', '0'], ['0', 'o'], ['l', '1'], ['1', 'l'], ['i', 'l'], ['l', 'i'], ['m', 'rn'], ['rn', 'm'], ['w', 'vv'], ['d', 'cl'], ['e', '3'], ['a', '4']];
const TLDS = ['com', 'org', 'net', 'info', 'co', 'lat', 'online', 'site', 'xyz', 'app'];

const labelVariants = (label) => {
  const out = new Set();
  for (let i = 0; i < label.length; i++) {
    if (label.length > 3) out.add(label.slice(0, i) + label.slice(i + 1));               // omisión
    out.add(label.slice(0, i) + label[i] + label.slice(i));                               // repetición
    if (i < label.length - 1) out.add(label.slice(0, i) + label[i + 1] + label[i] + label.slice(i + 2)); // intercambio
    if (i > 0 && label[i] !== '-' && label[i - 1] !== '-') out.add(`${label.slice(0, i)}-${label.slice(i)}`); // guion
  }
  for (const [from, to] of HOMOGLYPHS) {
    let index = label.indexOf(from);
    while (index !== -1) {
      out.add(label.slice(0, index) + to + label.slice(index + from.length));
      index = label.indexOf(from, index + 1);
    }
  }
  out.delete(label);
  return [...out].filter(v => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(v));
};

// kind: 'tld' = mismo nombre con otra terminación (suele ser ruido o de la propia
// organización); 'typo' = nombre con error de tipeo o caracteres parecidos (más sospechoso)
const generate = (domain) => {
  const { sld, tld } = psl.parse(domain);
  if (!sld || !tld) return [];
  const variants = new Map();
  const tlds = new Set(TLDS);
  tld.split('.').forEach((part, i, parts) => tlds.add(parts.slice(i).join('.')));
  for (const t of tlds) variants.set(`${sld}.${t}`, 'tld');
  if (tld.includes('.')) variants.set(`${sld}-${tld.split('.').pop()}.org`, 'typo'); // amnistia.org.mx → amnistia-mx.org
  variants.set(`www${sld}.${tld}`, 'typo');
  for (const v of labelVariants(sld)) variants.set(`${v}.${tld}`, 'typo');
  variants.delete(domain);
  return [...variants].slice(0, MAX_VARIANTS).map(([name, kind]) => ({ name, kind }));
};

const isRegistered = async ({ name }) => {
  const [ns, a] = await Promise.all([
    resolver.resolveNs(name).catch(() => []),
    resolver.resolve4(name).catch(() => []),
  ]);
  return ns.length > 0 || a.length > 0;
};

const describe = async ({ name, kind }) => {
  const [a, mx] = await Promise.all([
    resolver.resolve4(name).catch(() => []),
    resolver.resolveMx(name).catch(() => []),
  ]);
  return { name, kind, ip: a[0] || null, hasMx: mx.length > 0 };
};

// Ejecuta en tandas para no saturar el DNS (y entrar en el tiempo de Netlify)
const inBatches = async (items, fn) => {
  const results = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    results.push(...await Promise.all(items.slice(i, i + CONCURRENCY).map(fn)));
  }
  return results;
};

const handler = async (url) => {
  const domain = psl.parse(new URL(url).hostname).domain;
  if (!domain) throw new Error('No se pudo determinar el dominio registrado');

  const variants = generate(domain);
  const flags = await inBatches(variants, isRegistered);
  const registered = variants.filter((_, i) => flags[i]);

  const details = await inBatches(registered, describe);
  // Primero los de tipeo con correo: los más útiles para phishing
  const score = (d) => (d.kind === 'typo' ? 2 : 0) + (d.hasMx ? 1 : 0);
  details.sort((x, y) => score(y) - score(x) || x.name.localeCompare(y.name));
  return { domain, label: psl.parse(domain).sld, checked: variants.length, registered: details };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
module.exports.generate = generate;
