import { getFindings, parseDate } from 'utils/findings';

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
});
