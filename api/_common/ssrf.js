// Protección contra SSRF: OSINT Web descarga direcciones que escribe cualquier persona,
// así que su servidor nunca debe conectarse a redes privadas, locales o de
// metadatos (127.0.0.1, 10.x, 192.168.x, 169.254.169.254, ::1...).
//
// Se aplica a todas las conexiones salientes del proceso (net.Socket#connect, que
// usan http, https, tls, axios, got...):
// - conexión directa a una IP privada (p. ej. tras una redirección a http://127.0.0.1)
// - conexión a un dominio que resuelve a una IP privada (se valida al conectar,
//   así que un cambio de DNS entre la revisión y la conexión no sirve de nada)
// Las consultas de registros DNS (dns.resolve*) no se tocan: solo leen datos.
const net = require('net');
const dns = require('dns');

const blockList = new net.BlockList();
[
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].forEach(([address, prefix]) => blockList.addSubnet(address, prefix, 'ipv4'));
[
  ['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['2001:db8::', 32], ['64:ff9b::', 96],
].forEach(([address, prefix]) => blockList.addSubnet(address, prefix, 'ipv6'));

const isBlockedIp = (ip) => {
  const family = net.isIP(ip);
  if (!family) return false;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i); // IPv4 escrita como IPv6
  if (mapped) return blockList.check(mapped[1], 'ipv4');
  return blockList.check(ip, family === 4 ? 'ipv4' : 'ipv6');
};

// En AWS Lambda (Netlify) el propio runtime recibe cada invocación por
// 127.0.0.1:9001; bloquearla rompería todas las funciones
const isRuntimeApi = (host, port) => {
  const runtimeApi = process.env.AWS_LAMBDA_RUNTIME_API;
  return !!runtimeApi && `${host}:${port}` === runtimeApi;
};

const notAllowed = (target) => Object.assign(
  new Error(`Dirección no permitida: ${target} apunta a una red privada o local`),
  { code: 'ENOTALLOWED' },
);

// Envuelve una función de resolución (la de Node o la que traiga una librería)
// para rechazar resultados privados
const guardLookup = (lookup) => function (hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  else if (typeof options === 'number') options = { family: options };
  return lookup.call(this, hostname, options, (err, address, family) => {
    if (err) return callback(err, address, family);
    const addresses = Array.isArray(address) ? address.map(a => (typeof a === 'string' ? a : a.address)) : [address];
    if (addresses.some(isBlockedIp)) return callback(notAllowed(hostname));
    return callback(null, address, family);
  });
};

// Solo se controlan las conexiones salientes: modificar dns.lookup de forma global
// también afectaría a los servidores que escuchan en 127.0.0.1
if (!net.Socket.prototype.connect.__osintWebGuarded) {
  const originalConnect = net.Socket.prototype.connect;
  const guardedConnect = function (...args) {
    // net.connect() pasa los argumentos ya normalizados como [opciones, callback]
    const first = Array.isArray(args[0]) ? args[0][0] : args[0];
    const options = first && typeof first === 'object' ? first : null;
    const host = options ? options.host : (typeof args[1] === 'string' ? args[1] : undefined);
    const port = options ? options.port : args[0];

    if (host && net.isIP(host)) {
      if (isBlockedIp(host) && !isRuntimeApi(host, port)) {
        process.nextTick(() => this.destroy(notAllowed(host)));
        return this;
      }
    } else if (host && options && !options.path) {
      // Nombre de dominio: se valida la IP a la que resuelve justo antes de conectar
      options.lookup = guardLookup(options.lookup || dns.lookup);
    } else if (host && !options) {
      // Forma connect(puerto, host): se reescribe como objeto para poder validar
      const [, , ...rest] = args;
      return guardedConnect.call(this, { port, host }, ...rest);
    }
    return originalConnect.apply(this, args);
  };
  guardedConnect.__osintWebGuarded = true;
  net.Socket.prototype.connect = guardedConnect;
}

// Revisión previa del dominio a analizar, para responder con un error claro
const assertPublicTarget = async (url) => {
  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw notAllowed(hostname);
    return;
  }
  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (addresses.some(a => isBlockedIp(a.address))) throw notAllowed(hostname);
  } catch (error) {
    if (error.code === 'ENOTALLOWED') throw error;
    // Otros errores (p. ej. dominio sin registro A) los maneja cada prueba
  }
};

module.exports = { assertPublicTarget, isBlockedIp };
