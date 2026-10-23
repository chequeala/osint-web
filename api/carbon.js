const https = require('https');
const http = require('http');
const middleware = require('./_common/middleware');

const handler = async (url) => {

  // First, get the size of the website's HTML
  const getHtmlSize = (url) => new Promise((resolve, reject) => {
    (url.startsWith('http:') ? http : https).get(url, { timeout: 8000 }, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        const sizeInBytes = Buffer.byteLength(data, 'utf8');
        resolve(sizeInBytes);
      });
    }).on('timeout', function () { this.destroy(new Error('El sitio no respondió en 8 segundos')); })
      .on('error', reject);
  });

  try {
    const sizeInBytes = await getHtmlSize(url);
    const apiUrl = `https://api.websitecarbon.com/data?bytes=${sizeInBytes}&green=0`;

    // Then use that size to get the carbon data
    const carbonData = await new Promise((resolve, reject) => {
      https.get(apiUrl, { timeout: 8000 }, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          // Un throw aquí no lo atrapa nadie y tumba la función (502)
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`websitecarbon.com respondió algo que no es JSON (HTTP ${res.statusCode})`));
          }
        });
      }).on('timeout', function () { this.destroy(new Error('websitecarbon.com no respondió en 8 segundos')); })
        .on('error', reject);
    });

    if (!carbonData.statistics || (carbonData.statistics.adjustedBytes === 0 && carbonData.statistics.energy === 0)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ skipped: 'Not enough info to get carbon data' }),
      };
    }

    carbonData.scanUrl = url;
    return carbonData;
  } catch (error) {
    // websitecarbon.com a veces bloquea o limita las consultas: no es un problema del sitio
    if (/websitecarbon\.com/.test(error.message)) return { skipped: error.message };
    throw new Error(`Error: ${error.message}`);
  }
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
