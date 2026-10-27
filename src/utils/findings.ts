// Convierte los resultados técnicos en hallazgos priorizados para el resumen
// "Qué revisar primero". Los textos están en locales/*.json, bajo summary.findings.<id>.

export type Severity = 'high' | 'medium' | 'low';

export interface Finding {
  id: string;
  severity: Severity;
  params?: Record<string, string | number>;
}

export interface FindingInputs {
  ssl?: any;
  domain?: any;
  mail?: any;
  mailSkipped?: boolean;
  hsts?: any;
  httpSecurity?: any;
  dnssec?: any;
  securityTxt?: any;
  blockLists?: any;
  threats?: any;
  ports?: any;
  wordpress?: any;
  exposedFiles?: any;
  subdomains?: any;
  headers?: any;
  censorship?: any;
  firewall?: any;
  cookies?: any;
  mixedContent?: any;
  lookalikes?: any;
  dnsSecurity?: any;
  jsLibraries?: any;
  serverInfo?: any;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

// Bases de datos y escritorios remotos: nunca deberían estar abiertos a internet
const CRITICAL_PORTS = [3306, 3389, 5900, 27017, 5432, 6379];
const EXPECTED_PORTS = [80, 443];

// Fin del soporte de seguridad de PHP (https://www.php.net/supported-versions.php).
// Las ramas anteriores a 8.2 ya no tienen soporte; las posteriores a 8.5 aún no estaban.
const PHP_SECURITY_UNTIL: Record<string, string> = {
  '8.2': '2026-12-31',
  '8.3': '2027-12-31',
  '8.4': '2028-12-31',
  '8.5': '2029-12-31',
};

// Compara versiones tipo "6.5.2": negativo si a es anterior a b
export const compareVersions = (a: string, b: string): number => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
};

export const isPhpUnsupported = (version: string, now: Date): boolean => {
  const [major, minor] = version.split('.').map(Number);
  if (isNaN(major) || isNaN(minor)) return false;
  const until = PHP_SECURITY_UNTIL[`${major}.${minor}`];
  if (until) return now > new Date(`${until}T23:59:59Z`);
  return major < 8 || (major === 8 && minor < 2);
};

// Cookies de sesión o de login: si se roban, alguien puede entrar como esa persona
const SESSION_COOKIE = /sess|auth|token|login|logged_in|sid$|^sid|jwt|remember/i;

export interface CookieFlags { name: string; secure: boolean; httpOnly: boolean; sameSite: string | null; }

export const parseSetCookie = (header: string): CookieFlags => {
  const [pair, ...attrs] = header.split(';').map(s => s.trim());
  const name = pair.split('=')[0];
  const lower = attrs.map(a => a.toLowerCase());
  const sameSite = lower.find(a => a.startsWith('samesite='));
  return { name, secure: lower.includes('secure'), httpOnly: lower.includes('httponly'), sameSite: sameSite ? sameSite.split('=')[1] : null };
};

// Dirección .onion del sitio: cabecera Onion-Location o <meta http-equiv="onion-location">
export const onionAddress = (r: FindingInputs): string | null => {
  const value = r.headers?.['onion-location'] || r.mixedContent?.onionLocation;
  return typeof value === 'string' && /\.onion(\/|$)/i.test(value) ? value : null;
};

// Fechas de whois en formatos variados, incluido 20270307 (registro.br)
export const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  const date = compact ? new Date(`${compact[1]}-${compact[2]}-${compact[3]}`) : new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const daysUntil = (date: Date, now: Date) => Math.floor((date.getTime() - now.getTime()) / DAY_MS);

export const getFindings = (r: FindingInputs, now: Date = new Date()): { findings: Finding[], passed: string[] } => {
  const findings: Finding[] = [];
  const passed: string[] = [];

  // Amenazas y listas de bloqueo
  if (r.threats) {
    const t = r.threats;
    const flagged = t.safeBrowsing?.unsafe
      || t.urlHaus?.query_status === 'ok'
      || (t.phishTank?.url0 && t.phishTank.url0.in_database !== 'false');
    flagged ? findings.push({ id: 'threats', severity: 'high' }) : passed.push('threats');
  }
  if (r.blockLists?.blocklists) {
    const blocked = r.blockLists.blocklists.filter((b: any) => b.isBlocked).map((b: any) => b.server);
    blocked.length
      ? findings.push({ id: 'blocklisted', severity: 'high', params: { lists: blocked.join(', ') } })
      : passed.push('blocklisted');
  }

  // Censura: bloqueos por país según OONI (params con códigos de país; la interfaz los nombra)
  if (r.censorship?.countries) {
    const countries: { country: string, status: string }[] = r.censorship.countries;
    const confirmed = countries.filter(c => c.status === 'confirmed').map(c => c.country);
    const likely = countries.filter(c => c.status === 'likely').map(c => c.country);
    if (confirmed.length) findings.push({ id: 'censored', severity: 'high', params: { countryCodes: confirmed.join(',') } });
    if (likely.length) findings.push({ id: 'censoredLikely', severity: 'high', params: { countryCodes: likely.join(',') } });
    if (!confirmed.length && !likely.length) passed.push('censorship');
  }

  // Acceso por Tor: solo se sugiere si hay señales de bloqueo, para no meter ruido
  const onion = onionAddress(r);
  if (onion) passed.push('onion');
  else if (r.headers && findings.some(f => f.id === 'censored' || f.id === 'censoredLikely')) {
    // sin cabeceras no se sabe si tiene .onion: no concluir
    findings.push({ id: 'noOnion', severity: 'medium' });
  }

  // Protección contra ataques de denegación de servicio (DDoS)
  if (r.firewall && typeof r.firewall.hasWaf === 'boolean') {
    r.firewall.hasWaf ? passed.push('ddos') : findings.push({ id: 'noDdosProtection', severity: 'medium' });
  }

  // Vencimientos: perder el dominio o el certificado deja el sitio fuera de línea
  const domainExpiry = parseDate(r.domain?.internicData?.Registry_Expiry_Date);
  if (domainExpiry) {
    const days = daysUntil(domainExpiry, now);
    if (days < 30) findings.push({ id: 'domainExpiry', severity: 'high', params: { days: Math.max(days, 0) } });
    else passed.push('domainExpiry');
  }
  // Problemas del certificado (de otro dominio, autofirmado, sin HTTPS...)
  const sslProblems: string[] = r.ssl?.problems || [];
  if (sslProblems.includes('noHttps') || sslProblems.includes('noCertificate')) {
    findings.push({ id: 'noHttps', severity: 'high' });
  } else if (sslProblems.includes('nameMismatch')) {
    findings.push({ id: 'sslNameMismatch', severity: 'high', params: { names: (r.ssl.certNames || []).join(', ') } });
  } else if (sslProblems.includes('expired')) {
    findings.push({ id: 'sslExpired', severity: 'high' });
  } else if (sslProblems.includes('selfSigned') || sslProblems.includes('untrusted') || sslProblems.includes('notYetValid')) {
    findings.push({ id: 'sslUntrusted', severity: 'high' });
  } else if (sslProblems.includes('incompleteChain')) {
    // Chrome suele completarla solo, pero Firefox, muchos celulares y otros programas fallan
    findings.push({ id: 'sslIncompleteChain', severity: 'medium' });
  }
  if (r.ssl?.valid && r.ssl.httpRedirectsToHttps === false) {
    findings.push({ id: 'noHttpsRedirect', severity: 'medium' });
  }

  const sslExpiry = sslProblems.length ? null : parseDate(r.ssl?.valid_to);
  if (sslExpiry) {
    const days = daysUntil(sslExpiry, now);
    if (days < 0) findings.push({ id: 'sslExpired', severity: 'high' });
    else if (days < 14) findings.push({ id: 'sslExpiring', severity: 'medium', params: { days } });
    else passed.push('ssl');
  }

  // WordPress
  if (r.wordpress?.isWordPress) {
    const wp = r.wordpress;
    if (wp.usersExposed) {
      findings.push({ id: 'wpUsers', severity: 'high', params: { users: wp.users.join(', ') } });
    } else passed.push('wpUsers');
    if (wp.xmlrpcEnabled) findings.push({ id: 'wpXmlrpc', severity: 'medium' });
    else passed.push('wpXmlrpc');
    if (wp.version && wp.latestVersion && compareVersions(wp.version, wp.latestVersion) < 0) {
      // Si ni siquiera tiene el último parche de su rama, le faltan arreglos de seguridad publicados
      const missingPatches = !wp.branchLatestVersion || compareVersions(wp.version, wp.branchLatestVersion) < 0;
      findings.push({ id: 'wpOutdated', severity: missingPatches ? 'high' : 'medium', params: { version: wp.version, latest: wp.latestVersion } });
    } else if (wp.version) {
      if (wp.latestVersion) passed.push('wpUpdated');
      findings.push({ id: 'wpVersion', severity: 'low', params: { version: wp.version } });
    }
  }

  // Archivos expuestos: los de severidad alta (código, contraseñas, respaldos) van aparte
  if (r.exposedFiles?.found) {
    const found: { path: string, severity: Severity }[] = r.exposedFiles.found;
    const secrets = found.filter(f => f.severity === 'high');
    const info = found.filter(f => f.severity !== 'high');
    if (secrets.length) findings.push({ id: 'exposedFiles', severity: 'high', params: { paths: secrets.map(f => f.path).join(', ') } });
    if (info.length) {
      const severity = info.some(f => f.severity === 'medium') ? 'medium' : 'low';
      findings.push({ id: 'exposedInfo', severity, params: { paths: info.map(f => f.path).join(', ') } });
    }
    if (!found.length) passed.push('exposedFiles');
  }

  // Subdominios que apuntan a servicios que ya no existen
  if (r.subdomains?.subdomains) {
    const dangling = r.subdomains.subdomains.filter((s: any) => s.dangling).map((s: any) => s.name);
    dangling.length
      ? findings.push({ id: 'danglingCname', severity: 'high', params: { names: dangling.join(', ') } })
      : passed.push('subdomains');
  }

  // Versiones de software visibles en las cabeceras (Server, X-Powered-By)
  if (r.headers && typeof r.headers === 'object') {
    const banners = [r.headers['server'], r.headers['x-powered-by']].filter(Boolean).join(' ');
    const php = banners.match(/PHP\/(\d+\.\d+(?:\.\d+)?)/i);
    if (php && isPhpUnsupported(php[1], now)) {
      findings.push({ id: 'phpUnsupported', severity: 'high', params: { version: php[1] } });
    }
    const versions = (banners.match(/[A-Za-z][\w.-]*\/\d+(?:\.\d+)+/g) || []);
    versions.length
      ? findings.push({ id: 'versionExposed', severity: 'low', params: { versions: [...new Set(versions)].join(', ') } })
      : passed.push('versionExposed');
  }

  // Cookies sin Secure o, si son de sesión, sin HttpOnly
  if (Array.isArray(r.cookies?.headerCookies) && !r.cookies.fetchedOverHttp) {
    const cookies: CookieFlags[] = r.cookies.headerCookies.map(parseSetCookie);
    const weak = cookies.filter(c => !c.secure || (SESSION_COOKIE.test(c.name) && !c.httpOnly));
    if (weak.length) {
      const severity = weak.some(c => SESSION_COOKIE.test(c.name)) ? 'medium' : 'low';
      findings.push({ id: 'insecureCookies', severity, params: { names: weak.map(c => c.name).join(', ') } });
    } else if (cookies.length) passed.push('cookies');
  }

  // Contenido mixto: recursos http:// en una página https://
  if (r.mixedContent && typeof r.mixedContent.activeCount === 'number') {
    const { activeCount, passiveCount } = r.mixedContent;
    if (activeCount) findings.push({ id: 'mixedActive', severity: 'medium', params: { count: activeCount } });
    if (passiveCount) findings.push({ id: 'mixedPassive', severity: 'low', params: { count: passiveCount } });
    if (!activeCount && !passiveCount) passed.push('mixedContent');
  }

  // Dominios parecidos registrados. Los de tipeo con correo son la señal fuerte; con
  // nombres cortos o comunes, que existan otras terminaciones es normal (ruido)
  if (Array.isArray(r.lookalikes?.registered)) {
    const list: { name: string, kind: string, hasMx: boolean }[] = r.lookalikes.registered;
    if (list.length) {
      const strong = list.some(d => d.kind === 'typo' && d.hasMx) && (r.lookalikes.label || '').length >= 5;
      findings.push({ id: 'lookalikes', severity: strong ? 'medium' : 'low', params: { count: list.length, names: list.slice(0, 5).map(d => d.name).join(', ') } });
    } else passed.push('lookalikes');
  }

  // Librerías JavaScript con vulnerabilidades conocidas (retire.js)
  if (Array.isArray(r.jsLibraries?.libraries)) {
    const vulnerable: { name: string, version: string, vulnerabilities: { severity: string }[] }[] = r.jsLibraries.libraries.filter((l: any) => l.vulnerabilities?.length);
    if (vulnerable.length) {
      const severe = vulnerable.some(l => l.vulnerabilities.some(v => ['high', 'critical'].includes(v.severity)));
      findings.push({ id: 'vulnerableLibraries', severity: severe ? 'high' : 'medium', params: { libraries: vulnerable.map(l => `${l.name} ${l.version}`).join(', ') } });
    } else if (r.jsLibraries.libraries.length) passed.push('jsLibraries');
  }

  // Software del servidor según InternetDB (Shodan): sin soporte o con CVE asociadas a su versión
  if (r.serverInfo?.ip) {
    // Solo lo que tiene versión ("nginx 1.9.4"): es lo que se puede actualizar
    const listed = String(r.serverInfo.software || '').split(', ').filter(s => /\d/.test(s));
    const software = listed.join(', ') || r.serverInfo.software || r.serverInfo.ip;
    const tags = String(r.serverInfo.type || '').split(', ');
    const cves = String(r.serverInfo.vulns || '').split(', ').filter(Boolean);
    if (tags.includes('eol-product')) findings.push({ id: 'serverEol', severity: 'high', params: { software } });
    if (cves.length) {
      // Las más recientes primero: suelen ser las que más importan
      const recent = [...cves].sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).slice(0, 3).join(', ');
      findings.push({ id: 'serverVulns', severity: 'medium', params: { software, count: cves.length, cves: recent } });
    }
    if (!tags.includes('eol-product') && !cves.length) passed.push('serverSoftware');
  }

  // Puertos abiertos además de la web
  if (r.ports?.openPorts) {
    const extra: number[] = r.ports.openPorts.filter((p: number) => !EXPECTED_PORTS.includes(p));
    const critical = extra.filter(p => CRITICAL_PORTS.includes(p));
    if (critical.length) findings.push({ id: 'criticalPorts', severity: 'high', params: { ports: critical.join(', ') } });
    const others = extra.filter(p => !CRITICAL_PORTS.includes(p));
    if (others.length) findings.push({ id: 'openPorts', severity: 'medium', params: { ports: others.join(', ') } });
    if (!extra.length) passed.push('ports');
  }

  // Correo: sin SPF ni DMARC cualquiera puede enviar correos a nombre del dominio
  if (r.mail || r.mailSkipped) {
    const txt = (r.mail?.txtRecords || []).map((rec: any) => [].concat(rec).join('')).join(' ').toLowerCase();
    const hasSpf = txt.includes('v=spf1');
    const hasDmarc = txt.includes('v=dmarc1');
    if (!hasDmarc) findings.push({ id: 'noDmarc', severity: 'high' });
    // p=none solo observa: cualquiera puede seguir enviando correos a nombre del dominio
    else if (/v=dmarc1[^]*?;\s*p=none/.test(txt)) findings.push({ id: 'dmarcNone', severity: 'medium' });
    if (!hasSpf) findings.push({ id: 'noSpf', severity: 'medium' });
    if (hasSpf && hasDmarc && !/v=dmarc1[^]*?;\s*p=none/.test(txt)) passed.push('mail');
  }

  // Cabeceras y HTTPS
  if (r.hsts) {
    r.hsts.hstsHeader ? passed.push('hsts') : findings.push({ id: 'noHsts', severity: 'medium' });
  }
  if (r.httpSecurity) {
    const h = r.httpSecurity;
    const missing = [
      !h.contentSecurityPolicy && 'Content-Security-Policy',
      !h.xFrameOptions && 'X-Frame-Options',
      !h.xContentTypeOptions && 'X-Content-Type-Options',
    ].filter(Boolean) as string[];
    missing.length
      ? findings.push({ id: 'headers', severity: missing.length >= 2 ? 'medium' : 'low', params: { headers: missing.join(', ') } })
      : passed.push('headers');
  }

  // CAA (quién puede emitir certificados) y MTA-STS (correo cifrado entre servidores)
  if (r.dnsSecurity && Array.isArray(r.dnsSecurity.caa)) {
    r.dnsSecurity.caa.length ? passed.push('caa') : findings.push({ id: 'noCaa', severity: 'low' });
    if (r.dnsSecurity.receivesMail) {
      r.dnsSecurity.mtaSts?.mode === 'enforce' ? passed.push('mtaSts') : findings.push({ id: 'noMtaSts', severity: 'low' });
    }
  }

  // Buenas prácticas
  if (r.dnssec) {
    r.dnssec.DNSKEY?.isFound ? passed.push('dnssec') : findings.push({ id: 'noDnssec', severity: 'low' });
  }
  if (r.securityTxt) {
    r.securityTxt.isPresent ? passed.push('securityTxt') : findings.push({ id: 'noSecurityTxt', severity: 'low' });
  }

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return { findings, passed };
};
