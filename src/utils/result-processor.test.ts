import { cpeToSoftware, parseInternetDbResults } from 'utils/result-processor';

describe('InternetDB', () => {
  it('convierte los CPE en nombres legibles, sin repetir el producto', () => {
    expect(cpeToSoftware(['cpe:/a:f5:nginx', 'cpe:/a:f5:nginx:1.27.5', 'cpe:/a:apache:http_server'])).toEqual(['nginx 1.27.5', 'apache http server']);
  });

  it('arma las tarjetas de servidor y nombres de host', () => {
    const r = parseInternetDbResults({ ip: '203.0.113.7', ports: [80, 443], hostnames: ['web.example.org'], cpes: [], vulns: ['CVE-2023-44487'], tags: ['self-signed'] });
    expect(r.serverInfo).toEqual({ ip: '203.0.113.7', ports: '80, 443', software: '', vulns: 'CVE-2023-44487', type: 'self-signed' });
    expect(r.hostnames).toEqual({ domains: [], hostnames: ['web.example.org'] });
    expect(parseInternetDbResults({ ip: '203.0.113.7' }).hostnames).toBeNull();
  });
});
