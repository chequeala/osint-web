import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { FindingInputs, getFindings, onionAddress, parseDate } from 'utils/findings';
import { Comparison } from 'utils/compare';
import { dateLocale } from 'i18n';
import { CONTACT_EMAIL, SITE_URL } from 'config';
import { findingParams } from 'utils/countries';
import { termsIn, TERMS } from 'utils/glossary';

// Informe para imprimir o "Guardar como PDF" desde el navegador. Solo se ve al
// imprimir (ver @media print en index.css); en pantalla está oculto.
const ReportSheet = styled.article`
  color: #1d2140;
  font-size: 11pt;
  line-height: 1.45;
  header {
    border-bottom: 2px solid #804fdc;
    padding-bottom: 0.6rem;
    margin-bottom: 1rem;
  }
  .brand {
    color: #3d5f9c;
    font-weight: 800;
    font-size: 13pt;
  }
  h1 {
    font-size: 20pt;
    margin: 0.2rem 0;
  }
  h2 {
    font-size: 13pt;
    margin: 1.2rem 0 0.5rem;
    color: #5f33b5;
  }
  .meta {
    color: #565b73;
    font-size: 9.5pt;
  }
  .alert {
    border: 1.5px solid #c2414b;
    border-radius: 6px;
    padding: 0.6rem 0.8rem;
    margin-bottom: 0.8rem;
  }
  .alert strong {
    color: #c2414b;
  }
  .finding {
    border-left: 4px solid;
    padding: 0.35rem 0 0.35rem 0.75rem;
    margin-bottom: 0.7rem;
    break-inside: avoid;
  }
  .finding h3 {
    font-size: 11pt;
    margin: 0 0 0.15rem;
  }
  .finding p {
    margin: 0.1rem 0;
  }
  .sev {
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-right: 0.4rem;
  }
  .sev-high { border-color: #c2414b; }
  .sev-high .sev { color: #c2414b; }
  .sev-medium { border-color: #a86a12; }
  .sev-medium .sev { color: #a86a12; }
  .sev-low { border-color: #86a5d9; }
  .sev-low .sev { color: #3d5f9c; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }
  th, td {
    text-align: left;
    padding: 0.3rem 0.4rem;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
  }
  tr {
    break-inside: avoid;
  }
  h2 {
    break-after: avoid;
  }
  th {
    width: 32%;
    font-weight: 600;
  }
  ul.passed {
    columns: 2;
    padding-left: 1.1rem;
    margin: 0;
  }
  footer {
    margin-top: 1.5rem;
    padding-top: 0.6rem;
    border-top: 1px solid #ddd;
    font-size: 9.5pt;
    color: #565b73;
    break-inside: avoid;
  }
`;

interface ReportProps extends FindingInputs {
  address: string;
  location?: any;
  comparison?: { comparison: Comparison, previousDate: string | null } | null;
}

const Report = (props: ReportProps): JSX.Element => {
  const { t } = useTranslation();
  const { address, location, comparison, ...inputs } = props;
  const { findings, passed } = getFindings(inputs);
  const host = (() => { try { return new URL(address).hostname; } catch { return address; } })();

  const formatDate = (value?: string) => {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat(dateLocale(), { day: 'numeric', month: 'long', year: 'numeric' }).format(date) : null;
  };
  const yesNo = (value: boolean | undefined) => (value === undefined ? null : value ? t('wordpress.yes') : t('wordpress.no'));

  const ssl = inputs.ssl;
  const whois = inputs.domain?.internicData;
  const mailTxt = (inputs.mail?.txtRecords || []).map((r: any) => [].concat(r).join('')).join(' ').toLowerCase();
  const hasMailData = !!(inputs.mail || inputs.mailSkipped);

  // Datos clave: solo las filas con información
  const facts: [string, string | null | undefined][] = [
    [t('report.facts.hosting'), location ? [location.isp, [location.city, location.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ') : null],
    [t('report.facts.server'), inputs.headers?.server],
    [t('report.facts.https'), ssl ? (ssl.valid ? `${t('sslCard.valid')} · ${ssl.issuer?.O || ''}` : t('sslBanner.title', { host })) : null],
    [t('report.facts.certExpiry'), ssl?.valid ? formatDate(ssl.valid_to) : null],
    [t('report.facts.registrar'), whois?.Registrar],
    [t('report.facts.domainExpiry'), formatDate(whois?.Registry_Expiry_Date)],
    [t('report.facts.dnssec'), inputs.dnssec ? yesNo(!!inputs.dnssec.DNSKEY?.isFound) : null],
    ['SPF', hasMailData ? yesNo(mailTxt.includes('v=spf1')) : null],
    ['DMARC', hasMailData ? yesNo(mailTxt.includes('v=dmarc1')) : null],
    ['WordPress', inputs.wordpress?.isWordPress ? (inputs.wordpress.version || t('wordpress.hidden')) : null],
    [t('censorship.tor'), onionAddress(inputs) || t('censorship.torNo')],
    [t('report.facts.ddos'), inputs.firewall ? (inputs.firewall.hasWaf ? inputs.firewall.waf : t('wordpress.no')) : null],
  ];

  const now = new Intl.DateTimeFormat(dateLocale(), { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

  return (
    <ReportSheet className="print-report" aria-hidden="true">
      <header>
        <div className="brand">chequea.la · OSINT Web</div>
        <h1>{t('report.title', { host })}</h1>
        <div className="meta">{t('report.generated', { date: now })} · {window.location.href}</div>
      </header>

      {ssl?.problems?.length > 0 && (
        <div className="alert">
          <strong>{t('sslBanner.title', { host })}</strong>
          {ssl.problems.map((p: string) => (
            <div key={p}>{t(`sslCard.problems.${p}`, { names: (ssl.certNames || []).join(', ') })}</div>
          ))}
        </div>
      )}

      <h2>{t('summary.title')}</h2>
      {findings.length === 0 && <p>{t('summary.allGood')}</p>}
      {findings.map(f => (
        <div key={f.id} className={`finding sev-${f.severity}`}>
          <h3><span className="sev">{t(`summary.severity.${f.severity}`)}</span>{t(`summary.findings.${f.id}.title`, findingParams(f.params))}</h3>
          <p>{t(`summary.findings.${f.id}.desc`, findingParams(f.params))}</p>
          <p><strong>{t('summary.whatToDo')}</strong> {t(`summary.findings.${f.id}.action`, findingParams(f.params))}</p>
        </div>
      ))}

      {comparison && <>
        <h2>{t('compare.reportTitle', { date: comparison.previousDate ? new Intl.DateTimeFormat(dateLocale(), { dateStyle: 'long' }).format(new Date(comparison.previousDate)) : '' })}</h2>
        {[['fixed', '✅'], ['added', '⚠️'], ['remaining', '⏳']].map(([group, icon]) => {
          const list = comparison.comparison[group as 'fixed' | 'added' | 'remaining'];
          return list.length > 0 && (
            <p key={group}><strong>{icon} {t(`compare.${group}`, { count: list.length })}:</strong>{' '}
              {list.map(f => t(`summary.findings.${f.id}.title`, findingParams(f.params))).join(' · ')}</p>
          );
        })}
      </>}

      <h2>{t('report.factsTitle')}</h2>
      <table>
        <tbody>
          {facts.filter(([, value]) => value).map(([label, value]) => (
            <tr key={label}><th>{label}</th><td>{value}</td></tr>
          ))}
        </tbody>
      </table>

      {passed.length > 0 && <>
        <h2>{t('report.passedTitle')}</h2>
        <ul className="passed">
          {passed.map(id => <li key={id}>{t(`report.passed.${id}`)}</li>)}
        </ul>
      </>}

      {(() => {
        // En papel no hay cursor: los términos de este informe van explicados al final
        const texts = findings.flatMap(f => ['title', 'desc', 'action'].map(part => t(`summary.findings.${f.id}.${part}`, findingParams(f.params))));
        const keys = termsIn(texts);
        return keys.length > 0 && <>
          <h2>{t('glossaryUi.reportTitle')}</h2>
          <table><tbody>
            {keys.map(key => <tr key={key}><th>{TERMS.filter(([k]) => k === key).map(([, term]) => term).pop()}</th><td>{t(`glossary.${key}`)}</td></tr>)}
          </tbody></table>
        </>;
      })()}

      <footer>
        <p>{t('report.help', { email: CONTACT_EMAIL })}</p>
        <p>{t('report.disclaimer', { site: SITE_URL.replace('https://', '') })}</p>
      </footer>
    </ReportSheet>
  );
};

export default Report;
