const dns = require('dns').promises;
const psl = require('psl');
const middleware = require('./_common/middleware');

// Que un nombre no tenga registros TXT es un resultado, no un error
const resolveTxtOrEmpty = (name) => dns.resolveTxt(name).catch(error => {
  if (['ENODATA', 'ENOTFOUND'].includes(error.code)) return [];
  throw error;
});

const handler = async (url, event, context) => {
  try {
    const parsedUrl = new URL(url);
    
    let txtRecords = await resolveTxtOrEmpty(parsedUrl.hostname);
    // www.ejemplo.org no suele tener TXT propios: los de verificación y SPF están en ejemplo.org
    const registered = psl.parse(parsedUrl.hostname).domain;
    if (!txtRecords.length && registered && registered !== parsedUrl.hostname) {
      txtRecords = await resolveTxtOrEmpty(registered);
    }
    if (!txtRecords.length) return { skipped: 'El dominio no tiene registros TXT' };

    // Parsing and formatting TXT records into a single object
    const readableTxtRecords = txtRecords.reduce((acc, recordArray) => {
      const recordObject = recordArray.reduce((recordAcc, recordString) => {
        const splitRecord = recordString.split('=');
        const key = splitRecord[0];
        const value = splitRecord.slice(1).join('=');
        return { ...recordAcc, [key]: value };
      }, {});
      return { ...acc, ...recordObject };
    }, {});

    return readableTxtRecords;

  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      throw new Error(`Invalid URL ${error}`);
    } else {
      throw error;
    }
  }
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
