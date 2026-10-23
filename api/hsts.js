const https = require('https');
const middleware = require('./_common/middleware');

const handler = async (url, event, context) => {
  const errorResponse = (message, statusCode = 500) => {
    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: message }),
    };
  };
  const hstsIncompatible = (message, compatible = false, hstsHeader = null ) => {
    return { message, compatible, hstsHeader };
  };


  // HSTS solo se envía por https, así que se revisa esa versión aunque se escriba http://
  url = url.replace(/^http:\/\//i, 'https://');

  return new Promise((resolve, reject) => {
    // Sin límite, un sitio que no responde dejaba la función colgada hasta el corte de Netlify
    const req = https.request(url, { timeout: 8000 }, res => {
      res.resume();
      const headers = res.headers;
      const hstsHeader = headers['strict-transport-security'];

      if (!hstsHeader) {
        resolve(hstsIncompatible(`Site does not serve any HSTS headers.`));
      } else {
        const maxAgeMatch = hstsHeader.match(/max-age=(\d+)/);
        // Las directivas no distinguen mayúsculas (github.com envía "includeSubdomains")
        const directives = hstsHeader.toLowerCase();
        const includesSubDomains = directives.includes('includesubdomains');
        const preload = directives.includes('preload');

        if (!maxAgeMatch || parseInt(maxAgeMatch[1]) < 10886400) {
          resolve(hstsIncompatible(`HSTS max-age is less than 10886400.`, false, hstsHeader));
        } else if (!includesSubDomains) {
          resolve(hstsIncompatible(`HSTS header does not include all subdomains.`, false, hstsHeader));
        } else if (!preload) {
          resolve(hstsIncompatible(`HSTS header does not contain the preload directive.`, false, hstsHeader));
        } else {
          resolve(hstsIncompatible(`Site is compatible with the HSTS preload list!`, true, hstsHeader));
        }
      }
    });

    req.on('timeout', () => {
      req.destroy(new Error('El sitio no respondió en 8 segundos'));
    });

    req.on('error', (error) => {
      // Sin un HTTPS válido el navegador ignora HSTS; el problema real lo muestra la prueba ssl
      if (/certificate|self[- ]signed|UNABLE_TO_VERIFY|CERT_|altname|EPROTO/i.test(error.message)) {
        return resolve({ skipped: 'El certificado HTTPS no es válido, así que HSTS no tiene efecto. Revisa la tarjeta del certificado SSL.' });
      }
      resolve(errorResponse(`Error making request: ${error.message}`));
    });

    req.end();
  });
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);

