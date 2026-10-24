import { AnalysisExport } from 'utils/compare';

// Formato del JSON de "Descargar resultados": un campo por tarjeta, más _meta
// (dominio, fecha y pruebas omitidas) para poder comparar análisis después
export const buildExport = (
  everything: { id: string, result: any }[],
  address: string | undefined,
  skipped: string[],
): AnalysisExport => {
  const data: AnalysisExport = {};
  everything.forEach(item => { data[item.id] = item.result; });
  // La imagen incrustada (cientos de KB) no aporta al análisis: no se exporta
  if (data['social-tags']?.ogImageData) {
    const { ogImageData, ...rest } = data['social-tags'];
    data['social-tags'] = rest;
  }
  let domain = '';
  try { domain = new URL(address || '').hostname; } catch { /* sin dirección válida */ }
  data._meta = { tool: 'veni-osint', version: 1, domain, generatedAt: new Date().toISOString(), skipped };
  return data;
};
