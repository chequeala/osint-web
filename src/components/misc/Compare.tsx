import { ChangeEvent, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { AnalysisExport, Comparison, compareAnalyses, parseExport } from 'utils/compare';
import { Finding } from 'utils/findings';
import { findingParams } from 'utils/countries';
import { dateLocale } from 'i18n';

const Panel = styled.section`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  h2 {
    font-size: 1.15rem;
    margin: 0 0 0.25rem;
  }
  .totals {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.75rem 0;
  }
  .total {
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 50rem;
    padding: 0.15rem 0.8rem;
    background: var(--vt-green);
  }
  h3 {
    font-size: 1rem;
    margin: 1rem 0 0.4rem;
  }
  ul {
    margin: 0;
    padding-left: 1.2rem;
  }
  li + li {
    margin-top: 0.2rem;
  }
  .fixed h3 { color: var(--success); }
  .added h3 { color: var(--danger); }
  .remaining h3 { color: var(--warning); }
  .warning {
    background: #f6ecd9;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    margin-top: 0.75rem;
    font-size: 0.9rem;
  }
  input[type=file] {
    display: none;
  }
`;

interface CompareProps {
  current: AnalysisExport;
  host: string;
  isDone: boolean;
  onCompare: (result: { comparison: Comparison, previousDate: string | null } | null) => void;
}

const Compare = ({ current, host, isDone, onCompare }: CompareProps): JSX.Element => {
  const { t } = useTranslation();
  const [previous, setPrevious] = useState<AnalysisExport | null>(null);
  const [fileDate, setFileDate] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const comparison = useMemo(() => (previous ? compareAnalyses(previous, current) : null), [previous, current]);
  const previousDate = previous?._meta?.generatedAt ? new Date(previous._meta.generatedAt) : fileDate;
  const formattedDate = previousDate
    ? new Intl.DateTimeFormat(dateLocale(), { dateStyle: 'long' }).format(previousDate)
    : null;

  const loadFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite volver a cargar el mismo archivo
    if (!file) return;
    file.text().then(text => {
      const data = parseExport(text);
      setPrevious(data);
      setFileDate(new Date(file.lastModified));
      setError('');
      const cmp = compareAnalyses(data, current);
      onCompare({ comparison: cmp, previousDate: data._meta?.generatedAt || new Date(file.lastModified).toISOString() });
    }).catch(() => {
      setError(t('compare.invalidFile'));
    });
  };

  const clear = () => {
    setPrevious(null);
    onCompare(null);
  };

  const title = (f: Finding) => t(`summary.findings.${f.id}.title`, findingParams(f.params));
  const count = (list: Finding[], severity?: string) => list.filter(f => !severity || f.severity === severity).length;
  const otherDomain = previous?._meta?.domain && previous._meta.domain !== host;

  return (
    <Panel aria-labelledby="comparar-titulo">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h2 id="comparar-titulo">{t('compare.title')}</h2>
          <p className="small text-soft mb-0">
            {comparison && formattedDate ? t('compare.comparedWith', { date: formattedDate }) : t('compare.intro')}
          </p>
        </div>
        <div className="d-flex gap-2">
          <label className={`btn btn-outline-brand rounded-pill px-3 mb-0 ${isDone ? '' : 'disabled'}`} aria-disabled={!isDone}>
            <i className="bi bi-folder2-open me-2" aria-hidden="true"></i>
            {previous ? t('compare.loadAnother') : t('compare.load')}
            <input type="file" accept="application/json,.json" onChange={loadFile} disabled={!isDone} />
          </label>
          {previous && <button type="button" className="btn btn-link px-2" onClick={clear}>{t('compare.clear')}</button>}
        </div>
      </div>

      {error && <p className="warning mb-0" role="alert">{error}</p>}
      {otherDomain && <p className="warning mb-0">{t('compare.otherDomain', { domain: previous?._meta?.domain })}</p>}
      {previous && !previous._meta && <p className="warning mb-0">{t('compare.oldFormat')}</p>}

      {comparison && <>
        <div className="totals">
          <span className="total">{t('compare.before', { count: count(comparison.before), high: count(comparison.before, 'high') })}</span>
          <span className="total">{t('compare.after', { count: count(comparison.after), high: count(comparison.after, 'high') })}</span>
        </div>
        {comparison.comparedChecks === 0 && <p className="mb-0">{t('compare.nothingInCommon')}</p>}
        {comparison.fixed.length > 0 && <div className="fixed">
          <h3>✅ {t('compare.fixed', { count: comparison.fixed.length })}</h3>
          <ul>{comparison.fixed.map(f => <li key={f.id}>{title(f)}</li>)}</ul>
        </div>}
        {comparison.added.length > 0 && <div className="added">
          <h3>⚠️ {t('compare.added', { count: comparison.added.length })}</h3>
          <ul>{comparison.added.map(f => <li key={f.id}>{title(f)}</li>)}</ul>
        </div>}
        {comparison.remaining.length > 0 && <div className="remaining">
          <h3>⏳ {t('compare.remaining', { count: comparison.remaining.length })}</h3>
          <ul>{comparison.remaining.map(f => <li key={f.id}>{title(f)}</li>)}</ul>
        </div>}
        {comparison.comparedChecks > 0 && !comparison.fixed.length && !comparison.added.length && !comparison.remaining.length &&
          <p className="mb-0">{t('compare.noIssues')}</p>}
        <p className="small text-soft mt-3 mb-0">{t('compare.privacy')}</p>
      </>}
    </Panel>
  );
};

export default Compare;
