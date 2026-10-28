// Recordatorio para volver a analizar el sitio, como evento de calendario (.ics).
// Se arma en el navegador: no se guarda nada en el servidor.
import { parseDate } from 'utils/findings';

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_DAYS = 90;
const BEFORE_EXPIRY_DAYS = 30;

export type ReminderReason = 'routine' | 'domainExpiry';

// Fecha del recordatorio: en 3 meses, o 30 días antes de que venza el dominio si es antes
export const reminderDate = (domainExpiry: string | undefined, now: Date = new Date()): { date: Date, reason: ReminderReason } => {
  const routine = new Date(now.getTime() + DEFAULT_DAYS * DAY_MS);
  const expiry = parseDate(domainExpiry);
  if (expiry) {
    const beforeExpiry = new Date(expiry.getTime() - BEFORE_EXPIRY_DAYS * DAY_MS);
    // al menos una semana de margen, si no el recordatorio no sirve
    if (beforeExpiry < routine && beforeExpiry.getTime() > now.getTime() + 7 * DAY_MS) {
      return { date: beforeExpiry, reason: 'domainExpiry' };
    }
  }
  return { date: routine, reason: 'routine' };
};

// RFC 5545: escapar \ ; , y saltos de línea; plegar líneas largas a 75 octetos
const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Bytes en UTF-8 (sin TextEncoder, que no existe en el entorno de pruebas de CRA)
const utf8Length = (text: string) => {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0) || 0;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
};

const fold = (line: string): string => {
  const parts: string[] = [];
  let current = '';
  for (const char of line) {
    // las líneas de continuación empiezan con un espacio, que también cuenta
    if (utf8Length(current + char) > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
};

// Fecha local (no UTC): si no, de noche en América el evento cae al día siguiente
const icsDate = (date: Date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
const icsTimestamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const buildIcs = (opts: { title: string, description: string, url: string, date: Date, now?: Date }): string => {
  const now = opts.now || new Date();
  const end = new Date(opts.date.getTime() + DAY_MS);
  const uid = `${icsTimestamp(now)}-${Math.random().toString(36).slice(2, 10)}@osint.chequea.la`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//chequea.la//OSINT Web//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsTimestamp(now)}`,
    `DTSTART;VALUE=DATE:${icsDate(opts.date)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${escapeText(opts.title)}`,
    `DESCRIPTION:${escapeText(opts.description)}`,
    `URL:${opts.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(opts.title)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
};
