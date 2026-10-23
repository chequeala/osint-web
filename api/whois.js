const net = require('net');
const psl = require('psl');
const middleware = require('./_common/middleware');

// whois.internic.net solo conoce .com, .net y .edu. IANA dice qué servidor
// whois corresponde a cada terminación (.la, .mx, .org, .org.br...) y se consulta ese.
const IANA_WHOIS = 'whois.iana.org';
const TIMEOUT_MS = 8000;

// Cada registro nombra los campos a su manera; se llevan a los nombres que usa la tarjeta
const FIELD_ALIASES = {
  Domain_Name: ['Domain_Name', 'domain', 'Domain'],
  Creation_Date: ['Creation_Date', 'Created_On', 'created', 'Registered_on', 'Registration_Time'],
  Updated_Date: ['Updated_Date', 'Last_Updated_On', 'changed', 'Last_updated', 'Last_Modified'],
  Registry_Expiry_Date: ['Registry_Expiry_Date', 'Expiration_Date', 'expires', 'Expiry_date', 'Registrar_Registration_Expiration_Date'],
  Registry_Domain_ID: ['Registry_Domain_ID'],
  Registrar_WHOIS_Server: ['Registrar_WHOIS_Server'],
  Registrar: ['Registrar', 'Sponsoring_Registrar'],
  Registrar_URL: ['Registrar_URL'],
  Registrar_IANA_ID: ['Registrar_IANA_ID'],
};

const NOT_FOUND = /no match|not found|no data found|no entries found|no se encontr|status:\s*free|object does not exist/i;

const queryWhois = (host, query) => new Promise((resolve, reject) => {
  const chunks = [];
  const client = net.createConnection({ port: 43, host }, () => client.write(query + '\r\n'));
  client.setTimeout(TIMEOUT_MS, () => {
    client.destroy();
    reject(new Error(`El servidor whois ${host} no respondió a tiempo`));
  });
  client.on('data', (chunk) => chunks.push(chunk));
  client.on('end', () => {
    // Algunos registros (p. ej. registro.br) responden en latin-1, no en UTF-8
    const buffer = Buffer.concat(chunks);
    const utf8 = buffer.toString('utf8');
    resolve(utf8.includes('\uFFFD') ? buffer.toString('latin1') : utf8);
  });
  client.on('error', reject);
});

const parseWhoisData = (data) => {
  const raw = {};
  for (const line of data.split(/\r?\n/)) {
    if (line.startsWith('%') || line.startsWith('#') || line.startsWith('>>>')) continue;
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim().replace(/\W+/g, '_');
    const value = line.slice(index + 1).replace(/\s#\d+$/, '').trim();
    // Se queda con la primera aparición (registro.br repite "created" para cada contacto)
    if (key && value && !(key in raw)) raw[key] = value;
  }

  const parsed = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const alias = aliases.find(a => raw[a]);
    if (alias) parsed[field] = raw[alias];
  }
  if (parsed.Registrar_URL && !/^https?:\/\//i.test(parsed.Registrar_URL)) {
    parsed.Registrar_URL = `https://${parsed.Registrar_URL}`;
  }
  return parsed;
};

const handler = async (url) => {
  let domain;
  try {
    domain = psl.parse(new URL(url.includes('://') ? url : `https://${url}`).hostname).domain;
  } catch (error) {
    throw new Error(`Unable to parse URL: ${error}`);
  }
  if (!domain) throw new Error('No se pudo determinar el dominio registrado');

  const tld = domain.split('.').pop();
  const ianaData = await queryWhois(IANA_WHOIS, tld);
  const whoisServer = (ianaData.match(/^whois:\s*(\S+)/m) || [])[1];
  if (!whoisServer) {
    return { skipped: `La terminación .${tld} no tiene un servidor whois público` };
  }

  const data = await queryWhois(whoisServer, domain);
  const parsed = parseWhoisData(data);
  if (Object.keys(parsed).length === 0) {
    return NOT_FOUND.test(data)
      ? { skipped: `${domain} no aparece en ${whoisServer}` }
      : { skipped: `${whoisServer} no entrega datos de ${domain}` };
  }

  // Se mantiene la clave internicData por compatibilidad con la tarjeta
  return { internicData: parsed, whoisServer };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
