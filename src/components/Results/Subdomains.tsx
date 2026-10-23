import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';

const SubdomainsCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const subdomains: { name: string, active: boolean, cname: string | null, dangling: boolean }[] = props.data.subdomains || [];
  const status = (s: typeof subdomains[number]) =>
    s.dangling ? `❌ ${t('subdomains.dangling')}` : s.active ? `✅ ${t('subdomains.active')}` : `⚪ ${t('subdomains.inactive')}`;
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {subdomains.map(s => (
        <Row key={s.name} lbl="" val="">
          <span className="lbl" title={s.cname ? `CNAME → ${s.cname}` : undefined}>{s.name}</span>
          <span className="val">{status(s)}</span>
        </Row>
      ))}
      <p className="small text-soft mt-2 mb-0">
        {t('subdomains.note', { source: props.data.source })}
        {props.data.total > subdomains.length && ` ${t('subdomains.truncated', { shown: subdomains.length, total: props.data.total })}`}
      </p>
    </Card>
  );
};

export default SubdomainsCard;
