const { http, https } = require('follow-redirects');
const { URL } = require('url');
const middleware = require('./_common/middleware');

// RFC 9116: la ubicación oficial es /.well-known/, la raíz es la antigua
const SECURITY_TXT_PATHS = [
  '/.well-known/security.txt',
  '/security.txt',
];

const parseResult = (result) => {
  let output = {};
  let counts = {};
  const lines = result.split('\n');
  const regex = /^([^:]+):\s*(.+)$/;
  
  for (const line of lines) {
    if (!line.startsWith("#") && !line.startsWith("-----") && line.trim() !== '') {
      const match = line.match(regex);
      if (match && match.length > 2) {
        let key = match[1].trim();
        const value = match[2].trim();
        if (output.hasOwnProperty(key)) {
          counts[key] = counts[key] ? counts[key] + 1 : 1;
          key += counts[key];
        }
        output[key] = value;
      }
    }
  }
  
  return output;
};

const isPgpSigned = (result) => {
  if (result.includes('-----BEGIN PGP SIGNED MESSAGE-----')) {
    return true;
  }
  return false;
};

const handler = async (urlParam) => {

  let url;
  try {
    url = new URL(urlParam.includes('://') ? urlParam : 'https://' + urlParam);
  } catch (error) {
    throw new Error('Invalid URL format');
  }
  url.pathname = '';
  
  // Las dos ubicaciones a la vez, para no sumar las esperas; gana la primera de la lista
  const results = await Promise.all(SECURITY_TXT_PATHS.map(path => fetchSecurityTxt(url, path).catch(error => error)));
  for (const [index, result] of results.entries()) {
    if (result instanceof Error || !result || /<html/i.test(result)) continue;
    const path = SECURITY_TXT_PATHS[index];
    return {
      isPresent: true,
      foundIn: path,
      content: result,
      isPgpSigned: isPgpSigned(result),
      fields: parseResult(result),
    };
  }
  // Si ninguna ubicación respondió (no es lo mismo que "no tiene security.txt")
  if (results.every(result => result instanceof Error)) throw new Error(results[0].message);

  return { isPresent: false };
};

// Sin límite de espera, un sitio que no responde dejaba la función colgada hasta
// que Netlify la cortaba (504). Un security.txt real pesa unos pocos KB.
const TIMEOUT_MS = 8000;
const MAX_BYTES = 64 * 1024;

async function fetchSecurityTxt(baseURL, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseURL);
    const req = (url.protocol === 'http:' ? http : https).get(url.toString(), { timeout: TIMEOUT_MS }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
          if (data.length > MAX_BYTES) req.destroy(new Error('El security.txt es demasiado grande'));
        });
        res.on('end', () => {
          resolve(data);
        });
      } else {
        res.resume();
        resolve(null);
      }
    });
    req.on('timeout', () => req.destroy(new Error(`El sitio no respondió en ${TIMEOUT_MS / 1000} segundos`)));
    req.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
