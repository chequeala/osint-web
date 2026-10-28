const middleware = require('./_common/middleware');

const axios = require('axios');
const cheerio = require('cheerio');

// La imagen se descarga desde el servidor y se entrega incrustada (data:): si la
// cargara el navegador, el sitio analizado vería la IP de quien usa OSINT Web
const MAX_IMAGE_BYTES = 500 * 1024;
const IMAGE_TYPES = /^image\/(png|jpe?g|gif|webp|avif|svg\+xml)$/i;

const fetchImageData = async (imageUrl, pageUrl) => {
  try {
    const absolute = new URL(imageUrl, pageUrl);
    if (!/^https?:$/.test(absolute.protocol)) return null;
    const res = await axios.get(absolute.toString(), {
      responseType: 'arraybuffer', timeout: 5000, maxContentLength: MAX_IMAGE_BYTES, maxRedirects: 3,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OSINTWeb/1.0; +https://osint.chequea.la)' },
    });
    const type = String(res.headers['content-type'] || '').split(';')[0].trim();
    if (!IMAGE_TYPES.test(type)) return null;
    return `data:${type};base64,${Buffer.from(res.data).toString('base64')}`;
  } catch {
    return null; // muy grande, no es imagen o no respondió: se muestra solo la URL
  }
};

const handler = async (url) => {
  
  // Check if url includes protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }
  
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    const metadata = {
      // Basic meta tags
      title: $('head title').text(),
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      canonicalUrl: $('link[rel="canonical"]').attr('href'),

      // OpenGraph Protocol
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogType: $('meta[property="og:type"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      ogUrl: $('meta[property="og:url"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      ogSiteName: $('meta[property="og:site_name"]').attr('content'),
      
      // Twitter Cards
      twitterCard: $('meta[name="twitter:card"]').attr('content'),
      twitterSite: $('meta[name="twitter:site"]').attr('content'),
      twitterCreator: $('meta[name="twitter:creator"]').attr('content'),
      twitterTitle: $('meta[name="twitter:title"]').attr('content'),
      twitterDescription: $('meta[name="twitter:description"]').attr('content'),
      twitterImage: $('meta[name="twitter:image"]').attr('content'),

      // Misc
      themeColor: $('meta[name="theme-color"]').attr('content'),
      robots: $('meta[name="robots"]').attr('content'),
      googlebot: $('meta[name="googlebot"]').attr('content'),
      generator: $('meta[name="generator"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      author: $('meta[name="author"]').attr('content'),
      publisher: $('link[rel="publisher"]').attr('href'),
      favicon: $('link[rel="icon"]').attr('href')
    };

    if (Object.keys(metadata).length === 0) {
      return { skipped: 'No metadata found' };
    }
    const imageUrl = metadata.ogImage || metadata.twitterImage;
    if (imageUrl) {
      const finalUrl = response.request?.res?.responseUrl || url;
      const imageData = await fetchImageData(imageUrl, finalUrl);
      if (imageData) metadata.ogImageData = imageData;
    }
    return metadata;
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed fetching data: ${error.message}` }),
    };
  }
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
