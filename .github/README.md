# Veni OSINT · chequea.la

**Veni OSINT** es la herramienta de [chequea.la](https://chequea.la) para ver qué información pública entrega un sitio web (DNS, certificados, cabeceras, correo, puertos y más) y encontrar puntos débiles en su configuración. Está pensada para organizaciones y personas defensoras de derechos humanos en Latinoamérica.

👉 **[veni.chequea.la](https://veni.chequea.la)**

Está basada en [Web Check](https://github.com/lissy93/web-check), el proyecto de código abierto de [Alicia Sykes](https://aliciasykes.com), con licencia MIT.

## Qué agrega a Web Check

- **Resumen "Qué revisar primero"**: hallazgos priorizados en lenguaje sencillo, con qué hacer en cada caso, y un botón para pedir ayuda a la línea de ayuda con el resumen ya escrito.
- **Pruebas nuevas**: WordPress (usuarios expuestos, `xmlrpc.php`, versión), archivos sensibles expuestos (`.git`, `.env`, respaldos…), subdominios y CNAME colgantes, PHP sin soporte, DMARC/DKIM reales.
- **Privacidad**: el navegador solo habla con veni.chequea.la (lo garantiza la CSP de `netlify.toml`). Sin analítica ni cookies. Las consultas a servicios externos las hace el servidor.
- Diseño de chequea.la, en español y portugués (los términos técnicos quedan en inglés).

## Desarrollo

Requiere Node 22 y Yarn 4 (`corepack enable`).

```sh
PUPPETEER_SKIP_DOWNLOAD=1 yarn install
yarn build && PLATFORM=node node server.js   # interfaz y API en http://localhost:3000
yarn test run                                # pruebas
```

Copia `.env.example` a `.env` para desarrollo local (`.env` no se versiona: nunca pongas claves reales en `.env.example`).

## Claves de API (opcionales y gratuitas)

Sin ellas, esas pruebas aparecen como omitidas. En producción se cargan en Netlify (*Site configuration → Environment variables*) o con la CLI, y se aplican en el siguiente deploy:

```sh
npx netlify-cli env:set GOOGLE_CLOUD_API_KEY "..." --scope functions
```

| Variable | Enciende | Cómo conseguirla |
|---|---|---|
| `GOOGLE_CLOUD_API_KEY` | Calidad (Lighthouse) y Google Safe Browsing en Amenazas | En [console.cloud.google.com](https://console.cloud.google.com/) crea un proyecto, activa **PageSpeed Insights API** y **Safe Browsing API**, y crea una clave en *Credenciales*. Restríngela a esas dos APIs. |
| `URLHAUS_AUTH_KEY` | URLhaus (malware) en Amenazas | Crea una cuenta en [auth.abuse.ch](https://auth.abuse.ch/) y copia tu *Auth-Key*. |
| `BUILT_WITH_API_KEY` | Funciones del sitio | Cuenta gratuita en [api.builtwith.com](https://api.builtwith.com/). |

`REACT_APP_SHODAN_API_KEY` y `REACT_APP_WHO_API_KEY` se consultan desde el navegador y quedarían visibles en el código público del sitio: no las configures en producción.

## Despliegue

Se publica en **Netlify** con cada push a `main` (sitio `stupendous-douhua-04bc19`, dominio `veni.chequea.la`). El CI de GitHub Actions (`.github/workflows/ci.yml`) corre las pruebas y la compilación.

- **Si un push no aparece en el sitio**: revisa en Netlify que la publicación automática no esté detenida (*Deploys → Stop auto publishing*). Estuvo bloqueada de 2024 a 2026 y por eso "no se veían" los cambios.
- **Límite de uso**: 150 llamadas a `/api/*` por minuto e IP (unos 4 análisis), definido en `netlify.toml`. Netlify no falla el deploy si la regla está mal escrita: confírmala en la sección *post-processing* del log.
- **CSP**: si se agrega un recurso de otro dominio (script, imagen, fuente), hay que permitirlo en las cabeceras de `netlify.toml` o el navegador lo bloqueará. La idea es no hacerlo: las consultas externas van por el servidor.

## Mantenimiento

- **PHP**: las fechas de fin de soporte están en `src/utils/findings.ts` (`PHP_SECURITY_UNTIL`). Agrega cada rama nueva al salir (ver [php.net/supported-versions](https://www.php.net/supported-versions.php)).
- **security.txt** (`public/.well-known/security.txt`): `Expires` vence el **21 de octubre de 2027**.
- **Contacto**: el correo está en `src/config.ts` y en `security.txt`.

## Contacto

Escríbenos a `chequeala [at] tuta [dot] io`. Si quieres, puedes cifrar tu mensaje con nuestra [llave PGP](https://chequea.la/chequeala.asc) (opcional).

## Licencia

MIT. © Alicia Sykes (Web Check) y colaboradoras de chequea.la. Ver [LICENSE](../LICENSE).
