// Algunas pruebas necesitan programas o claves que no existen en todos los entornos
// (p. ej. Netlify no tiene Chromium). En ese caso se marcan como
// omitidas con una explicación, en vez de aparecer como un error.
const ENVIRONMENT_ERRORS = /command not found|ENOENT|Could not find Chromium|Failed to launch the browser|executablePath|shared libraries/i;

const skipIfUnavailable = (handler, reason) => async (...args) => {
  try {
    return await handler(...args);
  } catch (error) {
    if (ENVIRONMENT_ERRORS.test(error.message || '')) return { skipped: reason };
    throw error;
  }
};

module.exports = { skipIfUnavailable };
