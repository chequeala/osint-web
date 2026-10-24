import { compareAnalyses, parseExport } from 'utils/compare';

const now = new Date('2026-10-23T00:00:00Z');
const ids = (list: { id: string }[]) => list.map(f => f.id);

const before = {
  _meta: { tool: 'veni-osint' as const, version: 1, domain: 'ejemplo.org', generatedAt: '2026-09-01T00:00:00Z', skipped: [] },
  hsts: { hstsHeader: null },
  dnssec: { DNSKEY: { isFound: false } },
  'mail-config': { txtRecords: [['v=spf1 -all']] },
  wordpress: { isWordPress: true, usersExposed: true, users: ['admin'], xmlrpcEnabled: false },
};

describe('compareAnalyses', () => {
  it('separa resuelto, nuevo y pendiente', () => {
    const after = {
      _meta: { ...before._meta, generatedAt: '2026-10-23T00:00:00Z' },
      hsts: { hstsHeader: 'max-age=31536000' },                 // resuelto: noHsts
      dnssec: { DNSKEY: { isFound: false } },                    // sigue: noDnssec
      'mail-config': { txtRecords: [['v=spf1 -all']] },          // sigue: noDmarc
      wordpress: { isWordPress: true, usersExposed: false, users: [], xmlrpcEnabled: true }, // resuelto wpUsers, nuevo wpXmlrpc
    };
    const c = compareAnalyses(before, after, now);
    expect(ids(c.fixed).sort()).toEqual(['noHsts', 'wpUsers']);
    expect(ids(c.added)).toEqual(['wpXmlrpc']);
    expect(ids(c.remaining).sort()).toEqual(['noDmarc', 'noDnssec']);
  });

  it('no marca como nuevo lo que antes no se pudo revisar', () => {
    const old = { hsts: { hstsHeader: null } }; // archivo viejo: sin _meta ni prueba de correo
    const after = { hsts: { hstsHeader: null }, 'mail-config': { txtRecords: [] }, censorship: { countries: [{ country: 'VE', status: 'likely' }] } };
    const c = compareAnalyses(old, after, now);
    expect(ids(c.added)).toEqual([]);
    expect(ids(c.remaining)).toEqual(['noHsts']);
    expect(c.comparedChecks).toBe(1);
  });

  it('una prueba con error no cuenta como revisada', () => {
    const c = compareAnalyses({ hsts: { error: 'timeout' } }, { hsts: { hstsHeader: null } }, now);
    expect(c.comparedChecks).toBe(0);
    expect(ids(c.added)).toEqual([]);
  });
});

describe('parseExport', () => {
  it('acepta un análisis de veni y rechaza otros JSON', () => {
    expect(parseExport(JSON.stringify(before))._meta?.domain).toBe('ejemplo.org');
    expect(parseExport(JSON.stringify({ ssl: {} }))).toEqual({ ssl: {} });
    expect(() => parseExport('{"foo": 1}')).toThrow();
    expect(() => parseExport('[1,2]')).toThrow();
    expect(() => parseExport('no es json')).toThrow();
  });
});
