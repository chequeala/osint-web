import { buildIcs, reminderDate } from 'utils/reminder';

const now = new Date('2026-10-23T12:00:00Z');

describe('reminderDate', () => {
  it('por defecto, en 3 meses', () => {
    expect(reminderDate(undefined, now)).toEqual({ date: new Date('2027-01-21T12:00:00Z'), reason: 'routine' });
  });

  it('30 días antes de que venza el dominio, si es antes de 3 meses', () => {
    const r = reminderDate('2026-12-31T00:00:00Z', now);
    expect(r.reason).toBe('domainExpiry');
    expect(r.date.toISOString().slice(0, 10)).toBe('2026-12-01');
  });

  it('ignora un vencimiento lejano o demasiado cercano', () => {
    expect(reminderDate('2028-05-01', now).reason).toBe('routine');
    expect(reminderDate('2026-11-10', now).reason).toBe('routine'); // 30 días antes ya pasó
  });
});

describe('buildIcs', () => {
  const ics = buildIcs({
    title: 'Volver a analizar r3d.mx, con Veni OSINT; ya',
    description: 'Línea 1\nLínea 2 con un texto largo que tiene que plegarse porque supera los setenta y cinco octetos permitidos',
    url: 'https://veni.chequea.la/results/https%3A%2F%2Fr3d.mx',
    date: new Date('2027-01-21T12:00:00Z'),
    now,
  });

  it('es un VCALENDAR válido con evento de día completo y aviso', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART;VALUE=DATE:20270121');
    expect(ics).toContain('DTEND;VALUE=DATE:20270122');
    expect(ics).toContain('TRIGGER:-P1D');
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('escapa comas, punto y coma y saltos de línea', () => {
    expect(ics).toContain('SUMMARY:Volver a analizar r3d.mx\\, con Veni OSINT\\; ya');
    expect(ics).toContain('DESCRIPTION:Línea 1\\nLínea 2');
  });

  it('ninguna línea supera 75 octetos', () => {
    ics.split('\r\n').forEach(line => expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75));
  });
});
