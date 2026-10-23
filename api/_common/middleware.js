const normalizeUrl = (url) => {
  return url.startsWith('http') ? url : `https://${url}`;
};

const headers = {
  'Access-Control-Allow-Origin': process.env.API_CORS_ORIGIN || '*',
  'Access-Control-Allow-Credentials': true,
  'Content-Type': 'application/json;charset=UTF-8',
};

// Errores de certificado: el sitio tiene HTTPS pero el certificado no es válido
// (de otro dominio, autofirmado, cadena incompleta...). La prueba ssl ya lo informa.
const TLS_ERROR = /certificate|self[- ]signed|UNABLE_TO_VERIFY|CERT_|altname|Hostname\/IP does not match|wrong version number|EPROTO|SSL routines/i;

const errorText = (response) => {
  if (!response || typeof response !== 'object') return '';
  if (typeof response.error === 'string') return response.error; // algunas pruebas responden 200 con { error }
  if (!response.statusCode || response.statusCode < 400) return '';
  return typeof response.body === 'string' ? response.body : JSON.stringify(response.body || '');
};

// Si una prueba falla solo por el certificado, se repite por http://, que es como la
// gente está viendo ese sitio. Nunca se desactiva la verificación de certificados.
const withHttpFallback = (handler) => async (url, ...rest) => {
  const retryOverHttp = async () => {
    const result = await handler(url.replace(/^https:\/\//i, 'http://'), ...rest);
    if (result && typeof result === 'object' && !result.statusCode && !Array.isArray(result)) {
      return { ...result, fetchedOverHttp: true };
    }
    return result;
  };
  if (!/^https:\/\//i.test(url)) return handler(url, ...rest);
  let result;
  try {
    result = await handler(url, ...rest);
  } catch (error) {
    if (TLS_ERROR.test(error.message || '')) return retryOverHttp();
    throw error;
  }
  return TLS_ERROR.test(errorText(result)) ? retryOverHttp() : result;
};

const commonMiddleware = (rawHandler) => {
  const handler = withHttpFallback(rawHandler);
  // Vercel
  const vercelHandler = async (request, response) => {
    const queryParams = request.query || {};
    const rawUrl = queryParams.url;

    if (!rawUrl) {
      return response.status(500).json({ error: 'No URL specified' });
    }

    const url = normalizeUrl(rawUrl);

    try {
      const handlerResponse = await handler(url, request);
      if (handlerResponse.body && handlerResponse.statusCode) {
        // Los handlers escritos para Lambda devuelven el body ya serializado
        const { body } = handlerResponse;
        response.status(handlerResponse.statusCode).json(typeof body === 'string' ? JSON.parse(body) : body);
      } else {
        response.status(200).json(
          typeof handlerResponse === 'object' ? handlerResponse : JSON.parse(handlerResponse)
        );
      }
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  };

  // Netlify
  const netlifyHandler = async (event, context, callback) => {
    const queryParams = event.queryStringParameters || event.query || {};
    const rawUrl = queryParams.url;

    if (!rawUrl) {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({ error: 'No URL specified' }),
        headers,
      });
      return;
    }

    const url = normalizeUrl(rawUrl);

    try {
      const handlerResponse = await handler(url, event, context);
      if (handlerResponse.body && handlerResponse.statusCode) {
        callback(null, handlerResponse);
      } else {
        callback(null, {
          statusCode: 200,
          body: typeof handlerResponse === 'object' ? JSON.stringify(handlerResponse) : handlerResponse,
          headers,
        });
      }
    } catch (error) {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
        headers,
      });
    }
  };

  // The format of the handlers varies between platforms
  // E.g. Netlify + AWS expect Lambda functions, but Vercel or Node needs standard handler
  const platformEnv = (process.env.PLATFORM || '').toUpperCase(); // Has user set platform manually?

  const nativeMode = (['VERCEL', 'NODE'].includes(platformEnv) || process.env.VERCEL || process.env.WC_SERVER);

  return nativeMode ? vercelHandler : netlifyHandler;
};

module.exports = commonMiddleware;
