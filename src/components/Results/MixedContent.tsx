import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import { ListRow } from 'components/Form/Row';

const MixedContentCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const { active = [], passive = [], activeCount = 0, passiveCount = 0 } = props.data;
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {!activeCount && !passiveCount && <p className="mb-0">✅ {t('mixedContent.none')}</p>}
      {activeCount > 0 && <ListRow title={t('mixedContent.active', { count: activeCount })} list={active} />}
      {passiveCount > 0 && <ListRow title={t('mixedContent.passive', { count: passiveCount })} list={passive} />}
      {(activeCount > 0 || passiveCount > 0) && <p className="small text-soft mt-2 mb-0">{t('mixedContent.note')}</p>}
    </Card>
  );
};

export default MixedContentCard;
