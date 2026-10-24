import { allTermKeys, splitTerms, termsIn } from 'utils/glossary';
import es from 'locales/es.json';
import pt from 'locales/pt.json';

const marked = (text: string) => splitTerms(text).filter(p => typeof p !== 'string').map(p => (p as { term: string }).term);

describe('splitTerms', () => {
  it('marca términos y conserva el texto completo', () => {
    const text = 'Falta DMARC en el correo; sin DMARC es fácil el phishing.';
    const pieces = splitTerms(text);
    expect(pieces.map(p => (typeof p === 'string' ? p : p.term)).join('')).toBe(text);
    expect(marked(text)).toEqual(['DMARC', 'phishing']); // DMARC solo la primera vez
  });

  it('prefiere el término más largo y respeta palabras completas', () => {
    expect(marked('El dominio no usa DNSSEC')).toEqual(['DNSSEC']);
    expect(marked('consulta ipwho.is y la IP 1.2.3.4')).toEqual(['IP']);
    expect(marked('Agrega la cabecera Strict-Transport-Security')).toEqual(['Strict-Transport-Security']);
    expect(marked('Falta TLS-RPT y TLS')).toEqual(['TLS-RPT', 'TLS']);
  });

  it('.onion solo como término suelto, no dentro de una dirección', () => {
    expect(marked('una dirección .onion permite')).toEqual(['.onion']);
    expect(marked('http://abc.onion/')).toEqual([]);
  });

  it('con seen compartido, cada término se marca una sola vez en el grupo', () => {
    const seen = new Set<string>();
    expect(splitTerms('No hay registro CAA', seen).filter(p => typeof p !== 'string')).toHaveLength(1);
    expect(splitTerms('El registro CAA indica…', seen).filter(p => typeof p !== 'string')).toHaveLength(0);
  });

  it('termsIn junta los términos de varios textos sin repetir', () => {
    expect(termsIn(['Falta HSTS', 'Sin HSTS ni DNSSEC']).sort()).toEqual(['dnssec', 'hsts']);
  });
});

describe('definiciones', () => {
  it('todas las claves tienen definición en español y portugués', () => {
    const keys = allTermKeys();
    expect(keys.filter(k => !(es as any).glossary?.[k])).toEqual([]);
    expect(keys.filter(k => !(pt as any).glossary?.[k])).toEqual([]);
  });
});
