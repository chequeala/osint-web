import i18n from 'i18n';
import { translateServerMessage } from 'utils/server-messages';

describe('translateServerMessage', () => {
  afterAll(() => i18n.changeLanguage('es'));

  it('traduce los mensajes del servidor al portugués, con sus datos', async () => {
    await i18n.changeLanguage('pt');
    expect(translateServerMessage('El sitio no tiene robots.txt')).toBe('O site não tem robots.txt.');
    expect(translateServerMessage('El sitio respondió con una verificación anti-robots; no se pudo revisar WordPress')).toMatch(/^O site respondeu com uma verificação anti-robôs/);
    expect(translateServerMessage('ejemplo.org no aparece en whois.pir.org')).toBe('ejemplo.org não aparece em whois.pir.org.');
    expect(translateServerMessage('Falta configurar BUILT_WITH_API_KEY para detectar funciones del sitio.'))
      .toBe('Falta configurar a chave BUILT_WITH_API_KEY no servidor.');
  });

  it('también traduce los mensajes en inglés heredados de Web Check', async () => {
    await i18n.changeLanguage('es');
    expect(translateServerMessage('No mail server in use on this domain')).toMatch(/no usa correo propio/);
    expect(translateServerMessage("Skipping, as r3d.mx isn't ranked in the top 100 million sites yet."))
      .toBe('r3d.mx no está entre los sitios más visitados del mundo.');
    expect(translateServerMessage('unable to verify the first certificate')).toMatch(/certificado HTTPS no es válido/);
  });

  it('deja igual lo que no reconoce', () => {
    expect(translateServerMessage('algo inesperado')).toBe('algo inesperado');
  });

  it('usa plural correcto en la barra de progreso', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.t('progressbar.countFailed', { count: 1 })).toBe('1 fallida');
    expect(i18n.t('progressbar.countFailed', { count: 3 })).toBe('3 fallidas');
    await i18n.changeLanguage('pt');
    expect(i18n.t('progressbar.countSkipped', { count: 1 })).toBe('1 ignorada');
  });

  it('explica el bloqueo de direcciones privadas', async () => {
    await i18n.changeLanguage('pt');
    expect(translateServerMessage('Dirección no permitida: 127.0.0.1 apunta a una red privada o local'))
      .toBe('O Veni só analisa sites públicos: 127.0.0.1 aponta para uma rede privada ou local.');
  });
});
