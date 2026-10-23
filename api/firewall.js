const axios = require('axios');
const middleware = require('./_common/middleware');

const hasWaf = (waf) => {
  return {
    hasWaf: true, waf,
  }
};

const handler = async (url) => {
  const fullUrl = url.startsWith('http') ? url : `http://${url}`;
  
  try {
    // validateStatus: los desafíos anti-bots (Deflect, Cloudflare) responden 403/503,
    // y justamente esa respuesta delata la protección
    const response = await axios.get(fullUrl, { validateStatus: () => true, timeout: 8000 });

    const headers = response.headers;
    const cookies = [].concat(headers['set-cookie'] || []).join(' ');
    const header = (name) => String(headers[name] || '');

    // Protección contra DDoS y CDN usadas por organizaciones de sociedad civil
    if (/deflect/i.test(cookies) || /deflect/i.test(header('server')) || headers['x-deflect-cache']) {
      return hasWaf('Deflect (eQualitie)');
    }
    if (/incap_ses|visid_incap/i.test(cookies) || headers['x-iinfo'] || /incapsula/i.test(header('x-cdn'))) {
      return hasWaf('Imperva Incapsula');
    }
    if (headers['cf-ray'] || /__cf_bm|cf_clearance/.test(cookies)) {
      return hasWaf('Cloudflare');
    }
    if (headers['x-amz-cf-id']) {
      return hasWaf('Amazon CloudFront');
    }
    if (/fastly/i.test(header('x-served-by') + header('via')) || headers['x-fastly-request-id']
      || (headers['x-timer'] && /^cache-/.test(header('x-served-by')))) {
      return hasWaf('Fastly');
    }
    if (headers['x-azure-ref']) {
      return hasWaf('Azure Front Door');
    }
    if (/bunnycdn/i.test(header('server'))) {
      return hasWaf('Bunny CDN');
    }
    if (/\bgoogle\b/i.test(header('via')) && /gfe|google/i.test(header('server'))) {
      return hasWaf('Google Cloud (Project Shield / Cloud Armor)');
    }

    if (headers['server'] && headers['server'].includes('cloudflare')) {
      return hasWaf('Cloudflare');
    }

    if (headers['x-powered-by'] && headers['x-powered-by'].includes('AWS Lambda')) {
      return hasWaf('AWS WAF');
    }

    if (headers['server'] && headers['server'].includes('AkamaiGHost')) {
      return hasWaf('Akamai');
    }

    if (headers['server'] && headers['server'].includes('Sucuri')) {
      return hasWaf('Sucuri');
    }

    if (headers['server'] && headers['server'].includes('BarracudaWAF')) {
      return hasWaf('Barracuda WAF');
    }

    if (headers['server'] && (headers['server'].includes('F5 BIG-IP') || headers['server'].includes('BIG-IP'))) {
      return hasWaf('F5 BIG-IP');
    }

    if (headers['x-sucuri-id'] || headers['x-sucuri-cache']) {
      return hasWaf('Sucuri CloudProxy WAF');
    }

    if (headers['server'] && headers['server'].includes('FortiWeb')) {
      return hasWaf('Fortinet FortiWeb WAF');
    }

    if (headers['server'] && headers['server'].includes('Imperva')) {
      return hasWaf('Imperva SecureSphere WAF');
    }

    if (headers['x-protected-by'] && headers['x-protected-by'].includes('Sqreen')) {
      return hasWaf('Sqreen');
    }

    if (headers['x-waf-event-info']) {
      return hasWaf('Reblaze WAF');
    }

    if (headers['set-cookie'] && headers['set-cookie'].includes('_citrix_ns_id')) {
      return hasWaf('Citrix NetScaler');
    }

    if (headers['x-denied-reason'] || headers['x-wzws-requested-method']) {
      return hasWaf('WangZhanBao WAF');
    }

    if (headers['x-webcoment']) {
      return hasWaf('Webcoment Firewall');
    }

    if (headers['server'] && headers['server'].includes('Yundun')) {
      return hasWaf('Yundun WAF');
    }

    if (headers['x-yd-waf-info'] || headers['x-yd-info']) {
      return hasWaf('Yundun WAF');
    }

    if (headers['server'] && headers['server'].includes('Safe3WAF')) {
      return hasWaf('Safe3 Web Application Firewall');
    }

    if (headers['server'] && headers['server'].includes('NAXSI')) {
      return hasWaf('NAXSI WAF');
    }

    if (headers['x-datapower-transactionid']) {
      return hasWaf('IBM WebSphere DataPower');
    }

    return {
      hasWaf: false,
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
