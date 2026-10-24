import {
  caaForIssuer, caaRecords, currentDmarcPolicy, detectMailProviders, detectServer, headersSnippet, mailRecords,
  mtaStsFiles, securityHeaders, securityTxt, wordpressHardening,
} from 'utils/generators';

const now = new Date('2026-10-23T18:30:00Z');

describe('securityTxt', () => {
  it('arma un archivo válido según RFC 9116', () => {
    const txt = securityTxt({ domain: 'ejemplo.org', contact: 'seguridad@ejemplo.org', languages: ['es', 'pt'], now });
    expect(txt).toBe([
      'Contact: mailto:seguridad@ejemplo.org',
      'Expires: 2027-09-23T18:30:00Z',
      'Preferred-Languages: es, pt',
      'Canonical: https://ejemplo.org/.well-known/security.txt',
      '',
    ].join('\n'));
  });
  it('respeta URLs de contacto y agrega PGP y política si se indican', () => {
    const txt = securityTxt({ domain: 'e.org', contact: 'https://e.org/contacto', languages: [], encryption: 'https://e.org/pgp.asc', policy: 'https://e.org/politica', now });
    expect(txt).toContain('Contact: https://e.org/contacto\n');
    expect(txt).toContain('Encryption: https://e.org/pgp.asc\n');
    expect(txt).toContain('Policy: https://e.org/politica\n');
    expect(txt).not.toContain('Preferred-Languages');
  });
});

describe('SPF y DMARC', () => {
  it('detecta proveedores por los MX', () => {
    expect(detectMailProviders(['aspmx.l.google.com', 'alt1.aspmx.l.google.com'])).toEqual(['google']);
    expect(detectMailProviders(['ejemplo-org.mail.protection.outlook.com'])).toEqual(['microsoft']);
    expect(detectMailProviders(['mail.tutanota.de'])).toEqual(['tuta']);
  });
  it('lee la política DMARC actual y sube de nivel', () => {
    expect(currentDmarcPolicy([['v=spf1 -all'], ['v=DMARC1; p=none; rua=mailto:x@e.org']])).toBe('none');
    expect(currentDmarcPolicy([['v=DMARC1; p=reject']])).toBe('reject');
    expect(currentDmarcPolicy([['v=spf1 -all']])).toBeNull();
    expect(mailRecords({ sendsMail: true, providers: ['godaddy'], policy: 'quarantine' }).dmarc).toBe('v=DMARC1; p=quarantine; fo=1');
    expect(detectMailProviders(['smtp.secureserver.net'])).toEqual(['godaddy']);
  });
  it('si ya hay SPF, conserva sus servicios e IPs y suma lo nuevo (no lo reemplaza)', () => {
    const existingSpf = 'v=spf1 include:_spf.google.com ip4:148.251.22.86/32 include:mailgun.org include:spf.mandrillapp.com ~all';
    expect(mailRecords({ sendsMail: true, providers: ['google'], existingSpf }).spf).toBe(existingSpf);
    expect(mailRecords({ sendsMail: true, providers: ['google', 'mailchimp'], existingSpf: 'v=spf1 a mx -all' }).spf)
      .toBe('v=spf1 a mx include:_spf.google.com include:servers.mcsv.net -all');
  });
  it('si no envía correo, bloquea todo', () => {
    expect(mailRecords({ sendsMail: false, providers: [] })).toEqual({ spf: 'v=spf1 -all', dmarc: 'v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s' });
  });
  it('si envía, SPF con sus servicios y DMARC en modo observación', () => {
    expect(mailRecords({ sendsMail: true, providers: ['google', 'mailchimp'], reportEmail: 'dmarc@e.org' })).toEqual({
      spf: 'v=spf1 include:_spf.google.com include:servers.mcsv.net ~all',
      dmarc: 'v=DMARC1; p=none; rua=mailto:dmarc@e.org; fo=1',
    });
  });
});

describe('cabeceras', () => {
  it('detecta el servidor', () => {
    expect(detectServer({ server: 'nginx/1.30' })).toBe('nginx');
    expect(detectServer({ server: 'cloudflare', 'cf-ray': 'x' })).toBe('cloudflare');
    expect(detectServer({ server: 'Netlify' })).toBe('netlify');
    expect(detectServer({ server: 'LiteSpeed' })).toBe('apache');
  });
  it('genera el formato de cada servidor', () => {
    const h = securityHeaders(false);
    expect(h.map(([n]) => n)).not.toContain('Strict-Transport-Security');
    expect(headersSnippet('nginx', [['X-Frame-Options', 'SAMEORIGIN']])).toBe('add_header X-Frame-Options "SAMEORIGIN" always;\n');
    expect(headersSnippet('apache', [['X-Frame-Options', 'SAMEORIGIN']])).toBe('<IfModule mod_headers.c>\n  Header always set X-Frame-Options "SAMEORIGIN"\n</IfModule>\n');
    expect(headersSnippet('netlify', [['X-Frame-Options', 'SAMEORIGIN']])).toBe('/*\n  X-Frame-Options: SAMEORIGIN\n');
    expect(securityHeaders(true)[0][0]).toBe('Strict-Transport-Security');
  });
});

describe('CAA', () => {
  it('elige la autoridad según el emisor del certificado', () => {
    expect(caaForIssuer("Let's Encrypt")).toBe('letsencrypt.org');
    expect(caaForIssuer('Sectigo Limited')).toBe('sectigo.com');
    expect(caaForIssuer('Google Trust Services')).toBe('pki.goog');
    expect(caaForIssuer('Desconocida')).toBeNull();
    expect(caaRecords(['letsencrypt.org', 'letsencrypt.org'], 'seguridad@e.org')).toEqual(['0 issue "letsencrypt.org"', '0 iodef "mailto:seguridad@e.org"']);
  });
});

describe('MTA-STS', () => {
  it('política en modo testing con los MX y registros DNS', () => {
    const f = mtaStsFiles({ mxHosts: ['aspmx.l.google.com.', 'alt1.aspmx.l.google.com'], reportEmail: 'tls@e.org', now });
    expect(f.stsRecord).toBe('v=STSv1; id=202610231830');
    expect(f.policy).toBe('version: STSv1\nmode: testing\nmx: aspmx.l.google.com\nmx: alt1.aspmx.l.google.com\nmax_age: 604800\n');
    expect(f.tlsRptRecord).toBe('v=TLSRPTv1; rua=mailto:tls@e.org');
  });
});

describe('WordPress', () => {
  it('el plugin cubre los tres problemas', () => {
    const php = wordpressHardening();
    expect(php.startsWith('<?php')).toBe(true);
    expect(php).toContain("add_filter('xmlrpc_enabled', '__return_false');");
    expect(php).toContain("/wp/v2/users");
    expect(php).toContain("remove_action('wp_head', 'wp_generator');");
  });
});
