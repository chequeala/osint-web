const Wappalyzer = require('wappalyzer');
const middleware = require('./_common/middleware');
const { skipIfUnavailable } = require('./_common/unavailable');

const handler = async (url) => {
  const options = {};

  const wappalyzer = new Wappalyzer(options);

  try {
    await wappalyzer.init();
    const headers = {};
    const storage = {
      local: {},
      session: {},
    };
    const site = await wappalyzer.open(url, headers, storage);
    const results = await site.analyze();

    if (!results.technologies || results.technologies.length === 0) {
      throw new Error('Unable to find any technologies for site');
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  } finally {
    await wappalyzer.destroy();
  }
};

const handlerOrSkip = skipIfUnavailable(handler, 'Este servidor no tiene un navegador para detectar tecnologías.');

module.exports = middleware(handlerOrSkip);
module.exports.handler = middleware(handlerOrSkip);
