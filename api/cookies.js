const axios = require('axios');
const puppeteer = require('puppeteer-core');
const middleware = require('./_common/middleware');

const getPuppeteerCookies = async (url) => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
    pipe: true, // por tubería y no por 127.0.0.1, que la protección contra SSRF bloquea
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const navigationPromise = page.goto(url, { waitUntil: 'networkidle2' });
        const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Puppeteer took too long!')), 3000)
    );
    await Promise.race([navigationPromise, timeoutPromise]);
    return await page.cookies();
  } finally {
    await browser.close();
  }
};

const handler = async (url) => {
  let headerCookies = null;
  let clientCookies = null;

  try {
    const response = await axios.get(url, {
      withCredentials: true,
      maxRedirects: 5,
    });
    headerCookies = response.headers['set-cookie'];
  } catch (error) {
    if (error.response) {
      return { error: `Request failed with status ${error.response.status}: ${error.message}` };
    } else if (error.request) {
      return { error: `No response received: ${error.message}` };
    } else {
      return { error: `Error setting up request: ${error.message}` };
    }
  }

  try {
    // Solo si hay navegador; sin él (p. ej. en Netlify) quedan las cookies de las cabeceras
    if (process.env.CHROME_PATH) clientCookies = await getPuppeteerCookies(url);
  } catch (_) {
    clientCookies = null;
  }

  if (!headerCookies && (!clientCookies || clientCookies.length === 0)) {
    return { skipped: 'No cookies' };
  }

  return { headerCookies, clientCookies };
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
