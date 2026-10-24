import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';

const MAX_ROWS = 15;

const LookalikesCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const registered: { name: string, kind: string, hasMx: boolean }[] = props.data.registered || [];
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {registered.length === 0 && <p className="mb-0">✅ {t('lookalikes.none', { count: props.data.checked })}</p>}
      {registered.slice(0, MAX_ROWS).map(d => (
        <Row key={d.name} lbl="" val="">
          <span className="lbl">{d.name}</span>
          <span className="val">
            {d.kind === 'typo' ? t('lookalikes.typo') : t('lookalikes.tld')}
            {d.hasMx && ` · 📧 ${t('lookalikes.mail')}`}
          </span>
        </Row>
      ))}
      {registered.length > 0 && <p className="small text-soft mt-2 mb-0">
        {t('lookalikes.note', { checked: props.data.checked })}
        {registered.length > MAX_ROWS && ` ${t('subdomains.truncated', { shown: MAX_ROWS, total: registered.length })}`}
      </p>}
    </Card>
  );
};

export default LookalikesCard;
