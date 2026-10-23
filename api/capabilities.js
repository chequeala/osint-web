const fs = require('fs');

// Qué pruebas puede correr este servidor, para que la interfaz no lance las que
// van a fallar seguro (sin clave de API o sin navegador). No recibe ningún dominio.
const hasBrowser = () => {
  const path = process.env.CHROME_PATH;
  try {
    return !!path && fs.existsSync(path);
  } catch {
    return false;
  }
};

const capabilities = () => ({
  quality: !!process.env.GOOGLE_CLOUD_API_KEY,
  features: !!process.env.BUILT_WITH_API_KEY,
  browser: hasBrowser(),
});

const headers = {
  'Content-Type': 'application/json;charset=UTF-8',
  'Cache-Control': 'public, max-age=300',
};

// Node / Vercel (server.js)
module.exports = async (req, res) => res.status(200).json(capabilities());
// Netlify / AWS Lambda
module.exports.handler = async () => ({ statusCode: 200, headers, body: JSON.stringify(capabilities()) });
