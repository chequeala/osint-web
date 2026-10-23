const traceroute = require('traceroute');
const url = require('url');
const middleware = require('./_common/middleware');
const { skipIfUnavailable } = require('./_common/unavailable');

const handler = async (urlString, context) => {
  // Parse the URL and get the hostname
  const urlObject = url.parse(urlString);
  const host = urlObject.hostname;

  if (!host) {
    throw new Error('Invalid URL provided');
  }

  // Traceroute with callback
  const result = await new Promise((resolve, reject) => {
    traceroute.trace(host, (err, hops) => {
      if (err || !hops) {
        reject(err || new Error('No hops found'));
      } else {
        resolve(hops);
      }
    });
  });

  return {
    message: "Traceroute completed!",
    result,
  };
};

const handlerOrSkip = skipIfUnavailable(handler, 'Este servidor no tiene traceroute instalado.');

module.exports = middleware(handlerOrSkip);
module.exports.handler = middleware(handlerOrSkip);
