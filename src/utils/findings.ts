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
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

// Bases de datos y escritorios remotos: nunca deberían estar abiertos a internet
const CRITICAL_PORTS = [3306, 3389, 5900, 27017, 5432, 6379];
const EXPECTED_PORTS = [80, 443];

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

  // Vencimientos: perder el dominio o el certificado deja el sitio fuera de línea
  const domainExpiry = parseDate(r.domain?.internicData?.Registry_Expiry_Date);
  if (domainExpiry) {
    const days = daysUntil(domainExpiry, now);
    if (days < 30) findings.push({ id: 'domainExpiry', severity: 'high', params: { days: Math.max(days, 0) } });
    else passed.push('domainExpiry');
  }
  const sslExpiry = parseDate(r.ssl?.valid_to);
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
    if (wp.version) findings.push({ id: 'wpVersion', severity: 'low', params: { version: wp.version } });
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
    if (!hasSpf) findings.push({ id: 'noSpf', severity: 'medium' });
    if (hasSpf && hasDmarc) passed.push('mail');
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
