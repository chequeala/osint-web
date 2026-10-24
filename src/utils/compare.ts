// Comparar un análisis anterior (el JSON de "Descargar resultados") con el actual,
// a nivel de hallazgos del resumen. Todo ocurre en el navegador.
import { Finding, FindingInputs, getFindings } from 'utils/findings';

export interface ExportMeta {
  tool: 'veni-osint';
  version: number;
  domain: string;
  generatedAt: string;
  skipped: string[];
}

export type AnalysisExport = Record<string, any> & { _meta?: ExportMeta };

// id de tarjeta en el JSON exportado → campo que usa getFindings
const SOURCES: [string, keyof FindingInputs][] = [
  ['ssl', 'ssl'], ['domain', 'domain'], ['mail-config', 'mail'], ['hsts', 'hsts'],
  ['http-security', 'httpSecurity'], ['dnssec', 'dnssec'], ['security-txt', 'securityTxt'],
  ['block-lists', 'blockLists'], ['threats', 'threats'], ['ports', 'ports'], ['wordpress', 'wordpress'],
  ['exposed-files', 'exposedFiles'], ['subdomains', 'subdomains'], ['headers', 'headers'],
  ['censorship', 'censorship'], ['firewall', 'firewall'], ['cookies', 'cookies'], ['mixed-content', 'mixedContent'], ['lookalikes', 'lookalikes'],
];

const isPresent = (value: any) => value !== undefined && value !== null && !(typeof value === 'object' && value.error);

// Una prueba "corrió" si tiene resultado o si se omitió a propósito (p. ej. sin correo)
const ranChecks = (data: AnalysisExport): Set<string> => {
  const skipped = new Set(data._meta?.skipped || []);
  return new Set(SOURCES.map(([id]) => id).filter(id => isPresent(data[id]) || skipped.has(id)));
};

const toInputs = (data: AnalysisExport, only: Set<string>): FindingInputs => {
  const inputs: FindingInputs = {};
  for (const [id, field] of SOURCES) {
    if (!only.has(id)) continue;
    if (isPresent(data[id])) (inputs as any)[field] = data[id];
  }
  if (only.has('mail-config') && !isPresent(data['mail-config'])) inputs.mailSkipped = true;
  return inputs;
};

export interface Comparison {
  fixed: Finding[];
  added: Finding[];
  remaining: Finding[];
  before: Finding[];
  after: Finding[];
  comparedChecks: number;
}

export const compareAnalyses = (previous: AnalysisExport, current: AnalysisExport, now: Date = new Date()): Comparison => {
  const previousRan = ranChecks(previous);
  const common = new Set([...ranChecks(current)].filter(id => previousRan.has(id)));
  const before = getFindings(toInputs(previous, common), now).findings;
  const after = getFindings(toInputs(current, common), now).findings;
  const beforeIds = new Set(before.map(f => f.id));
  const afterIds = new Set(after.map(f => f.id));
  return {
    fixed: before.filter(f => !afterIds.has(f.id)),
    added: after.filter(f => !beforeIds.has(f.id)),
    remaining: after.filter(f => beforeIds.has(f.id)),
    before,
    after,
    comparedChecks: common.size,
  };
};

// Lee el archivo cargado y revisa que sea un análisis de veni
export const parseExport = (text: string): AnalysisExport => {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid');
  const known = SOURCES.some(([id]) => id in data) || data._meta?.tool === 'veni-osint';
  if (!known) throw new Error('invalid');
  return data;
};
