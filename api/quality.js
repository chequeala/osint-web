const axios = require('axios');
const middleware = require('./_common/middleware');

const handler = async (url, event, context) => {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

  if (!apiKey) {
    return { skipped: 'Falta configurar GOOGLE_CLOUD_API_KEY para el análisis de calidad (Lighthouse).' };
  }

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&category=PWA&strategy=mobile&key=${apiKey}`;

  const response = await axios.get(endpoint);
  
  return response.data;
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
