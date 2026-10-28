const middleware = require('./_common/middleware');

const dns = require('dns').promises;
const psl = require('psl');
const URL = require('url-parse');

// Selectores DKIM más comunes (no hay forma de listarlos todos desde fuera)
const DKIM_SELECTORS = ['default', 'google', 'selector1', 'selector2', 'k1', 'k2', 's1', 's2', 'mail', 'dkim', 'smtp', 'mxvault', 'protonmail', 'protonmail2', 'zoho', 'mandrill', 'everlytickey1'];

// "No existe" solo si el DNS lo dice; otros fallos (timeout, REFUSED) no deben verse como un ❌
const isMissing = (error) => ['ENODATA', 'ENOTFOUND'].includes(error.code);
const orEmpty = (promise) => promise.catch(error => { if (isMissing(error)) return []; throw error; });
const resolveTxtOrEmpty = (name) => orEmpty(dns.resolveTxt(name));

// Selector DKIM que indica la persona (?dkim=...), además de los comunes
const customSelector = (event) => {
  const value = event?.query?.dkim ?? event?.queryStringParameters?.dkim;
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,62}$/i.test(value) ? value.toLowerCase() : null;
};

// MX, TXT del dominio y los de DMARC y DKIM, que viven en subdominios
const lookupMail = async (domain, selectors, registered) => {
  // Un dominio sin MX igual puede tener SPF/DMARC que impidan suplantarlo
  const mxRecords = await orEmpty(dns.resolveMx(domain));
  const [rootTxt, dmarcTxt, ...dkimTxt] = await Promise.all([
    resolveTxtOrEmpty(domain),
    resolveTxtOrEmpty(`_dmarc.${domain}`),
    ...selectors.map(sel => resolveTxtOrEmpty(`${sel}._domainkey.${domain}`)),
  ]);
  const dkimSelectors = selectors.filter((_, i) => dkimTxt[i].some(r => r.join('').includes('p=')));
  let dmarc = dmarcTxt.filter(r => r.join('').startsWith('v=DMARC1'));
  // Lo que el nombre tiene por sí mismo, sin contar el DMARC heredado
  const hasOwnMail = mxRecords.length > 0 || rootTxt.length > 0 || dmarc.length > 0 || dkimSelectors.length > 0;
  // Regla de DMARC (RFC 7489): sin registro propio, el subdominio usa el del dominio principal
  if (!dmarc.length && registered && registered !== domain) {
    dmarc = (await resolveTxtOrEmpty(`_dmarc.${registered}`)).filter(r => r.join('').startsWith('v=DMARC1'));
  }
  const txtRecords = [
    ...rootTxt,
    ...dmarc,
    ...dkimSelectors.map(sel => [`v=DKIM1; selector=${sel}`]),
  ];
  return { mxRecords, txtRecords, dkimSelectors, hasOwnMail };
};

const handler = async (url, event, context) => {
  const extraSelector = customSelector(event);
  const selectors = extraSelector && !DKIM_SELECTORS.includes(extraSelector) ? [...DKIM_SELECTORS, extraSelector] : DKIM_SELECTORS;
  try {
    let domain = new URL(url).hostname || new URL(url).pathname;
    const registered = psl.parse(domain).domain;
    let { mxRecords, txtRecords, dkimSelectors, hasOwnMail } = await lookupMail(domain, selectors, registered);

    // www.ejemplo.org casi nunca tiene correo propio: está en ejemplo.org
    if (!hasOwnMail && registered && registered !== domain) {
      domain = registered;
      ({ mxRecords, txtRecords, dkimSelectors } = await lookupMail(domain, selectors, registered));
    }
    if (mxRecords.length === 0 && txtRecords.length === 0) {
      return { skipped: 'No mail server in use on this domain' };
    }

    // Filter for only email related TXT records (SPF, DKIM, DMARC, and certain provider verifications)
    const emailTxtRecords = txtRecords.filter(record => {
      const recordString = record.join('');
      return (
        recordString.startsWith('v=spf1') ||
        recordString.startsWith('v=DKIM1') ||
        recordString.startsWith('v=DMARC1') ||
        recordString.startsWith('protonmail-verification=') ||
        recordString.startsWith('google-site-verification=') || // Google Workspace
        recordString.startsWith('MS=') || // Microsoft 365
        recordString.startsWith('zoho-verification=') || // Zoho
        recordString.startsWith('titan-verification=') || // Titan
        recordString.includes('bluehost.com') // BlueHost
      );
    });

    // Identify specific mail services
    const mailServices = emailTxtRecords.map(record => {
      const recordString = record.join('');
      if (recordString.startsWith('protonmail-verification=')) {
        return { provider: 'ProtonMail', value: recordString.split('=')[1] };
      } else if (recordString.startsWith('google-site-verification=')) {
        return { provider: 'Google Workspace', value: recordString.split('=')[1] };
      } else if (recordString.startsWith('MS=')) {
        return { provider: 'Microsoft 365', value: recordString.split('=')[1] };
      } else if (recordString.startsWith('zoho-verification=')) {
        return { provider: 'Zoho', value: recordString.split('=')[1] };
      } else if (recordString.startsWith('titan-verification=')) {
        return { provider: 'Titan', value: recordString.split('=')[1] };
      } else if (recordString.includes('bluehost.com')) {
        return { provider: 'BlueHost', value: recordString };
      } else {
        return null;
      }
    }).filter(record => record !== null);

    // Check MX records for Yahoo
    const yahooMx = mxRecords.filter(record => record.exchange.includes('yahoodns.net'));
    if (yahooMx.length > 0) {
      mailServices.push({ provider: 'Yahoo', value: yahooMx[0].exchange });
    }

    return {
        domain,
        mxRecords,
        txtRecords: emailTxtRecords,
        mailServices,
        dkimSelectors,
        ...(extraSelector && { customSelector: extraSelector }),
      };
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return { skipped: 'No mail server in use on this domain' };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
