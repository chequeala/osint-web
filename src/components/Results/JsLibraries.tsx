import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';

const JsLibrariesCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const libraries: { name: string, version: string, source: string, vulnerabilities: { severity: string, summary: string | null, cves: string[], fixedIn: string | null }[] }[] = props.data.libraries || [];
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {libraries.length === 0 && <p className="mb-0">✅ {t('jsLibraries.none', { count: props.data.checkedScripts })}</p>}
      {libraries.map(lib => (
        <Row key={`${lib.name}@${lib.version}`} lbl="" val="">
          <span className="lbl" title={lib.source}>{lib.name} {lib.version}</span>
          <span className="val" title={lib.vulnerabilities.map(v => [v.summary, ...v.cves].filter(Boolean).join(' · ')).join('\n') || undefined}>
            {lib.vulnerabilities.length ? `❌ ${t('jsLibraries.vulnerable', { count: lib.vulnerabilities.length })}` : `✅ ${t('jsLibraries.ok')}`}
          </span>
        </Row>
      ))}
      <p className="small text-soft mt-2 mb-0">
        {t('jsLibraries.note')} <a href="https://github.com/RetireJS/retire.js" target="_blank" rel="noopener noreferrer">retire.js</a>
      </p>
    </Card>
  );
};

export default JsLibrariesCard;
