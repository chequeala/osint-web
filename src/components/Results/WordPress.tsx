import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import Row, { ListRow } from 'components/Form/Row';

const WordPressCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const wp = props.data;
  const users: string[] = wp.users || [];
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {/* Con val, Row interpreta "7.1.3" como una fecha (1 de julio de 2003) */}
      <Row lbl="" val="">
        <span className="lbl">{t('wordpress.version')}</span>
        <span className="val">{wp.version || t('wordpress.hidden')}</span>
      </Row>
      { wp.latestVersion && (
        <Row lbl="" val="">
          <span className="lbl">{t('wordpress.latest')}</span>
          <span className="val">{wp.latestVersion}</span>
        </Row>
      )}
      <Row lbl={t('wordpress.usersExposed')} val={wp.usersExposed ? `❌ ${t('wordpress.yes')}` : `✅ ${t('wordpress.no')}`} />
      <Row lbl={t('wordpress.xmlrpc')} val={wp.xmlrpcEnabled ? `❌ ${t('wordpress.yes')}` : `✅ ${t('wordpress.no')}`} />
      { users.length > 0 && <ListRow title={t('wordpress.usersTitle')} list={users} /> }
    </Card>
  );
};

export default WordPressCard;
