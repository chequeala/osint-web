const tls = require('tls');
const http = require('http');
const middleware = require('./_common/middleware');

// Siempre devuelve un diagnóstico, también cuando el certificado no es válido:
// antes ese caso era un error y la tarjeta (y el aviso del resumen) desaparecían.
const TIMEOUT_MS = 8000;

// Códigos de OpenSSL/Node agrupados en problemas que se puedan explicar
const problemFromCode = (code = '') => {
  if (code === 'CERT_HAS_EXPIRED') return 'expired';
  if (code === 'CERT_NOT_YET_VALID') return 'notYetValid';
  if (['DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN'].includes(code)) return 'selfSigned';
  if (['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'UNABLE_TO_GET_ISSUER_CERT'].includes(code)) return 'incompleteChain';
  return 'untrusted';
};

const certNames = (cert) => {
  const alt = (cert.subjectaltname || '').split(',').map(s => s.trim().replace(/^DNS:/, '')).filter(Boolean);
  return [...new Set([cert.subject?.CN, ...alt].filter(Boolean))];
};

const getCertificate = (hostname, port) => new Promise((resolve, reject) => {
  // rejectUnauthorized: false para poder leer el certificado aunque no sea válido;
  // la validación se hace a mano abajo
  const socket = tls.connect({ host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: TIMEOUT_MS }, () => {
    const cert = socket.getPeerCertificate();
    const authorizationError = socket.authorizationError ? String(socket.authorizationError.code || socket.authorizationError) : null;
    socket.end();
    resolve({ cert, authorizationError });
  });
  socket.on('timeout', () => socket.destroy(new Error('El puerto 443 no respondió a tiempo')));
  socket.on('error', reject);
});

// ¿http:// lleva a https://? Sin HSTS ni redirección, quien escribe la dirección sin "https" navega sin cifrar
const checkHttpRedirect = (hostname) => new Promise((resolve) => {
  const req = http.get({ host: hostname, path: '/', timeout: TIMEOUT_MS, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VeniOSINT/1.0)' } }, (res) => {
    res.resume();
    const location = res.headers.location || '';
    resolve(res.statusCode >= 300 && res.statusCode < 400 ? /^https:\/\//i.test(location) : false);
  });
  req.on('timeout', () => req.destroy());
  req.on('error', () => resolve(null)); // sin http: no se puede saber
});

const handler = async (urlString) => {
  const parsedUrl = new URL(urlString);
  const hostname = parsedUrl.hostname;
  const port = parsedUrl.protocol === 'https:' && parsedUrl.port ? parsedUrl.port : 443;

  const httpRedirectsToHttps = await checkHttpRedirect(hostname);

  let result;
  try {
    result = await getCertificate(hostname, port);
  } catch (error) {
    // Sin HTTPS: puerto cerrado, rechazo o sin respuesta
    return { valid: false, problems: ['noHttps'], error: error.message, httpRedirectsToHttps };
  }

  const { cert, authorizationError } = result;
  if (!cert || Object.keys(cert).length === 0) {
    return { valid: false, problems: ['noCertificate'], httpRedirectsToHttps };
  }

  const problems = [];
  // Node no compara el nombre cuando rejectUnauthorized es false: hay que hacerlo aparte
  if (tls.checkServerIdentity(hostname, cert)) problems.push('nameMismatch');
  if (authorizationError) problems.push(problemFromCode(authorizationError));

  const { raw, issuerCertificate, ...certWithoutRaw } = cert;
  return {
    ...certWithoutRaw,
    valid: problems.length === 0,
    problems,
    authorizationError,
    certNames: certNames(cert),
    httpRedirectsToHttps,
  };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
