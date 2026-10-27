const puppeteer = require('puppeteer-core');
const middleware = require('./_common/middleware');
const { skipIfUnavailable } = require('./_common/unavailable');

const handler = async (targetUrl) => {

  if (!targetUrl) {
    throw new Error('URL is missing from queryStringParameters');
  }

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'http://' + targetUrl;
  }

  try {
    new URL(targetUrl);
  } catch (error) {
    throw new Error('URL provided is invalid');
  }

  let browser = null;
  try {
      // Sin CHROME_PATH (p. ej. en Netlify) puppeteer falla por executablePath y la prueba se omite
      browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 800, height: 600 },
      executablePath: process.env.CHROME_PATH,
      headless: true,
      pipe: true, // por tubería y no por 127.0.0.1, que la protección contra SSRF bloquea
      acceptInsecureCerts: true,
    });

    let page = await browser.newPage();

    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    page.setDefaultNavigationTimeout(8000);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      const selector = 'body';
      return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (!element) {
          reject(new Error(`Error: No element found with selector: ${selector}`));
        }
        resolve();
      });
    });

    const base64Screenshot = await page.screenshot({ encoding: 'base64' });

    return { image: base64Screenshot };

  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const handlerOrSkip = skipIfUnavailable(handler, 'Este servidor no tiene un navegador para hacer capturas de pantalla.');

module.exports = middleware(handlerOrSkip);
module.exports.handler = middleware(handlerOrSkip);
