import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Finding, FindingInputs, getFindings, Severity } from 'utils/findings';
import { CONTACT_EMAIL, SITE_URL } from 'config';
import { findingParams } from 'utils/countries';
import { Glossed } from 'components/misc/Glossary';
import { buildIcs, reminderDate } from 'utils/reminder';
import { dateLocale } from 'i18n';

const SummaryCard = styled.section`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  h2 {
    font-size: 1.35rem;
    margin: 0;
  }
  .counts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .count {
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 50rem;
    padding: 0.15rem 0.75rem;
  }
  .findings {
    list-style: none;
    padding: 0;
    margin: 1.25rem 0 0;
    display: grid;
    gap: 0.75rem;
  }
  .finding {
    border-left: 4px solid;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--vt-green);
  }
  .finding h3 {
    font-size: 1rem;
    margin: 0 0 0.25rem;
  }
  .finding p {
    margin: 0;
  }
  .finding .action {
    margin-top: 0.4rem;
    font-size: 0.95rem;
  }
  .sev-high { border-color: var(--danger); }
  .sev-medium { border-color: var(--warning); }
  .sev-low { border-color: var(--vt-blue); }
  .count.sev-high { background: #f8e1e3; color: var(--danger); }
  .count.sev-medium { background: #f6ecd9; color: var(--warning); }
  .count.sev-low { background: #e3ebf8; color: var(--vt-blue-deep); }
  .count.sev-ok { background: #ddf0e6; color: var(--success); }
  .badge-sev {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-right: 0.5rem;
  }
  .sev-high .badge-sev { color: var(--danger); }
  .sev-medium .badge-sev { color: var(--warning); }
  .sev-low .badge-sev { color: var(--vt-blue-deep); }
  .help {
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border);
  }
`;

interface SummaryProps extends FindingInputs {
  address: string;
  isDone: boolean;
}

const SEVERITIES: Severity[] = ['high', 'medium', 'low'];

const Summary = (props: SummaryProps): JSX.Element => {
  const { t } = useTranslation();
  const { address, isDone, ...inputs } = props;
  const { findings, passed } = getFindings(inputs);
  const host = (() => {
    try { return new URL(address).hostname; } catch { return address; }
  })();

  const findingText = (f: Finding, part: 'title' | 'desc' | 'action') =>
    t(`summary.findings.${f.id}.${part}`, findingParams(f.params));

  // El correo se arma con el resumen; la persona decide qué enviar
  const mailto = () => {
    const lines = findings.map(f => `- [${t(`summary.severity.${f.severity}`)}] ${findingText(f, 'title')}`);
    const body = [
      t('summary.mail.intro', { host }),
      '',
      ...(lines.length ? lines : [t('summary.mail.noFindings')]),
      '',
      `${t('summary.mail.results')}: ${window.location.href}`,
      '',
      t('summary.mail.outro'),
    ].join('\n');
    const subject = t('summary.mail.subject', { host });
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Recordatorio de calendario para volver a analizar (en 3 meses o antes de que venza el dominio)
  const domainExpiry = inputs.domain?.internicData?.Registry_Expiry_Date;
  const reminder = reminderDate(domainExpiry);
  const formatDay = (date: Date) => new Intl.DateTimeFormat(dateLocale(), { dateStyle: 'long' }).format(date);
  const downloadReminder = () => {
    const description = [
      t('reminder.description', { host, count: findings.length, date: formatDay(new Date()) }),
      reminder.reason === 'domainExpiry' ? t('reminder.domainExpiry', { date: formatDay(new Date(domainExpiry as string)) }) : '',
      window.location.href,
    ].filter(Boolean).join('\n\n');
    const ics = buildIcs({ title: t('reminder.title', { host }), description, url: window.location.href, date: reminder.date });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `veni-osint-recordatorio-${host}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // El navegador usa el título como nombre del PDF al guardarlo
  const printReport = () => {
    const previousTitle = document.title;
    const today = new Date().toISOString().slice(0, 10);
    document.title = `veni-osint-${host}-${today}`;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  return (
    <SummaryCard aria-labelledby="resumen-titulo" aria-live="polite">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 id="resumen-titulo">{t('summary.title')}</h2>
        <div className="counts">
          {SEVERITIES.map(sev => {
            const n = findings.filter(f => f.severity === sev).length;
            return n > 0 && <span key={sev} className={`count sev-${sev}`}>{n} {t(`summary.severity.${sev}`)}</span>;
          })}
          {passed.length > 0 && <span className="count sev-ok">{t('summary.passed', { count: passed.length })}</span>}
        </div>
      </div>
      {!isDone && <p className="small text-soft mt-2 mb-0">{t('summary.loading')}</p>}

      {findings.length > 0 ? (
        <ul className="findings">
          {findings.map(f => { const seen = new Set<string>(); return (
            <li key={f.id} className={`finding sev-${f.severity}`}>
              <h3><span className="badge-sev">{t(`summary.severity.${f.severity}`)}</span><Glossed text={findingText(f, 'title')} seen={seen} /></h3>
              <p className="text-soft"><Glossed text={findingText(f, 'desc')} seen={seen} /></p>
              <p className="action"><strong>{t('summary.whatToDo')}</strong> <Glossed text={findingText(f, 'action')} seen={seen} /></p>
            </li>
          ); })}
        </ul>
      ) : isDone && (
        <p className="mt-3 mb-0">{t('summary.allGood')}</p>
      )}

      <div className="help d-flex flex-wrap align-items-center gap-3">
        <a className="btn btn-brand rounded-pill px-4" href={mailto()}>
          <i className="bi bi-envelope me-2" aria-hidden="true"></i>{t('summary.helpButton')}
        </a>
        <button type="button" className="btn btn-outline-brand rounded-pill px-4" onClick={printReport} disabled={!isDone}
          title={isDone ? undefined : t('summary.loading')}>
          <i className="bi bi-file-earmark-pdf me-2" aria-hidden="true"></i>{t('report.button')}
        </button>
        <button type="button" className="btn btn-outline-brand rounded-pill px-4" onClick={downloadReminder} disabled={!isDone}
          title={t(reminder.reason === 'domainExpiry' ? 'reminder.hintExpiry' : 'reminder.hint', { date: formatDay(reminder.date) })}>
          <i className="bi bi-calendar-plus me-2" aria-hidden="true"></i>{t('reminder.button')}
        </button>
        <a className="btn btn-outline-brand rounded-pill px-4" href={`${SITE_URL}/checklist`} target="_blank" rel="noopener noreferrer">
          <i className="bi bi-list-check me-2" aria-hidden="true"></i>{t('summary.checklistButton')}
        </a>
        <p className="small text-soft mb-0 flex-grow-1">{t('summary.helpNote')}</p>
      </div>
    </SummaryCard>
  );
};

export default Summary;
