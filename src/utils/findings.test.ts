import { getFindings, isPhpUnsupported, parseDate, parseSetCookie } from 'utils/findings';

const now = new Date('2026-10-23T00:00:00Z');
const ids = (r: Parameters<typeof getFindings>[0]) => getFindings(r, now).findings.map(f => f.id);

describe('parseDate', () => {
  it('entiende el formato compacto de registro.br', () => {
    expect(parseDate('20270307')?.getUTCFullYear()).toBe(2027);
  });
  it('devuelve null si no hay fecha', () => {
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate('no es fecha')).toBeNull();
  });
});

describe('getFindings', () => {
  it('sin DMARC es urgente, también si la prueba de correo se omitió', () => {
    expect(ids({ mailSkipped: true })).toEqual(['noDmarc', 'noSpf']);
    expect(ids({ mail: { txtRecords: [['v=spf1 -all']] } })).toEqual(['noDmarc']);
  });

  it('SPF y DMARC presentes cuentan como bien', () => {
    const r = getFindings({ mail: { txtRecords: [['v=spf1 -all'], ['v=DMARC1; p=reject']] } }, now);
    expect(r.findings).toEqual([]);
    expect(r.passed).toContain('mail');
  });

  it('HSTS se evalúa por la cabecera, no por la lista de precarga', () => {
    expect(ids({ hsts: { compatible: false, hstsHeader: 'max-age=31536000' } })).toEqual([]);
    expect(ids({ hsts: { compatible: false, hstsHeader: null } })).toEqual(['noHsts']);
  });

  it('separa puertos críticos de otros puertos', () => {
    const r = getFindings({ ports: { openPorts: [22, 80, 443, 3306] } }, now);
    expect(r.findings.map(f => [f.id, f.params?.ports])).toEqual([['criticalPorts', '3306'], ['openPorts', '22']]);
  });

  it('avisa del dominio por vencer y del certificado vencido', () => {
    expect(ids({ domain: { internicData: { Registry_Expiry_Date: '2026-11-10T00:00:00Z' } } })).toEqual(['domainExpiry']);
    expect(ids({ domain: { internicData: { Registry_Expiry_Date: '20280101' } } })).toEqual([]);
    expect(ids({ ssl: { valid_to: 'Oct  1 23:59:59 2026 GMT' } })).toEqual(['sslExpired']);
  });

  it('WordPress: usuarios expuestos es urgente, y ordena por gravedad', () => {
    const r = getFindings({
      dnssec: { DNSKEY: { isFound: false } },
      wordpress: { isWordPress: true, usersExposed: true, users: ['admin'], xmlrpcEnabled: true, version: '6.5' },
    }, now);
    expect(r.findings.map(f => f.severity)).toEqual(['high', 'medium', 'low', 'low']);
    expect(r.findings[0]).toMatchObject({ id: 'wpUsers', params: { users: 'admin' } });
  });

  it('no marca nada mientras no hay datos', () => {
    expect(getFindings({}, now)).toEqual({ findings: [], passed: [] });
  });

  it('separa archivos con secretos de la información técnica', () => {
    const r = getFindings({ exposedFiles: { found: [
      { path: '/.env', severity: 'high' }, { path: '/.git/HEAD', severity: 'high' }, { path: '/uploads/', severity: 'medium' },
    ] } }, now);
    expect(r.findings.map(f => [f.id, f.severity, f.params?.paths])).toEqual([
      ['exposedFiles', 'high', '/.env, /.git/HEAD'], ['exposedInfo', 'medium', '/uploads/'],
    ]);
    expect(getFindings({ exposedFiles: { found: [] } }, now).passed).toContain('exposedFiles');
  });

  it('un CNAME colgante es urgente', () => {
    const r = getFindings({ subdomains: { subdomains: [
      { name: 'viejo.ejemplo.org', dangling: true }, { name: 'vivo.ejemplo.org', dangling: false },
    ] } }, now);
    expect(r.findings).toEqual([{ id: 'danglingCname', severity: 'high', params: { names: 'viejo.ejemplo.org' } }]);
  });

  it('PHP sin soporte según la fecha', () => {
    expect(isPhpUnsupported('7.4.33', now)).toBe(true);
    expect(isPhpUnsupported('8.1.2', now)).toBe(true);
    expect(isPhpUnsupported('8.2.10', now)).toBe(false);
    expect(isPhpUnsupported('8.2.10', new Date('2027-01-01T12:00:00Z'))).toBe(true);
    expect(isPhpUnsupported('8.6.0', now)).toBe(false);
  });

  it('avisa de versiones visibles y de PHP viejo en las cabeceras', () => {
    const r = getFindings({ headers: { server: 'Apache/2.4.41 (Ubuntu)', 'x-powered-by': 'PHP/7.4.3' } }, now);
    expect(r.findings).toEqual([
      { id: 'phpUnsupported', severity: 'high', params: { version: '7.4.3' } },
      { id: 'versionExposed', severity: 'low', params: { versions: 'Apache/2.4.41, PHP/7.4.3' } },
    ]);
    expect(getFindings({ headers: { server: 'nginx' } }, now).findings).toEqual([]);
  });

  it('certificado de otro dominio: urgente, con los nombres que sí cubre', () => {
    const r = getFindings({ ssl: { valid: false, problems: ['nameMismatch', 'incompleteChain'], certNames: ['aimexico.org.mx', 'www.aimexico.org.mx'], valid_to: 'May  9 23:59:59 2027 GMT' } }, now);
    expect(r.findings).toEqual([{ id: 'sslNameMismatch', severity: 'high', params: { names: 'aimexico.org.mx, www.aimexico.org.mx' } }]);
  });

  it('sin HTTPS, cadena incompleta y http que no redirige', () => {
    expect(ids({ ssl: { valid: false, problems: ['noHttps'] } })).toEqual(['noHttps']);
    expect(getFindings({ ssl: { valid: false, problems: ['incompleteChain'] } }, now).findings[0]).toMatchObject({ id: 'sslIncompleteChain', severity: 'medium' });
    expect(ids({ ssl: { valid: true, problems: [], httpRedirectsToHttps: false, valid_to: 'Dec  1 00:00:00 2027 GMT' } })).toEqual(['noHttpsRedirect']);
    expect(ids({ ssl: { valid: true, problems: [], httpRedirectsToHttps: true, valid_to: 'Dec  1 00:00:00 2027 GMT' } })).toEqual([]);
  });

  it('censura: confirmado y posible bloqueo son urgentes; sin señales cuenta como bien', () => {
    const r = getFindings({ censorship: { countries: [
      { country: 'VE', status: 'likely' }, { country: 'CN', status: 'confirmed' }, { country: 'MX', status: 'ok' },
    ] } }, now);
    expect(r.findings.map(f => [f.id, f.params?.countryCodes])).toEqual([['censored', 'CN'], ['censoredLikely', 'VE']]);
    expect(getFindings({ censorship: { countries: [{ country: 'MX', status: 'ok' }] } }, now).passed).toContain('censorship');
  });

  it('sin protección DDoS es importante', () => {
    expect(getFindings({ firewall: { hasWaf: false } }, now).findings).toEqual([{ id: 'noDdosProtection', severity: 'medium' }]);
    expect(getFindings({ firewall: { hasWaf: true, waf: 'Deflect (eQualitie)' } }, now).passed).toContain('ddos');
  });

  it('cookies: de sesión sin HttpOnly es importante; sin Secure, recomendado', () => {
    expect(parseSetCookie('PHPSESSID=abc; path=/; Secure; SameSite=Lax')).toEqual({ name: 'PHPSESSID', secure: true, httpOnly: false, sameSite: 'lax' });
    expect(getFindings({ cookies: { headerCookies: ['PHPSESSID=abc; path=/; Secure'] } }, now).findings)
      .toEqual([{ id: 'insecureCookies', severity: 'medium', params: { names: 'PHPSESSID' } }]);
    expect(getFindings({ cookies: { headerCookies: ['lang=es; path=/'] } }, now).findings[0]).toMatchObject({ id: 'insecureCookies', severity: 'low' });
    expect(getFindings({ cookies: { headerCookies: ['wordpress_logged_in_x=1; Secure; HttpOnly'] } }, now).passed).toContain('cookies');
  });

  it('contenido mixto activo y pasivo', () => {
    expect(ids({ mixedContent: { activeCount: 2, passiveCount: 1 } })).toEqual(['mixedActive', 'mixedPassive']);
    expect(getFindings({ mixedContent: { activeCount: 0, passiveCount: 0 } }, now).passed).toContain('mixedContent');
  });

  it('dominios parecidos: tipeo con correo es importante; solo otras terminaciones, recomendado', () => {
    const typo = getFindings({ lookalikes: { label: 'amnistia', registered: [
      { name: 'arnnistia.org.mx', kind: 'typo', hasMx: true }, { name: 'amnistia.com', kind: 'tld', hasMx: true },
    ] } }, now).findings[0];
    expect(typo).toMatchObject({ id: 'lookalikes', severity: 'medium', params: { count: 2 } });
    expect(getFindings({ lookalikes: { label: 'r3d', registered: [{ name: 'r3d.com', kind: 'tld', hasMx: true }] } }, now).findings[0].severity).toBe('low');
    // nombre corto: aunque haya tipeo con correo, es fácil que coincida con otros
    expect(getFindings({ lookalikes: { label: 'r3d', registered: [{ name: 'rd3.mx', kind: 'typo', hasMx: true }] } }, now).findings[0].severity).toBe('low');
    expect(getFindings({ lookalikes: { label: 'amnistia', registered: [] } }, now).passed).toContain('lookalikes');
  });

  it('Tor: con .onion cuenta como bien; sin .onion solo se sugiere si hay bloqueo', () => {
    const blocked = { countries: [{ country: 'VE', status: 'likely' }] };
    expect(getFindings({ headers: { 'onion-location': 'http://abc.onion/' }, censorship: blocked }, now).passed).toContain('onion');
    expect(getFindings({ mixedContent: { activeCount: 0, passiveCount: 0, onionLocation: 'http://abc.onion/' } }, now).passed).toContain('onion');
    expect(ids({ headers: { server: 'nginx' }, censorship: blocked })).toEqual(['censoredLikely', 'noOnion']);
    expect(ids({ headers: { server: 'nginx' } })).toEqual([]);
  });

  it('CAA siempre; MTA-STS solo si el dominio recibe correo', () => {
    expect(ids({ dnsSecurity: { caa: [], receivesMail: false } })).toEqual(['noCaa']);
    expect(ids({ dnsSecurity: { caa: [], receivesMail: true, mtaSts: { mode: 'testing' } } })).toEqual(['noCaa', 'noMtaSts']);
    const ok = getFindings({ dnsSecurity: { caa: [{ tag: 'issue', value: 'letsencrypt.org' }], receivesMail: true, mtaSts: { mode: 'enforce' } } }, now);
    expect(ok.findings).toEqual([]);
    expect(ok.passed).toEqual(expect.arrayContaining(['caa', 'mtaSts']));
  });

  it('DMARC en p=none solo observa: importante, no cuenta como bien', () => {
    const r = getFindings({ mail: { txtRecords: [['v=spf1 include:_spf.google.com ~all'], ['v=DMARC1; p=none;']] } }, now);
    expect(r.findings).toEqual([{ id: 'dmarcNone', severity: 'medium' }]);
    expect(r.passed).not.toContain('mail');
    expect(ids({ mail: { txtRecords: [['v=spf1 -all'], ['v=DMARC1; p=quarantine']] } })).toEqual([]);
  });

  it('librerías vulnerables: alta si alguna vulnerabilidad es alta', () => {
    const r = getFindings({ jsLibraries: { libraries: [
      { name: 'jquery-mobile', version: '1.5.0-alpha.1', vulnerabilities: [{ severity: 'high' }] },
      { name: 'jquery', version: '3.7.1', vulnerabilities: [] },
    ] } }, now);
    expect(r.findings).toEqual([{ id: 'vulnerableLibraries', severity: 'high', params: { libraries: 'jquery-mobile 1.5.0-alpha.1' } }]);
    expect(getFindings({ jsLibraries: { libraries: [{ name: 'jquery', version: '1.12.4', vulnerabilities: [{ severity: 'medium' }] }] } }, now).findings[0].severity).toBe('medium');
    expect(getFindings({ jsLibraries: { libraries: [{ name: 'jquery', version: '3.7.1', vulnerabilities: [] }] } }, now).passed).toContain('jsLibraries');
  });
});
